import type { Metadata } from 'next';
import Link from 'next/link';
import PageLegale, { Champ } from '@/components/Legal';
import { CONTACT_MAIL, ORGANISATEUR, TELEPHONE } from '@/lib/config';

export const metadata: Metadata = { title: 'Mentions légales' };

export default function MentionsLegales() {
  const o = ORGANISATEUR;
  return (
    <PageLegale titre="Mentions légales" sous="Qui édite ce site et qui l'héberge">
      <h2>Éditeur du site</h2>
      <p>Le site du Marché de Noël est édité par l'organisateur de l'événement :</p>
      <ul>
        <li><b>Nom :</b> <Champ v={o.nom} /></li>
        <li><b>Forme juridique :</b> <Champ v={o.statut} /></li>
        <li><b>Capital social :</b> <Champ v={o.capital} label="capital à compléter" /></li>
        <li><b>Siège :</b> <Champ v={o.adresse} /></li>
        <li><b>Immatriculation (SIRET, RCS ou RNA) :</b> <Champ v={o.immatriculation} /></li>
        <li><b>Téléphone :</b> {TELEPHONE}</li>
        <li><b>E-mail :</b> {CONTACT_MAIL ? <a href={`mailto:${CONTACT_MAIL}`}>{CONTACT_MAIL}</a> : <Champ />}</li>
        <li><b>Directeur de la publication :</b> <Champ v={o.directeur} /></li>
      </ul>

      <h2>Hébergement</h2>
      <p>Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis. Site : <a href="https://vercel.com" target="_blank" rel="noopener">vercel.com</a>.</p>

      <h2>Propriété intellectuelle</h2>
      <p>Les textes, photos, vidéos, illustrations et éléments graphiques de ce site appartiennent à l'organisateur ou à leurs auteurs. Toute reproduction sans autorisation écrite est interdite. Les logos des partenaires restent la propriété de leurs entreprises.</p>
      <p>Certaines images du site sont des illustrations et ne représentent pas exactement le lieu ou les stands du marché.</p>

      <h2>Responsabilité</h2>
      <p>L'organisateur fait de son mieux pour que les informations du site soient exactes et à jour. Le programme, les invités, les stands et les horaires peuvent toutefois évoluer : en cas de doute, appelez le {TELEPHONE}.</p>
      <p>Les liens vers d'autres sites (réseaux sociaux des invités, sites des partenaires) sont donnés pour information. L'organisateur n'est pas responsable de leur contenu.</p>

      <h2>Données personnelles</h2>
      <p>Tout ce qui concerne vos données (formulaires, durée de conservation, vos droits) est expliqué sur la page <Link href="/confidentialite/">Données personnelles</Link>.</p>
    </PageLegale>
  );
}
