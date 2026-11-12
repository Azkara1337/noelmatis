'use client';
import { useState, type FormEvent, type ReactNode } from 'react';
import { ENDPOINT, TELEPHONE } from '@/lib/config';

export type Valeurs = Record<string, string>;

/**
 * Envoi vers l'Apps Script : no-cors + corps JSON, sans en-tête personnalisé.
 * C'est voulu : Apps Script accepte la requête sans pré-vérification CORS.
 * La réponse est opaque, donc on ne sait pas si le Sheet l'a bien reçue : on vérifie dans le Sheet.
 */
async function envoyer(data: Valeurs): Promise<'ok' | 'maquette'> {
  if (!ENDPOINT) return 'maquette';
  await fetch(ENDPOINT, { method: 'POST', mode: 'no-cors', body: JSON.stringify(data) });
  return 'ok';
}

type Props = {
  id: string;
  className?: string;
  type: 'stand' | 'repas' | 'partenaire';
  /** Champs (attribut name) à envoyer, dans l'ordre. */
  champs: string[];
  requis: string[];
  erreur: string;
  titreMerci: string;
  recap: (v: Valeurs) => string;
  /** Texte et classe du bouton d'envoi. */
  bouton: ReactNode;
  boutonClass?: string;
  /** Contenu affiché sous le message d'erreur (ex. modalités de paiement). */
  apres?: ReactNode;
  children: ReactNode;
};

export default function Formulaire({ id, className, type, champs, requis, erreur, titreMerci, recap, bouton, boutonClass = 'btn plein', apres, children }: Props) {
  const [manque, setManque] = useState(false);
  const [echec, setEchec] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [merci, setMerci] = useState<string | null>(null);

  async function soumettre(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (String(fd.get('site_web') || '')) return; // anti-spam : champ caché rempli = robot
    const v: Valeurs = {};
    champs.forEach(k => { v[k] = String(fd.get(k) ?? '').trim(); });
    if (requis.some(k => !v[k])) { setEchec(false); setManque(true); return; }
    setManque(false); setEchec(false); setEnvoi(true);
    try {
      const r = await envoyer({ type, page: location.href, ...v });
      setMerci(recap(v) + (r === 'maquette' ? ' (Maquette : la demande n’est pas encore envoyée.)' : ` Sans nouvelles de notre part sous 48 h, appelez le ${TELEPHONE}.`));
    } catch {
      setEchec(true);
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <form id={id} className={className} noValidate onSubmit={soumettre}>
      <div className="corps" style={{ display: 'grid', gap: '12px' }} hidden={merci !== null}>
        <input className="hp" name="site_web" tabIndex={-1} autoComplete="off" aria-hidden="true" />
        {children}
        <button className={boutonClass} type="submit" disabled={envoi}>{envoi ? 'Envoi…' : bouton}</button>
        <p className="err" hidden={!manque && !echec}>{echec ? `L’envoi n’a pas marché. Réessayez ou appelez le ${TELEPHONE}.` : erreur}</p>
        {apres}
        <p className="rgpd">Vos coordonnées servent uniquement à traiter votre demande et sont supprimées au plus tard le 31 janvier 2027. <a href="/confidentialite/">Données personnelles</a> · <a href="/cgu/">Conditions générales</a></p>
      </div>
      <div className="merci" hidden={merci === null}><h3>{titreMerci}</h3><p className="doux recap">{merci}</p></div>
    </form>
  );
}
