'use client';
import { useEffect, useRef, useState } from 'react';
import { ENDPOINT } from '@/lib/config';

// Contrôle des tickets repas à l'accueil : la caméra lit le QR code du client, le script Google vérifie
// la signature, le paiement et que les tickets n'ont pas déjà été remis. La remise se fait en un clic, une seule fois.

type Etat = 'ok' | 'remis' | 'deja' | 'nonpaye' | 'inconnu' | 'faux' | 'probleme';
type Trouve = { ref: string; code: string; nom: string; email: string; repas: number; retrait: string };
type Reponse = { ok: boolean; erreur?: string; etat?: Etat; ref?: string; nom?: string; moyennes?: number; grandes?: number; offerts?: number; type_offert?: string; retrait?: string };

// Forme d'un code (R- ticket repas, P- bon partenaire…). Filtre grossier : c'est le script qui décide.
const CODE_RE = /^[A-Z]-[A-Z0-9]{8}-[0-9A-F]{12}$/;
const normaliser = (brut: string) => brut.trim().toUpperCase();
const VIDES_POUR_LIBERER = 4;   // ~1 s sans voir le dernier QR avant de pouvoir le relire
const CLE_PIN = 'accueil-code';

async function appeler(action: 'controle' | 'retirer', code: string, pin: string): Promise<Reponse> {
  const u = new URL(ENDPOINT);
  u.searchParams.set('action', action); u.searchParams.set('code', code); u.searchParams.set('pin', pin);
  const r = await fetch(u.toString());
  return r.json();
}

async function chercher(q: string, pin: string): Promise<{ ok: boolean; erreur?: string; resultats?: Trouve[] }> {
  const u = new URL(ENDPOINT);
  u.searchParams.set('action', 'recherche'); u.searchParams.set('q', q); u.searchParams.set('pin', pin);
  const r = await fetch(u.toString());
  return r.json();
}

const TITRES: Record<Etat, [string, string]> = {
  ok: ['VALIDE', 'Payé, tickets pas encore remis.'],
  remis: ['TICKETS REMIS', 'C’est noté dans le Sheet.'],
  deja: ['DÉJÀ REMIS', 'Ce QR code a déjà servi : ne rien remettre.'],
  nonpaye: ['NON PAYÉ', 'La réservation existe mais le paiement n’est pas confirmé.'],
  inconnu: ['INCONNU', 'Aucune réservation avec cette référence.'],
  faux: ['QR CODE INVALIDE', 'Ce n’est pas un ticket du marché (ou il a été modifié).'],
  probleme: ['À VÉRIFIER', 'Ce bon partenaire n’a pas de nombre de repas reconnu : ne rien remettre, appelez l’organisation.'],
};
const COULEUR: Record<Etat, string> = { ok: 'vert', remis: 'vert', deja: 'rouge', nonpaye: 'orange', inconnu: 'rouge', faux: 'rouge', probleme: 'orange' };

