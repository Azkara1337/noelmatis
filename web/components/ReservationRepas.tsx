'use client';
import { useEffect, useState } from 'react';
import Formulaire from './Formulaire';
import { OFFRE_REPAS, PAIEMENT, PRIX_GRANDE, PRIX_MOYENNE } from '@/lib/config';

const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';
const MAX = 50;

/** Un compteur − n + pour une portion. */
function Compteur({ id, titre, prix, n, setN }: { id: string; titre: string; prix: number; n: number; setN: (n: number) => void }) {
  return (
    <div className="rep-portion">
      <div className="rep-t"><b>{titre}</b><span>{fmt(prix)} TTC</span></div>
      <div className="rep-cpt">
        <button type="button" aria-label={'Une ' + titre.toLowerCase() + ' de moins'} onClick={() => setN(Math.max(0, n - 1))} disabled={n === 0}>−</button>
        <output id={id} aria-live="polite">{n}</output>
        <button type="button" aria-label={'Une ' + titre.toLowerCase() + ' de plus'} onClick={() => setN(Math.min(MAX, n + 1))} disabled={n === MAX}>+</button>
      </div>
    </div>
  );
}

export default function ReservationRepas() {
  const [m, setM] = useState(2);
  const [g, setG] = useState(0);
  const [type, setType] = useState('Moyenne');
  // L'offre se calcule après le chargement (date du visiteur), pour éviter un écart entre le serveur et le navigateur.
  const [offreActive, setOffreActive] = useState(true);
  useEffect(() => { setOffreActive(Date.now() <= Date.parse(OFFRE_REPAS.fin)); }, []);

  const nb = m + g;
  const offerts = offreActive ? Math.floor(nb / OFFRE_REPAS.lot) : 0;
  const total = fmt(m * PRIX_MOYENNE + g * PRIX_GRANDE);
  const manque = offreActive ? OFFRE_REPAS.lot - (nb % OFFRE_REPAS.lot) : 0;

  return (
    <div className="repas">
      <div className="rep-g">
        <div className="rep-calc">
          <div className="rep-portions">
            <Compteur id="nr-m" titre="Moyenne portion" prix={PRIX_MOYENNE} n={m} setN={setM} />
            <Compteur id="nr-g" titre="Grande portion" prix={PRIX_GRANDE} n={g} setN={setG} />
          </div>
          <div className="rep-prix"><b id="rtot">{total}</b><span>TTC · {nb} repas{offerts > 0 && <><br /><strong>+ {offerts} offert{offerts > 1 ? 's' : ''}</strong></>}</span></div>
        </div>
        {offreActive && (
          <div className="rep-offre">
            <b>🎁 5 repas achetés = 1 offert</b>
            <span>Moyenne ou grande portion, au choix. Pour toute réservation jusqu&apos;au {OFFRE_REPAS.finTexte}.</span>
            {nb > 0 && offerts === 0 && <em>Encore {manque} repas pour en avoir un offert.</em>}
            {offerts > 0 && <em>Vous avez {offerts} repas offert{offerts > 1 ? 's' : ''}{manque < OFFRE_REPAS.lot ? `, encore ${manque} pour le suivant` : ''}.</em>}
          </div>
        )}
        <ol className="etapes">
          <li><span>1</span><div><b>Je fais ma demande en ligne</b><p className="doux">Le nombre de repas, en deux minutes.</p></div></li>
          <li><span>2</span><div><b>Je reçois la facture par e-mail</b><p className="doux">Je règle par virement : ma réservation est confirmée.</p></div></li>
          <li><span>3</span><div><b>Je reçois mes tickets et je mange sur place</b><p className="doux">Tickets par e-mail ou à l&apos;accueil, à échanger dans le stand de mon choix, pendant les 3 jours du marché.</p></div></li>
        </ol>
      </div>
      <Formulaire
        id="frepas" type="repas"
        champs={['nom', 'email', 'tel', 'profil', 'repas', 'total_ttc', 'code_promo', 'moyennes', 'grandes', 'offerts', 'offert_type']}
        requis={['nom', 'email', 'repas']}
        erreur="Indiquez votre nom, votre e-mail et au moins un repas."
        titreMerci="Demande envoyée"
        recap={v => `Merci ${v.nom} ! Votre demande de ${v.repas} repas (${v.moyennes} moyenne${+v.moyennes > 1 ? 's' : ''}, ${v.grandes} grande${+v.grandes > 1 ? 's' : ''}, ${v.total_ttc} TTC)${+v.offerts > 0 ? ` + ${v.offerts} offert${+v.offerts > 1 ? 's' : ''} (${v.offert_type.toLowerCase()})` : ''} est bien envoyée. La facture arrive à ${v.email} : la réservation est confirmée dès le paiement.`}
        bouton={<>Réserver <span id="rbtn">{nb} repas · {total}</span></>}
        apres={<p className="doux paie" style={{ fontSize: '12px' }}>{PAIEMENT}</p>}
      >
        <h3>Mes tickets repas</h3>
        <div className="deux"><label>Nom<input id="re-nom" name="nom" autoComplete="name" /></label><label>E-mail<input id="re-mail" name="email" type="email" autoComplete="email" /></label></div>
        <label>Téléphone<input id="re-tel" name="tel" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="06 12 34 56 78" /></label>
        <label>Je réserve en tant que<select id="re-type" name="profil"><option>Particulier</option><option>Entreprise (facture)</option></select></label>
        {offerts > 0 && <label>{offerts > 1 ? 'Mes repas offerts' : 'Mon repas offert'}<select name="offert_type" value={type} onChange={e => setType(e.target.value)}><option value="Moyenne">Moyenne portion</option><option value="Grande">Grande portion</option></select></label>}
        <label><span>Code promo <small className="facultatif">(facultatif)</small></span><input name="code_promo" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={30} placeholder="Ex. NOEL2026" /></label>
        <input type="hidden" name="repas" value={nb > 0 ? String(nb) : ''} />
        <input type="hidden" name="moyennes" value={String(m)} />
        <input type="hidden" name="grandes" value={String(g)} />
        <input type="hidden" name="offerts" value={String(offerts)} />
        <input type="hidden" name="total_ttc" value={total} />
      </Formulaire>
    </div>
  );
}
