'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ENDPOINT, TELEPHONE } from '@/lib/config';
import type { Valeurs } from './Formulaire';

export type Quoi = 'repas' | 'stand' | 'partenaire';
const PREFIXE: Record<Quoi, string> = { repas: 'R', stand: 'S', partenaire: 'P' };
const QUOIS: Quoi[] = ['repas', 'stand', 'partenaire'];

/** Référence de la demande (R- repas, S- stand, P- partenaire) : relie la ligne du Sheet au paiement Stripe. */
export function useReference(quoi: Quoi) {
  const [ref, setRef] = useState('');
  useEffect(() => {
    const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789', b = new Uint32Array(8);
    crypto.getRandomValues(b);
    setRef(PREFIXE[quoi] + '-' + Array.from(b, x => a[x % a.length]).join(''));
  }, [quoi]);
  return ref;
}

/** Paramètres envoyés au script. Le montant n'en fait pas partie : le script le recalcule. */
function parametres(quoi: Quoi, v: Valeurs, code: string): Record<string, string> {
  const base = { action: 'paiement', quoi, email: v.email, ref: v.ref, code };
  if (quoi === 'repas') return { ...base, m: v.moyennes || '0', g: v.grandes || '0', type: v.offert_type || '' };
  if (quoi === 'stand') return { ...base, cat: v.categorie, stand: v.stand || '' };
  return { ...base, offre: v.offre };
}

export type Lancement = { url: string } | { promo: string } | { erreur: true };

/** Demande la page de paiement Stripe au script. */
export async function lancerPaiement(quoi: Quoi, v: Valeurs, code: string): Promise<Lancement> {
  try {
    const r = await fetch(`${ENDPOINT}?${new URLSearchParams(parametres(quoi, v, code))}`);
    const d = await r.json();
    if (d && d.ok && typeof d.url === 'string' && d.url.startsWith('https://checkout.stripe.com/')) return { url: d.url };
    if (d && d.promo) return { promo: `Code promo « ${code} » : ${d.erreur}.` };
  } catch { /* réseau */ }
  return { erreur: true };
}

/**
 * Bouton de secours, affiché seulement si l'ouverture directe du paiement a échoué
 * (code promo refusé, réseau) : il permet de réessayer sans refaire le formulaire.
 */
export function BoutonPaiement({ v, quoi = 'repas', montant, probleme }: { v: Valeurs; quoi?: Quoi; montant: string; probleme?: Lancement }) {
  const [etat, setEtat] = useState<'pret' | 'attente' | 'erreur'>(probleme && 'erreur' in probleme ? 'erreur' : 'pret');
  const [code, setCode] = useState(v.code_promo || '');
  const [promo, setPromo] = useState(probleme && 'promo' in probleme ? probleme.promo : '');
  async function payer(c = code) {
    setEtat('attente'); setPromo('');
    const r = await lancerPaiement(quoi, v, c);
    if ('url' in r) { window.location.href = r.url; return; }
    if ('promo' in r) { setPromo(r.promo); setEtat('pret'); return; }
    setEtat('erreur');
  }
  return (
    <div className="payer-z">
      {promo ? (
        <>
          <p className="err" role="alert">{promo}</p>
          <button type="button" className="btn plein payer" onClick={() => { setCode(''); payer(''); }} disabled={etat === 'attente'}>{etat === 'attente' ? 'Ouverture du paiement…' : `Payer ${montant} sans le code`}</button>
        </>
      ) : (
        <button type="button" className="btn plein payer" onClick={() => payer()} disabled={etat === 'attente'}>{etat === 'attente' ? 'Ouverture du paiement…' : code ? `Payer en ligne · code ${code}` : `Payer ${montant} en ligne`}</button>
      )}
      <p className="doux payer-note">{etat === 'erreur' ? `Le paiement n’a pas pu s’ouvrir. Réessayez dans un instant ou appelez le ${TELEPHONE}.` : 'Paiement sécurisé par Stripe · carte bancaire, Apple Pay, Google Pay'}</p>
    </div>
  );
}

const SUITE: Record<Quoi, { merci: string; etapes: string[]; retour: string; page: string }> = {
  repas: {
    merci: 'Merci ! Vos repas sont réglés.',
    etapes: ['Votre ticket repas avec QR code arrive par e-mail dans quelques minutes, avec votre facture (pensez à regarder les spams).', 'Le jour du marché, présentez le QR code à l’accueil : on vous remet vos tickets.', 'Échangez-les dans le stand de votre choix, pendant les 3 jours.'],
    retour: 'Réserver d’autres repas', page: '/repas/',
  },
  stand: {
    merci: 'Merci ! Votre stand est réglé.',
    etapes: ['Vous recevez par e-mail la confirmation de paiement et votre facture.', 'L’organisation vous appelle pour confirmer votre emplacement.', 'Installation le vendredi 18 décembre de 8 h à 11 h, ouverture à 14 h.'],
    retour: 'Revoir le plan des stands', page: '/stand/',
  },
  partenaire: {
    merci: 'Merci de soutenir le Marché de Noël !',
    etapes: ['Vous recevez par e-mail la confirmation de paiement et votre facture.', 'Vos repas offerts arrivent dans un e-mail séparé : un bon avec QR code, à présenter à l’accueil pour récupérer les tickets.', 'Nous vous rappelons sous 48 h. Pensez à nous envoyer votre logo avant le 1er décembre.'],
    retour: 'Voir le mur des partenaires', page: '/mur/',
  },
};

