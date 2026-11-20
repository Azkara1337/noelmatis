import type { Metadata } from 'next';
import { ADRESSE, SITE_URL } from '@/lib/config';

/** Nom du site, repris dans les titres et les aperçus de partage. */
export const NOM_SITE = 'Marché de Noël de Pamiers';
const IMAGE = { url: '/img/og.jpg', width: 1200, height: 630, alt: 'Marché de Noël des Artisans & Commerçants à Pamiers, du 18 au 20 décembre 2026' };

/** Métadonnées d'une page : titre, description, adresse canonique et aperçu de partage (Facebook, WhatsApp, X…). */
export function pageMeta(chemin: string, titre: string, description: string, titreAbsolu = false): Metadata {
  const titreComplet = titreAbsolu ? titre : `${titre} · ${NOM_SITE}`;
  return {
    title: titreAbsolu ? { absolute: titre } : titre,
    description,
    alternates: { canonical: chemin },
    openGraph: { type: 'website', locale: 'fr_FR', siteName: NOM_SITE, url: chemin, title: titreComplet, description, images: [IMAGE] },
    twitter: { card: 'summary_large_image', title: titreComplet, description, images: [IMAGE.url] },
  };
}

/** Données structurées « Event » (schema.org) : Google peut afficher le marché dans ses résultats d'événements. */
export const EVENEMENT_JSONLD = {
  '@context': 'https://schema.org',
  '@type': 'Event',
  name: 'Marché de Noël des Artisans & Commerçants',
  description: "Marché de Noël à Pamiers (Ariège) : 30 stands d'artisans, producteurs et restauration, le Père Noël, jeux gonflables et salle chauffée.",
  startDate: '2026-12-18T14:00:00+01:00',
  endDate: '2026-12-20T18:00:00+01:00',
  eventStatus: 'https://schema.org/EventScheduled',
  eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
  eventSchedule: [
    { '@type': 'Schedule', startDate: '2026-12-18', startTime: '14:00', endTime: '20:00', scheduleTimezone: 'Europe/Paris' },
    { '@type': 'Schedule', startDate: '2026-12-19', startTime: '10:00', endTime: '20:00', scheduleTimezone: 'Europe/Paris' },
    { '@type': 'Schedule', startDate: '2026-12-20', startTime: '10:00', endTime: '18:00', scheduleTimezone: 'Europe/Paris' },
  ],
  location: {
    '@type': 'Place',
    name: 'Marché de Noël de Pamiers',
    address: { '@type': 'PostalAddress', streetAddress: ADRESSE.split(',')[0].trim(), postalCode: '09100', addressLocality: 'Pamiers', addressRegion: 'Ariège', addressCountry: 'FR' },
  },
  image: [`${SITE_URL}/img/og.jpg`],
  url: `${SITE_URL}/`,
  isAccessibleForFree: true,
  inLanguage: 'fr',
};

/** Balise <script type="application/ld+json"> prête à poser dans une page. */
export const jsonLd = (data: object) => ({ __html: JSON.stringify(data).replace(/</g, '\\u003c') });