export default function ScannerAccueil() {
  const [pin, setPin] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const [res, setRes] = useState<Reponse | null>(null);
  const [code, setCode] = useState('');
  const [q, setQ] = useState('');
  const [trouves, setTrouves] = useState<Trouve[] | null>(null);
  const [camera, setCamera] = useState<'off' | 'on' | 'refus'>('off');
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  // pause : la caméra ne lit rien pendant une vérification ou l'affichage d'un résultat.
  const pause = useRef(false);
  // Dernier code vérifié (caméra ou saisie) : ignoré tant qu'il reste devant la caméra, relu seulement après ~1 s sans lui.
  const dernier = useRef({ code: '', vides: VIDES_POUR_LIBERER });
  function remiseAZero() { pause.current = false; dernier.current = { code: '', vides: VIDES_POUR_LIBERER }; }

  // Code accueil gardé le temps de l'onglet seulement.
  useEffect(() => { try { const p = sessionStorage.getItem(CLE_PIN); if (p) { setPin(p); setConnecte(true); } } catch {} }, []);

  async function connexion(e: React.FormEvent) {
    e.preventDefault();
    setAttente(true); setErreur('');
    try {
      const r = await appeler('controle', '', pin.trim());
      if (!r.ok) { setErreur(r.erreur || 'Code refusé.'); return; }
      try { sessionStorage.setItem(CLE_PIN, pin.trim()); } catch {}
      setConnecte(true);
    } catch { setErreur('Pas de connexion au script Google.'); } finally { setAttente(false); }
  }

  /** Vérifie un code (lu par la caméra ou tapé). La caméra reste en pause jusqu'à « Scanner le suivant ». */
  async function controler(brut: string) {
    const c = normaliser(brut);
    pause.current = true;
    dernier.current = { code: c, vides: 0 };
    setCode(c); setErreur('');
    if (!CODE_RE.test(c)) { setRes({ ok: true, etat: 'faux' }); return; }
    setAttente(true);
    let affiche = false;
    try {
      const r = await appeler('controle', c, pin);
      if (!r.ok) { setErreur(r.erreur || 'Erreur.'); if (/incorrect/.test(r.erreur || '')) deconnexion(); return; }
      setRes(r); affiche = true;
      try { navigator.vibrate?.(r.etat === 'ok' ? 80 : [200, 80, 200]); } catch {}
    } catch { setErreur('Pas de connexion. Réessayez.'); } finally {
      setAttente(false);
      if (!affiche) pause.current = false;   // pas de résultat à l'écran (erreur) : la caméra reprend
    }
  }

  async function remettre() {
    setAttente(true);
    try {
      const r = await appeler('retirer', code, pin);
      if (!r.ok) { setErreur(r.erreur || 'Erreur.'); return; }
      setRes(r);
    } catch { setErreur('Pas de connexion : rien n’a été noté, réessayez.'); } finally { setAttente(false); }
  }

  /** Ticket perdu : recherche par nom ou e-mail, puis on ouvre le ticket choisi comme s'il avait été scanné. */
  async function rechercher(e: React.FormEvent) {
    e.preventDefault();
    if (q.trim().length < 3) return;
    setAttente(true); setErreur(''); setTrouves(null);
    try {
      const r = await chercher(q.trim(), pin);
      if (!r.ok) { setErreur(r.erreur || 'Erreur.'); if (/incorrect/.test(r.erreur || '')) deconnexion(); return; }
      setTrouves(r.resultats || []);
    } catch { setErreur('Pas de connexion. Réessayez.'); } finally { setAttente(false); }
  }
  function ouvrir(t: Trouve) { setTrouves(null); setQ(''); controler(t.code); }

  function suivant() { dernier.current.vides = 0; setRes(null); setCode(''); setErreur(''); pause.current = false; video.current?.play().catch(() => {}); }
  function deconnexion() { try { sessionStorage.removeItem(CLE_PIN); } catch {} setConnecte(false); setPin(''); setRes(null); setCode(''); remiseAZero(); arreter(); }

  function arreter() { flux.current?.getTracks().forEach(t => t.stop()); flux.current = null; setCamera('off'); }

  async function demarrer() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      remiseAZero();
      flux.current = s; setCamera('on');
    } catch { setCamera('refus'); }
  }

  // Boucle de lecture : une image toutes les 250 ms, en pause pendant l'affichage d'un résultat.
  useEffect(() => {
    if (camera !== 'on' || !video.current || !flux.current) return;
    const v = video.current; v.srcObject = flux.current; v.play().catch(() => {});
    const toile = document.createElement('canvas'); const ctx = toile.getContext('2d', { willReadFrequently: true });
    let fini = false; let lire: typeof import('jsqr').default | null = null;
    import('jsqr').then(m => { lire = m.default; });
    const tour = () => {
      if (fini) return;
      if (lire && ctx && !pause.current && v.readyState >= 2 && v.videoWidth) {
        const l = Math.min(640, v.videoWidth), h = Math.round(v.videoHeight * l / v.videoWidth);
        toile.width = l; toile.height = h; ctx.drawImage(v, 0, 0, l, h);
        const r = lire(ctx.getImageData(0, 0, l, h).data, l, h, { inversionAttempts: 'dontInvert' });
        const lu = r?.data ? normaliser(r.data) : '';
        const d = dernier.current;
        if (lu !== d.code) d.vides++;   // le dernier code n'est plus devant la caméra (image vide ou autre code)
        else d.vides = 0;
        if (lu && (lu !== d.code || d.vides >= VIDES_POUR_LIBERER)) controler(lu);
      }
      setTimeout(tour, 250);
    };
    tour();
    return () => { fini = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera]);

  useEffect(() => () => arreter(), []);

  if (!connecte) {
    return (
      <form className="acc-box carte" onSubmit={connexion}>
        <h1>Accueil · tickets repas</h1>
        <p className="doux">Réservé à l’équipe de l’accueil. Entrez le code donné par l’organisation.</p>
        <label>Code accueil<input type="password" inputMode="numeric" autoComplete="off" value={pin} onChange={e => setPin(e.target.value)} maxLength={30} /></label>
        <button className="btn plein" disabled={attente || !pin.trim()}>{attente ? 'Vérification…' : 'Entrer'}</button>
        {erreur && <p className="err" role="alert">{erreur}</p>}
      </form>
    );
  }

  const etat = res?.etat;
  return (
    <div className="acc-box carte">
      <div className="acc-haut"><h1>Contrôle des tickets</h1><button type="button" className="acc-lien" onClick={deconnexion}>Quitter</button></div>

      {/* La vidéo reste toujours en place (masquée pendant un résultat) : sinon, au scan suivant, l'image reste noire. */}
      <div className="acc-scan" hidden={!!res}>
        <>
          <div className="acc-cam">
            {camera === 'on' ? <video ref={video} playsInline muted /> : (
              <button type="button" className="btn plein" onClick={demarrer}>📷 Activer la caméra</button>
            )}
            {camera === 'refus' && <p className="err">Caméra refusée : autorisez-la dans le navigateur, ou tapez le code ci-dessous.</p>}
            {attente && <div className="acc-attente">Vérification…</div>}
          </div>
          <form className="acc-manuel" onSubmit={e => { e.preventDefault(); controler(code); }}>
            <label>Ou tapez le code sous le QR<input value={code} onChange={e => setCode(e.target.value)} placeholder="R-XXXXXXXX-XXXXXXXXXXXX ou P-…" autoCapitalize="characters" autoComplete="off" spellCheck={false} maxLength={40} /></label>
            <button className="btn" disabled={attente || !code.trim()}>Vérifier</button>
          </form>
          <form className="acc-cherche" onSubmit={rechercher}>
            <label>Ticket perdu ? Cherchez par nom ou e-mail<input type="search" value={q} onChange={e => { setQ(e.target.value); setTrouves(null); }} placeholder="Ex. : Dupont ou dupont@gmail.com" autoComplete="off" spellCheck={false} maxLength={60} /></label>
            <button className="btn" disabled={attente || q.trim().length < 3}>Rechercher</button>
            {trouves && (trouves.length === 0
              ? <p className="doux">Aucune réservation payée ne correspond.</p>
              : <ul className="acc-trouves">
                  {trouves.map(t => (
                    <li key={t.ref}>
                      <button type="button" onClick={() => ouvrir(t)} disabled={attente}>
                        <b>{t.nom}</b>
                        <span>{t.email} · {t.ref} · {t.repas} repas</span>
                        <span className={t.retrait ? 'deja' : 'libre'}>{t.retrait ? t.retrait : 'Pas encore remis'}</span>
                      </button>
                    </li>
                  ))}
                </ul>)}
          </form>
        </>
      </div>

      {res && etat && (
        <div className={'acc-res ' + COULEUR[etat]} role="status">
          <b>{TITRES[etat][0]}</b>
          <p>{etat === 'deja' && res.retrait ? res.retrait + '. ' : ''}{TITRES[etat][1]}</p>
          {res.nom && (
            <ul>
              <li>Au nom de <b>{res.nom}</b> · {res.ref}</li>
              {!!res.moyennes && <li><b>{res.moyennes}</b> moyenne{res.moyennes > 1 ? 's' : ''} portion{res.moyennes > 1 ? 's' : ''}</li>}
              {!!res.grandes && <li><b>{res.grandes}</b> grande{res.grandes > 1 ? 's' : ''} portion{res.grandes > 1 ? 's' : ''}</li>}
              {!!res.offerts && <li><b>+ {res.offerts}</b> offert{res.offerts > 1 ? 's' : ''} ({(res.type_offert || 'moyenne').toLowerCase()})</li>}
              {(() => { const e = (res.moyennes || 0) + (res.grandes || 0) + (res.offerts || 0); return e > 0 && <li className="acc-entrees"><b>{e}</b> entrée{e > 1 ? 's' : ''} gratuite{e > 1 ? 's' : ''} au marché</li>; })()}
            </ul>
          )}
          {etat === 'ok' && <button type="button" className="btn plein" disabled={attente} onClick={remettre}>{attente ? 'Enregistrement…' : 'Remettre les tickets'}</button>}
          <button type="button" className="btn" onClick={suivant}>Scanner le suivant</button>
        </div>
      )}
      {erreur && <p className="err" role="alert">{erreur}</p>}
    </div>
  );
}