type Etat = 'verif' | 'paye' | 'nonpaye' | 'annule' | 'erreur' | 'vide';

/** Page /paiement/ : retour de Stripe (?type=…&session=cs_… ou ?type=…&annule=1). */
export function PagePaiement() {
  const [etat, setEtat] = useState<Etat | null>(null);
  const [quoi, setQuoi] = useState<Quoi>('repas');
  const [total, setTotal] = useState('');
  const [ref, setRef] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const t = q.get('type') as Quoi;
    if (QUOIS.includes(t)) setQuoi(t);
    const session = q.get('session') || '';
    if (q.get('annule')) { setEtat('annule'); return; }
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(session)) { setEtat('vide'); return; }
    setEtat('verif');
    fetch(`${ENDPOINT}?${new URLSearchParams({ action: 'verif', session })}`)
      .then(r => r.json())
      .then(d => {
        if (!d || !d.ok) { setEtat('erreur'); return; }
        setTotal(d.total ? `${String(d.total).replace('.', ',')} €` : '');
        setRef(d.ref || '');
        setEtat(d.paye ? 'paye' : 'nonpaye');
      })
      .catch(() => setEtat('erreur'));
  }, []);

  const s = SUITE[quoi];
  if (!etat) return <div className="paie-carte carte" style={{ minHeight: 260 }} aria-hidden="true" />;
  if (etat === 'verif') return (
    <div className="paie-carte carte verif" role="status"><span className="paie-ic">⏳</span><h2>Vérification du paiement…</h2><p className="doux">Quelques secondes, on confirme avec la banque.</p></div>
  );
  if (etat === 'paye') return (
    <div className="paie-carte carte paye" role="status">
      <span className="paie-ic">✓</span>
      <h2>Paiement confirmé</h2>
      <p className="paie-merci">{s.merci}{total && <> <b>{total}</b> réglés.</>}</p>
      <ol className="paie-etapes">{s.etapes.map((e, i) => <li key={i}><span>{i + 1}</span>{e}</li>)}</ol>
      {ref && <p className="doux paie-ref">Référence : <b>{ref}</b></p>}
      <div className="paie-btns"><Link className="btn plein" href="/">Retour à l’accueil</Link><Link className="btn" href={s.page}>{s.retour}</Link></div>
      <p className="doux paie-note">Une question ? Appelez le {TELEPHONE}, ou répondez simplement à notre e-mail.</p>
    </div>
  );
  const autres: Record<Exclude<Etat, 'verif' | 'paye'>, [string, string, string]> = {
    annule: ['✕', 'Paiement annulé', 'Aucun montant n’a été débité. Vous pouvez reprendre votre réservation quand vous voulez.'],
    nonpaye: ['!', 'Paiement non finalisé', `Votre paiement n’a pas abouti et rien n’a été débité. Vous pouvez réessayer, ou appeler le ${TELEPHONE}.`],
    erreur: ['?', 'Paiement à vérifier', `Nous n’avons pas pu vérifier le paiement automatiquement. Si vous avez été débité, tout est bon : vous recevrez votre e-mail de confirmation. Une question ? ${TELEPHONE}.`],
    vide: ['?', 'Aucun paiement en cours', 'Cette page affiche le résultat d’un paiement. Choisissez ce que vous voulez réserver.'],
  };
  const [ic, titre, texte] = autres[etat];
  return (
    <div className={'paie-carte carte ' + etat} role="status">
      <span className="paie-ic">{ic}</span>
      <h2>{titre}</h2>
      <p>{texte}</p>
      <div className="paie-btns"><Link className="btn plein" href={s.page}>{etat === 'vide' ? s.retour : 'Reprendre ma réservation'}</Link><Link className="btn" href="/">Retour à l’accueil</Link></div>
    </div>
  );
}

/** Ancien bandeau (anciennes adresses de retour ?paiement=…) : renvoie vers la page /paiement/. */
export function RetourPaiement({ quoi = 'repas' }: { quoi?: Quoi }) {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get('paiement'), session = q.get('session') || '';
    if (p === 'annule') window.location.replace(`/paiement/?type=${quoi}&annule=1`);
    else if (p === 'ok' && session) window.location.replace(`/paiement/?type=${quoi}&session=${encodeURIComponent(session)}`);
  }, [quoi]);
  return null;
}
