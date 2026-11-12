import type { Metadata } from 'next';
import PageLegale, { Champ } from '@/components/Legal';
import { CONTACT_MAIL, ORGANISATEUR } from '@/lib/config';

export const metadata: Metadata = { title: 'Données personnelles' };

export default function Confidentialite() {
  const mail = CONTACT_MAIL ? <a href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a> : <Champ />;
  return (
    <PageLegale titre="Données personnelles" sous="Ce que nous faisons de vos informations (RGPD)">
      <h2>Responsable du traitement</h2>
      <p><Champ v={ORGANISATEUR.nom} />, <Champ v={ORGANISATEUR.adresse} label="adresse à compléter" />. Contact : {mail}.</p>

      <h2>Quelles données, et pourquoi</h2>
      <p>Nous collectons uniquement ce que vous saisissez dans les formulaires du site :</p>
      <ul>
        <li><b>Demande de stand :</b> nom, activité, téléphone, e-mail, stand souhaité, catégorie, message. Pour vous rappeler, confirmer votre emplacement et organiser votre venue.</li>
        <li><b>Réservation de repas :</b> nom, e-mail, téléphone, profil (particulier ou entreprise), nombre de repas. Pour préparer vos tickets et, si besoin, votre facture.</li>
        <li><b>Demande de partenariat :</b> entreprise, nom, téléphone, e-mail, nombre de salariés, offre choisie, message. Pour vous rappeler et établir votre offre.</li>
      </ul>
      <p>Ces traitements sont nécessaires pour répondre à votre demande et exécuter la réservation (article 6.1.b du RGPD). Les champs obligatoires sont signalés dans chaque formulaire : sans eux, nous ne pouvons pas traiter la demande.</p>
      <p>Vos données ne sont ni vendues, ni louées, ni utilisées pour de la publicité.</p>

      <h2>Qui y a accès</h2>
      <p>Uniquement l'équipe d'organisation du marché, et les prestataires techniques qui nous permettent de les recevoir :</p>
      <ul>
        <li><b>Google</b> (Google Sheets et Gmail) : stockage des demandes et envoi des e-mails de confirmation.</li>
        <li><b>Vercel</b> : hébergement du site.</li>
      </ul>
      <p>Ces prestataires peuvent traiter des données hors de l'Union européenne, notamment aux États-Unis. Ces transferts sont encadrés par le cadre de protection des données UE–États-Unis (Data Privacy Framework) ou par les clauses contractuelles types de la Commission européenne.</p>

      <h2>Combien de temps</h2>
      <p>Les demandes sont supprimées au plus tard le 31 janvier 2027. Seules les factures et pièces comptables sont conservées plus longtemps, pendant la durée imposée par la loi (10 ans).</p>

      <h2>Cookies et mesure d'audience</h2>
      <p>Le site ne dépose aucun cookie publicitaire et ne mesure pas l'audience. La visite 3D mémorise dans votre navigateur le dernier mode d'affichage choisi (2D ou 3D) : cette information reste sur votre appareil et ne nous est pas transmise.</p>
      <p>Pour s'afficher, le site charge des polices de caractères chez Google Fonts et la bibliothèque de la visite 3D chez jsDelivr. Ces services reçoivent votre adresse IP, comme pour tout chargement de fichier sur internet.</p>

      <h2>Vos droits</h2>
      <p>Vous pouvez demander à accéder à vos données, les corriger, les supprimer, vous opposer à leur traitement, en limiter l'usage ou les récupérer. Écrivez à {mail}. Nous répondons sous un mois.</p>
      <p>Si vous estimez que vos droits ne sont pas respectés, vous pouvez adresser une réclamation à la CNIL : <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noopener">www.cnil.fr/fr/plaintes</a>.</p>

      <h2>Photos et vidéos pendant le marché</h2>
      <p>L'événement est photographié et filmé pour les réseaux sociaux du marché et de ses partenaires. Si vous ne souhaitez pas apparaître, dites-le à l'équipe sur place, ou demandez le retrait d'une image à {mail}.</p>
    </PageLegale>
  );
}
