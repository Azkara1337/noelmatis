// ===== Réglages du site : c'est le seul fichier à remplir =====

/** Adresse du marché, copiable par le bouton « Copier l'adresse ». Vide = « Adresse à compléter ». */
export const ADRESSE = '10 B rue Jean Rostand, 09100 Pamiers';
/** Ville affichée dans le badge des dates, ex. 'Pamiers (09)'. Vide = « Lieu dévoilé bientôt ». */
export const VILLE = 'Pamiers (09)';
/** Repas : deux portions, en € TTC. */
export const PRIX_MOYENNE = 10;
export const PRIX_GRANDE = 20;
/** Offre repas : pour chaque lot de 5 repas achetés, 1 offert (moyenne ou grande), pour les réservations jusqu'au 10 décembre inclus. */
export const OFFRE_REPAS = { lot: 5, fin: '2026-12-10T23:59:59+01:00', finTexte: '10 décembre' };
/** Valeur d'un repas offert aux partenaires (offres partenaires) : une grande portion. */
export const PRIX_REPAS = PRIX_GRANDE;
/** Téléphone de l'organisation (affiché, copiable, et cité dans les messages d'erreur). */
export const TELEPHONE = '05 34 03 24 40';
export const TELEPHONE_LIEN = 'tel:+33534032440';
/** Stands déjà pris : secours si le Google Sheet ne répond pas. */
export const DEJA: Record<number, string> = { 7: 'Crêpes', 11: 'Churros', 24: 'Aligot', 25: 'Brasero', 26: 'Vin chaud', 27: 'Raclette' };
/** URL /exec de l'Apps Script (Déployer > Application Web). Obligatoire : vide = les formulaires affichent une erreur. */
export const ENDPOINT = 'https://script.google.com/macros/s/AKfycbw5eFSO-WeJ96vZPmzn15mRJTUTzZ1JaylhGq6MVRYnetwPGS86KZhUUtk_sBXaEj6N/exec';
/**
 * Organisateur (pages Mentions légales, Confidentialité, CGU). Un champ vide = étiquette « à compléter ».
 * nom : raison sociale ou nom de l'association · statut : ex. 'Association loi 1901', 'SAS' · capital : capital social (obligatoire pour une société, vide pour une association)
 * immatriculation : SIRET, RCS ou n° RNA (W…) · directeur : directeur de la publication (personne physique).
 */
export const ORGANISATEUR = { nom: 'RC IMMO', statut: 'Société par actions simplifiée (SAS)', capital: '', adresse: '10 B rue Jean Rostand, 09100 Pamiers', immatriculation: 'RCS Foix 892 450 172', directeur: 'Bertrand Vettes' };
/** E-mail de contact (questions, données personnelles). */
export const CONTACT_MAIL = '';
/** Conditions de réservation affichées dans les CGU. Vide = « à compléter ». */
export const CONDITIONS = {
  /** Paiement des stands : quand et comment (ex. 'Acompte de 50 % à la confirmation, solde le jour de l'installation, par virement ou chèque'). */
  paiementStand: 'En une seule fois, par virement, sur facture envoyée par e-mail après l’appel de l’organisation. L’emplacement est réservé à réception du paiement.',
  /** Annulation par l'exposant (ex. 'Remboursement intégral jusqu'au 1er décembre, aucun remboursement ensuite'). */
  annulationStand: 'Aucun remboursement en cas d’annulation par l’exposant.',
  /** Annulation ou remboursement des repas (ex. 'Les tickets ne sont ni repris ni remboursés'). */
  annulationRepas: 'Pour modifier ou annuler une demande, appelez l’organisation avant de régler la facture.',
  /** Paiement des offres partenaires (ex. 'Sur facture, à 30 jours'). */
  paiementPartenaire: 'Sur facture envoyée par e-mail, à régler par virement.',
  /** Médiateur de la consommation (nom + site), obligatoire si l'organisateur est un professionnel qui vend aux particuliers. */
  mediateur: '',
};
/** Date de mise à jour des pages légales. */
export const MAJ_LEGAL = '12 novembre 2026';
/** Texte affiché sous le bouton des repas (à valider avec l'organisation). */
export const PAIEMENT = 'Vous recevez la facture par e-mail, à régler par virement : la réservation est confirmée dès le paiement. Vos tickets vous sont envoyés par e-mail, ou vous les retirez à l’accueil du marché.';
/** Adresse finale du site, pour l'image de partage (og:image). À remplacer après la mise en ligne. */
export const SITE_URL = 'https://www.noel-rcimmo.fr';

