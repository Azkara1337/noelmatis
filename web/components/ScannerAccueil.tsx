'use client';
import { useEffect, useRef, useState } from 'react';
import { ENDPOINT } from '@/lib/config';

// Contrôle des tickets repas à l'accueil : la caméra lit le QR code du client, le script Google vérifie
// la signature, le paiement et que les tickets n'ont pas déjà été remis. La remise se fait en un clic, une seule fois.

type Etat = 'ok' | 'remis' | 'deja' | 'nonpaye' | 'inconnu' | 'faux';
type Reponse = { ok: boolean; erreur?: string; etat?: Etat; ref?: string; nom?: string; moyennes?: number; grandes?: number; offerts?: number; type_offert?: string; retrait?: string };

// R- : ticket repas · P- : bon repas d'un partenaire
const CODE_RE = /^[RP]-[A-Z0-9]{8}-[0-9A-F]{12}$/;
const CLE_PIN = 'accueil-code';

async function appeler(action: 'controle' | 'retirer', code: string, pin: string): Promise<Reponse> {
  const u = new URL(ENDPOINT);
  u.searchParams.set('action', action); u.searchParams.set('code', code); u.searchParams.set('pin', pin);
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
};
const COULEUR: Record<Etat, string> = { ok: 'vert', remis: 'vert', deja: 'rouge', nonpaye: 'orange', inconnu: 'rouge', faux: 'rouge' };

export default function ScannerAccueil() {
  const [pin, setPin] = useState('');
  const [connecte, setConnecte] = useState(false);
  const [erreur, setErreur] = useState('');
  const [attente, setAttente] = useState(false);
  const [res, setRes] = useState<Reponse | null>(null);
  const [code, setCode] = useState('');
  const [camera, setCamera] = useState<'off' | 'on' | 'refus'>('off');
  const video = useRef<HTMLVideoElement>(null);
  const flux = useRef<MediaStream | null>(null);
  const pause = useRef(false);
  // Dernier QR lu : on l'ignore quelques secondes après « Scanner le suivant » (il est souvent encore devant la caméra).
  const dernier = useRef({ code: '', jusqua: 0 });

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

  async function controler(brut: string) {
    const c = brut.trim().toUpperCase();
    setCode(c); setErreur('');
    if (!CODE_RE.test(c)) { setRes({ ok: true, etat: 'faux' }); return; }
    setAttente(true);
    try {
      const r = await appeler('controle', c, pin);
      if (!r.ok) { setErreur(r.erreur || 'Erreur.'); if (/incorrect/.test(r.erreur || '')) deconnexion(); return; }
      setRes(r);
      try { navigator.vibrate?.(r.etat === 'ok' ? 80 : [200, 80, 200]); } catch {}
    } catch { setErreur('Pas de connexion. Réessayez.'); } finally { setAttente(false); }
  }

  async function remettre() {
    setAttente(true);
    try {
      const r = await appeler('retirer', code, pin);
      if (!r.ok) { setErreur(r.erreur || 'Erreur.'); return; }
      setRes(r);
    } catch { setErreur('Pas de connexion : rien n’a été noté, réessayez.'); } finally { setAttente(false); }
  }

  function suivant() { dernier.current.jusqua = Date.now() + 4000; setRes(null); setCode(''); setErreur(''); pause.current = false; video.current?.play().catch(() => {}); }
  function deconnexion() { try { sessionStorage.removeItem(CLE_PIN); } catch {} setConnecte(false); setPin(''); arreter(); }

  function arreter() { flux.current?.getTracks().forEach(t => t.stop()); flux.current = null; setCamera('off'); }

  async function demarrer() {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
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
        const lu = r?.data?.trim().toUpperCase();
        if (lu && !(lu === dernier.current.code && Date.now() < dernier.current.jusqua)) { dernier.current.code = lu; pause.current = true; controler(lu); }
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
