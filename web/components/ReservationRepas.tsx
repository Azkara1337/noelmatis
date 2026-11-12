'use client';
import { useState } from 'react';
import Formulaire from './Formulaire';
import { PAIEMENT, PRIX_REPAS } from '@/lib/config';

const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';

export default function ReservationRepas() {
  const [n, setN] = useState(2);
  const total = fmt(n * PRIX_REPAS);
  return (
    <div className="repas">
      <div className="rep-g">
        <div className="rep-calc">
          <div><label htmlFor="nr">Combien de repas ?</label><div className="val" id="nrv">{n}</div><input id="nr" type="range" min="1" max="30" value={n} onChange={e => setN(+e.target.value)} /></div>
          <div className="rep-prix"><b id="rtot">{total}</b><span>TTC · <span id="runit">{fmt(PRIX_REPAS)}</span> le repas</span></div>
        </div>
        <ol className="etapes">
          <li><span>1</span><div><b>Je fais ma demande en ligne</b><p className="doux">Le nombre de repas, en deux minutes.</p></div></li>
          <li><span>2</span><div><b>Je reçois la facture par e-mail</b><p className="doux">Je règle par virement : ma réservation est confirmée.</p></div></li>
          <li><span>3</span><div><b>Je reçois mes tickets et je mange sur place</b><p className="doux">Tickets par e-mail ou à l'accueil, à échanger dans le stand de mon choix, le vendredi soir ou le samedi.</p></div></li>
        </ol>
      </div>
      <Formulaire
        id="frepas" type="repas"
        champs={['nom', 'email', 'tel', 'profil', 'repas', 'total_ttc']}
        requis={['nom', 'email']}
        erreur="Indiquez votre nom et votre e-mail."
        titreMerci="Demande envoyée"
        recap={v => `Merci ${v.nom} ! Votre demande de ${v.repas} repas (${v.total_ttc} TTC) est bien envoyée. La facture arrive à ${v.email} : la réservation est confirmée dès le paiement.`}
        bouton={<>Réserver <span id="rbtn">{n} repas · {total}</span></>}
        apres={<p className="doux paie" style={{ fontSize: '12px' }}>{PAIEMENT}</p>}
      >
        <h3>Mes tickets repas</h3>
        <div className="deux"><label>Nom<input id="re-nom" name="nom" autoComplete="name" /></label><label>E-mail<input id="re-mail" name="email" type="email" autoComplete="email" /></label></div>
        <label>Téléphone<input id="re-tel" name="tel" type="tel" autoComplete="tel" /></label>
        <label>Je réserve en tant que<select id="re-type" name="profil"><option>Particulier</option><option>Entreprise (facture)</option></select></label>
        <input type="hidden" name="repas" value={String(n)} />
        <input type="hidden" name="total_ttc" value={total} />
      </Formulaire>
    </div>
  );
}