/** Partenaires signés uniquement, avec leur vrai logo dans public/img/logos/. Les cases « Votre logo ici » se créent toutes seules. */
export type Partenaire = { nom: string; ville?: string; logo?: string; site?: string };
export const PARTENAIRES: Partenaire[] = [
  // { nom: 'Nom de l’entreprise', ville: 'Ville', logo: '/img/logos/nom.png', site: 'https://...' },
];

/** Invités : n = nombre d'abonnés affiché, url = lien du compte. Un réseau sans n ne s'affiche pas. */
export type Reseau = { n: string; url: string };
export type Invite = { nom: string; desc: string; photo: string; /** Photo détourée (fond transparent) : la tête sort de la carte. */ detour?: string; /** Carte mise en avant au centre (plus grande, bordure dorée). */ roi?: boolean; ig?: Reseau; tk?: Reseau; yt?: Reseau };
/** Audience cumulée des invités, chiffres donnés par l'organisation (13/11/2026). Vide = rien n'est affiché. */
export const VUES_MOIS = '50 millions';
/** Nombre de créateurs annoncé (plus que les cartes affichées). Vide = nombre de cartes. */
export const CREATEURS = '+10';
export const INVITES: Invite[] = [
  { nom: 'Bertrand Vettes', desc: 'Investisseur & entrepreneur terrain · Immobilier · BTP · Projets', photo: '/img/invites/bertrand.webp', detour: '/img/invites/detour/bertrand.webp', roi: true, ig: { n: '30 k', url: 'https://www.instagram.com/bertrand_rcimmo/' }, tk: { n: '5,2 k', url: 'https://www.tiktok.com/@bertrand.rcimmo' }, yt: { n: '2,7 k', url: 'https://www.youtube.com/@bertrandrcimmo' } },
  { nom: 'Ludo & Clémentine', desc: 'Rénovation, auto-rénovation et vie de chantier', photo: '/img/invites/ludo-clementine.webp', detour: '/img/invites/detour/ludo-clementine.webp', ig: { n: "31 k", url: "https://www.instagram.com/ludo_clem_renovation/" } },
  { nom: 'Florent · Flambadou', desc: 'Traiteur, tournebroche & brasero · Cuisine au feu de bois', photo: '/img/invites/florent.webp', detour: '/img/invites/detour/florent.webp', ig: { n: "37 k", url: "https://www.instagram.com/flambadouu/" }, tk: { n: "3 k", url: "https://www.tiktok.com/@flambadouu" } },
  { nom: 'Le Charbonheur', desc: 'Artisan, rénovation et investissement immobilier', photo: '/img/invites/charbonheur.webp', detour: '/img/invites/detour/charbonheur.webp', ig: { n: "41 k", url: "https://www.instagram.com/le_charbonheur/" } },
  { nom: 'Terre Gauloise', desc: 'Paysages, terroir et patrimoine français', photo: '/img/invites/terre-gauloise.webp', ig: { n: "55 k", url: "https://www.instagram.com/terre.gauloise/" }, tk: { n: "13,4 k", url: "https://www.tiktok.com/@terre.gauloise" } },
  { nom: 'Damien', desc: 'Créateur de contenu', photo: '' },
  { nom: 'Baptiste', desc: 'Boucher · Boucherie Labourde · Lifestyle', photo: '', ig: { n: '212 k', url: 'https://www.instagram.com/b_labourde/' }, tk: { n: '536 k', url: 'https://www.tiktok.com/@b_labourde' } },
];
