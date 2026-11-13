import type { Metadata } from 'next';
import Link from 'next/link';
import PageLegale, { Champ } from '@/components/Legal';
import { CONDITIONS, OFFRE_REPAS, ORGANISATEUR, PAIEMENT, PRIX_GRANDE, PRIX_MOYENNE, TELEPHONE } from '@/lib/config';

export const metadata: Metadata = { title: "Conditions générales" };

export default function Cgu() {
  const c = CONDITIONS;
  return (
    <PageLegale titre="Conditions générales" sous="Utilisation du site et réservations">
      <h2>1. Objet</h2>
      <p>Ces conditions encadrent l'utilisation du site du Marché de Noël des vendredi 18, samedi 19 et dimanche 20 décembre 2026, organisé par <Champ v={ORGANISATEUR.nom} />, et les demandes envoyées depuis le site : stands, repas et partenariats. Envoyer un formulaire vaut acceptation de ces conditions.</p>

      <h2>2. Utilisation du site</h2>
      <p>Le site est gratuit et accessible à tous. Vous vous engagez à donner des informations exactes dans les formulaires et à ne pas envoyer de fausses demandes. L'organisateur peut ignorer toute demande abusive.</p>

      <h2>3. Stands exposants</h2>
      <ul>
        <li>Le formulaire est une <b>demande</b> : il ne réserve pas le stand. L'organisation vous rappelle pour confirmer l'emplacement, puis vous envoie la facture : le stand n'est réservé qu'à réception du paiement.</li>
        <li>Le stand choisi sur le plan est un souhait. L'organisation peut proposer un autre emplacement selon les disponibilités et l'équilibre du marché.</li>
        <li>Les prix affichés sont hors taxes, pour les 3 jours.</li>
        <li><b>Paiement :</b> <Champ v={c.paiementStand} /></li>
        <li><b>Annulation par l'exposant :</b> <Champ v={c.annulationStand} /></li>
        <li>L'exposant reste responsable de son matériel, de ses produits et du respect des règles d'hygiène et de sécurité qui s'appliquent à son activité.</li>
      </ul>

      <h2>4. Repas</h2>
      <ul>
        <li>Prix : {PRIX_MOYENNE} € TTC la portion moyenne, {PRIX_GRANDE} € TTC la grande portion. Pour toute réservation jusqu'au {OFFRE_REPAS.finTexte} inclus, {OFFRE_REPAS.lot} repas achetés donnent droit à 1 repas offert (moyenne ou grande, au choix). 1 ticket = 1 portion, à échanger dans les stands de restauration du marché, pendant les 3 jours.</li>
        <li><b>Paiement et retrait :</b> {PAIEMENT}</li>
        <li><b>Annulation :</b> <Champ v={c.annulationRepas} /></li>
        <li>Les repas étant servis à une date déterminée, il n'y a pas de droit de rétractation (article L221-28 du Code de la consommation).</li>
      </ul>

      <h2>5. Partenaires</h2>
      <ul>
        <li>Le formulaire partenaire est une demande de contact. L'offre est validée par téléphone, puis par un devis ou une facture.</li>
        <li>Les prix affichés sont hors taxes. <b>Paiement :</b> <Champ v={c.paiementPartenaire} /></li>
        <li>Le partenaire fournit son logo avant le 1er décembre 2026 et garantit avoir le droit de l'utiliser.</li>
      </ul>

      <h2>6. Modification ou annulation de l'événement</h2>
      <p>Le programme, les invités et les animations peuvent évoluer. Si l'événement est annulé par l'organisateur, les sommes versées pour les stands, les repas et les offres partenaires sont remboursées.</p>

      <h2>7. Responsabilité</h2>
      <p>Les visiteurs restent responsables de leurs effets personnels et des enfants qui les accompagnent, notamment dans l'espace de jeux gonflables.</p>

      <h2>8. Litiges</h2>
      <p>Ces conditions sont soumises au droit français. En cas de difficulté, contactez d'abord l'organisation au {TELEPHONE} : nous cherchons toujours une solution à l'amiable.</p>
      <p><b>Médiation de la consommation :</b> <Champ v={c.mediateur} /></p>
      <p>Vos données personnelles sont traitées comme indiqué sur la page <Link href="/confidentialite/">Données personnelles</Link>.</p>
    </PageLegale>
  );
}
