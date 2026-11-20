'use client';
import { useEffect, useState } from 'react';
import { ENDPOINT, TELEPHONE } from '@/lib/config';
import type { Valeurs } from './Formulaire';

export type Quoi = 'repas' | 'stand' | 'partenaire';
const PREFIXE: Record<Quoi, string> = { repas: 'R', stand: 'S', partenaire: 'P' };

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

/** Bouton « Payer en ligne » : le script Google crée la page de paiement Stripe (prix recalculé côté serveur). */
export function BoutonPaiement({ v, quoi = 'repas', montant }: { v: Valeurs; quoi?: Quoi; montant: string }) {
  const [etat, setEtat] = useState<'pret' | 'attente' | 'erreur'>('pret');
  // Code promo tapé dans le formulaire : vérifié et appliqué par le script (onglet « Codes promo » du Sheet).
  const [code, setCode] = useState(v.code_promo || '');
  const [promo, setPromo] = useState('');
  async function payer(c = code) {
    setEtat('attente'); setPromo('');
    try {
      const r = await fetch(`${ENDPOINT}?${new URLSearchParams(parametres(quoi, v, c))}`);
      const d = await r.json();
      if (d && d.ok && typeof d.url === 'string' && d.url.startsWith('https://checkout.stripe.com/')) { window.location.href = d.url; return; }
      if (d && d.promo) { setPromo(`Code promo « ${c} » : ${d.erreur}.`); setEtat('pret'); return; }
      setEtat('erreur');
    } catch {
      setEtat('erreur');
    }
  }
  return (
    <div className="payer-z">
      {promo ? (
        <>
          <p className="err" role="alert">{promo}</p>
          <button type="button" className="btn plein payer" onClick={() => { setCode(''); payer(''); }} disabled={etat === 'attente'}>{etat === 'attente' ? 'Ouverture du paiement…' : `Payer ${montant} sans le code`}</button>
        </>
      ) : (
        <button type="button" className="btn plein payer" onClick={() => payer()} disabled={etat === 'attente'}>{etat === 'attente' ? 'Ouverture du paiement…' : code ? `Payer en ligne · code ${code} appliqué` : `Payer ${montant} en ligne`}</button>
      )}
      <p className="doux payer-note">{etat === 'erreur' ? `Le paiement n’a pas pu s’ouvrir. Réessayez dans un instant ou appelez le ${TELEPHONE}.` : 'Paiement sécurisé par Stripe · carte bancaire, Apple Pay, Google Pay'}</p>
    </div>
  );
}

const MERCI: Record<Quoi, string> = {
  repas: 'Votre ticket repas avec QR code arrive par e-mail dans quelques minutes (pensez à regarder les spams). Le jour du marché, présentez-le à l’accueil pour récupérer vos tickets.',
  stand: 'L’organisation vous appelle pour confirmer votre emplacement. Vous recevez aussi un e-mail de confirmation.',
  partenaire: 'Merci de soutenir le Marché de Noël ! Nous vous rappelons sous 48 h pour votre logo, les photos et vidéos, et vos repas offerts.',
};

/** Bandeau affiché au retour de Stripe (?paiement=ok&session=… ou ?paiement=annule). */
export function RetourPaiement({ quoi = 'repas' }: { quoi?: Quoi }) {
  const [etat, setEtat] = useState<null | 'verif' | 'paye' | 'nonpaye' | 'annule' | 'erreur'>(null);
  const [total, setTotal] = useState('');
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const p = q.get('paiement'), session = q.get('session') || '';
    if (p === 'annule') { setEtat('annule'); return; }
    if (p !== 'ok' || !/^cs_(test|live)_[A-Za-z0-9]+$/.test(session)) return;
    setEtat('verif');
    fetch(`${ENDPOINT}?${new URLSearchParams({ action: 'verif', session })}`)
      .then(r => r.json())
      .then(d => { if (d && d.ok) { setTotal(d.total ? `${String(d.total).replace('.', ',')} €` : ''); setEtat(d.paye ? 'paye' : 'nonpaye'); } else setEtat('erreur'); })
      .catch(() => setEtat('erreur'));
  }, []);
  if (!etat) return null;
  const textes = {
    verif: ['Vérification du paiement…', ''],
    paye: ['Paiement confirmé ✓', `Merci ! ${total ? total + ' réglés. ' : ''}${MERCI[quoi]} Votre facture vous est envoyée automatiquement par e-mail.`],
    nonpaye: ['Paiement non finalisé', `Votre paiement n’a pas abouti. Vous pouvez refaire votre demande ci-dessous, ou appeler le ${TELEPHONE}.`],
    annule: ['Paiement annulé', 'Aucun montant n’a été débité. Vous pouvez refaire votre demande ci-dessous quand vous voulez.'],
    erreur: ['Paiement à vérifier', `Nous n’avons pas pu vérifier le paiement automatiquement. Si vous avez été débité, tout est bon : l’organisation le verra. Une question ? ${TELEPHONE}.`],
  }[etat];
  return (
    <div className={'retour-paie carte ' + etat} role="status">
      <b>{textes[0]}</b>{textes[1] && <p>{textes[1]}</p>}
    </div>
  );
}
