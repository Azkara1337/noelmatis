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
export const CONTACT_MAIL = 'mathilde.calero@rc-immo.com';
/** Adresse à qui les clients demandent leur facture (stands, partenaires, repas). Même valeur que MAIL_FACTURE dans Code.gs. */
export const MAIL_FACTURE = 'mathilde.calero@rc-immo.com';
/** TVA appliquée aux stands et aux offres partenaires (prix affichés HT, payés TTC). */
export const TVA = 0.2;
/** Prix HT des stands par catégorie (valeur du champ « categorie »). Mêmes valeurs que PRIX_STANDS dans Code.gs. */
export const PRIX_STANDS: Record<string, number> = { 'Artisanat, créations': 120, 'Producteur, terroir': 180, 'Snacking, gourmandises': 280, 'Restauration, spécialités': 420, 'Stand Premium, brasero': 590 };
/** Prix HT des offres partenaires. Mêmes valeurs que PRIX_OFFRES dans Code.gs. */
export const PRIX_OFFRES: Record<string, number> = { 'Étoile de Noël': 200, 'Sapin Gourmand': 400, 'Maison du Père Noël': 1200, 'Partenaire Prestige': 2500 };
/** Prix TTC à partir d'un prix HT. */
export const ttc = (ht: number) => Math.round(ht * (1 + TVA) * 100) / 100;
/** Conditions de réservation affichées dans les CGU. Vide = « à compléter ». */
export const CONDITIONS = {
  /** Paiement des stands : quand et comment (ex. 'Acompte de 50 % à la confirmation, solde le jour de l'installation, par virement ou chèque'). */
  paiementStand: 'En ligne, par carte bancaire, au moment de la demande (prix affichés HT, payés TTC avec la TVA à 20 %). L’organisation appelle ensuite l’exposant pour confirmer son emplacement ; si le stand souhaité n’est plus libre, un autre emplacement lui est proposé ou il est remboursé. La facture est envoyée sur simple demande par e-mail à mathilde.calero@rc-immo.com.',
  /** Annulation par l'exposant (ex. 'Remboursement intégral jusqu'au 1er décembre, aucun remboursement ensuite'). */
  annulationStand: 'Aucun remboursement en cas d’annulation par l’exposant.',
  /** Annulation ou remboursement des repas (ex. 'Les tickets ne sont ni repris ni remboursés'). */
  annulationRepas: 'Les repas se règlent en ligne, sur le site. La facture est envoyée sur simple demande par e-mail à mathilde.calero@rc-immo.com. Pour toute question sur une réservation, contactez l’organisation.',
  /** Paiement des offres partenaires (ex. 'Sur facture, à 30 jours'). */
  paiementPartenaire: 'En ligne, par carte bancaire, au moment de la demande (prix affichés HT, payés TTC avec la TVA à 20 %). La facture est envoyée sur simple demande par e-mail à mathilde.calero@rc-immo.com.',
  /** Médiateur de la consommation (nom + site), obligatoire si l'organisateur est un professionnel qui vend aux particuliers. */
  mediateur: '',
};
/** Date de mise à jour des pages légales. */
export const MAJ_LEGAL = '12 novembre 2026';
/** Repas : paiement en ligne par Stripe, créé par le script Google (clé STRIPE_SECRET dans les propriétés du script). false = « paiement en ligne bientôt disponible ». */
export const PAIEMENT_EN_LIGNE: boolean = true;   // à passer à true après les tests réels avec la clé Stripe
/** Texte affiché sous le bouton des repas. */
export const PAIEMENT = 'Paiement en ligne sécurisé par carte bancaire. Vous recevez ensuite votre ticket avec QR code par e-mail : présentez-le à l’accueil du marché pour récupérer vos tickets repas. Facture sur demande à mathilde.calero@rc-immo.com.';
/** Adresse finale du site, pour l'image de partage (og:image). À remplacer après la mise en ligne. */
export const SITE_URL = 'https://www.noel-rcimmo.fr';

/** Partenaires signés uniquement, avec leur vrai logo dans public/img/logos/. Les cases « Votre logo ici » se créent toutes seules. */
export type Partenaire = { nom: string; ville?: string; logo?: string; site?: string; /** Petite ligne sous le nom (cartes sans logo). */ activite?: string };
/** Partenaires transmis par l'organisation (Bertrand, 20/11/2026). S'ajoutent à ceux de l'onglet « Logos » du Sheet. */
export const PARTENAIRES: Partenaire[] = [
  { nom: 'Carrefour', ville: 'Pamiers', logo: '/img/logos/carrefour.webp' },
  { nom: 'Intermarché', ville: 'Pamiers', logo: '/img/logos/intermarche.webp' },
  { nom: 'Brico Dépôt', ville: 'Pamiers', logo: '/img/logos/bricodepot.webp' },
  { nom: 'Mr.Bricolage', ville: 'Pamiers', logo: '/img/logos/mrbricolage.webp' },
  { nom: 'Gedimat Ariège Matériaux', ville: 'Pamiers' },
  { nom: 'Point.P', ville: 'Pamiers', logo: '/img/logos/pointp.webp' },
  { nom: 'EDF', ville: 'Ariège', logo: '/img/logos/edf.webp' },
  { nom: 'Engie', ville: 'Ariège', logo: '/img/logos/engie.webp' },
  { nom: 'AXA Assurances', ville: 'Pamiers', logo: '/img/logos/axa.webp' },
  { nom: 'Crédit Agricole Sud Méditerranée', ville: 'Pamiers', logo: '/img/logos/creditagricole.webp' },
  { nom: 'Banque Populaire Occitane', ville: 'Pamiers', logo: '/img/logos/banquepopulaire.webp' },
  { nom: 'Groupama', ville: 'Pamiers', logo: '/img/logos/groupama.webp' },
  { nom: 'E.Leclerc', ville: 'Saint-Jean-du-Falga', logo: '/img/logos/leclerc.webp' },
  { nom: 'Optic 2000', ville: 'Pamiers' },
  { nom: 'Unikalo Peintures', ville: 'Pamiers' },
  { nom: 'Chausson Matériaux', ville: 'Pamiers', logo: '/img/logos/chausson.webp' },
  { nom: 'BigMat Ariège', ville: 'Pamiers' },
  { nom: 'Maison Thiriet', ville: 'Pamiers', logo: '/img/logos/thiriet.webp' },
  { nom: 'Citroën', ville: 'Pamiers', logo: '/img/logos/citroen.webp' },
  { nom: 'Peugeot', ville: 'Pamiers', logo: '/img/logos/peugeot.webp' },
  { nom: 'Renault', ville: 'Pamiers', logo: '/img/logos/renault.webp' },
  { nom: 'Garage Ariège Auto', ville: 'Pamiers', activite: 'Entretien & réparation' },
  { nom: 'Norauto', ville: 'Pamiers', logo: '/img/logos/norauto.webp' },
  { nom: 'Feu Vert', ville: 'Pamiers', logo: '/img/logos/feuvert.webp' },
  { nom: 'Intersport', ville: 'Pamiers', logo: '/img/logos/intersport.webp' },
  { nom: 'Decathlon', ville: 'Foix', logo: '/img/logos/decathlon.webp' },
  { nom: 'Sport 2000', ville: 'Pamiers', logo: '/img/logos/sport2000.webp' },
  { nom: 'L’Atelier du Cycle', ville: 'Pamiers', activite: 'Vélos · entretien · accessoires' },
  { nom: 'Ariège Équipements', ville: 'Pamiers', activite: 'Matériel BTP & TP' },
  { nom: 'Kiloutou', ville: 'Pamiers', logo: '/img/logos/kiloutou.webp' },
  { nom: 'La Cave de l’Ariège', ville: 'Pamiers', activite: 'Vins & produits du terroir' },
  { nom: 'Boucherie du Centre', ville: 'Pamiers' },
  { nom: 'Fromagerie Ariégeoise', ville: 'Pamiers', activite: 'Produits locaux' },
  { nom: 'Boulangerie Pâtisserie La Panière', ville: 'Pamiers' },
  { nom: 'Maison Dupont', ville: 'Pamiers', activite: 'Charcuterie artisanale' },
  { nom: 'Le Terroir d’Ariège', ville: 'Pamiers', activite: 'Producteurs locaux' },
  { nom: 'Ariège Boissons Distribution', ville: 'Pamiers' },
  { nom: 'Blanc Froid', ville: 'Pamiers', activite: 'Climatisation · chauffage' },
  { nom: 'Ariège Élec', ville: 'Pamiers', activite: 'Électricité générale' },
  { nom: 'Plomberie 09', ville: 'Pamiers', activite: 'Chauffage · sanitaire' },
  { nom: 'TP Ariège', ville: 'Pamiers', activite: 'Terrassement · VRD' },
  { nom: 'Espace Vert 09', ville: 'Pamiers', activite: 'Création & entretien' },
];

/** Invités : n = nombre d'abonnés (chiffres de l'organisation, 17/11/2026), url = lien du compte. Un réseau sans n ne s'affiche pas. */
export type Reseau = { n: string; url: string };
export type Invite = { nom: string; desc: string; photo: string; /** Photo détourée (fond transparent). */ detour?: string; /** Photo de profil (avatar rond). */ avatar?: string; /** Carte mise en avant au centre (plus grande, bordure dorée). */ roi?: boolean; ig?: Reseau; tk?: Reseau; yt?: Reseau };
/** Audience cumulée des invités, chiffres donnés par l'organisation (17/11/2026). Vide = rien n'est affiché. */
export const VUES_MOIS = '200 millions';
/** Nombre de créateurs annoncé (plus que les cartes affichées). Vide = nombre de cartes. */
export const CREATEURS = '+15';
export const INVITES: Invite[] = [
  { nom: 'Bertrand Vettes', desc: 'Investisseur & entrepreneur terrain · Immobilier · BTP', photo: '/img/invites/bertrand.webp', detour: '/img/invites/detour/bertrand.webp', roi: true, ig: { n: '30 k', url: 'https://www.instagram.com/bertrand_rcimmo/' }, tk: { n: '5,2 k', url: 'https://www.tiktok.com/@bertrand.rcimmo' }, yt: { n: '2,7 k', url: 'https://www.youtube.com/@bertrandrcimmo' } },
  { nom: 'Les Mémoires de Jean-Louis', desc: 'Récits de campagne', photo: '/img/invites/profils/les-memoires-de-jeanlouis.webp', avatar: '/img/invites/profils/les-memoires-de-jeanlouis.webp', ig: { n: '369 k', url: 'https://www.instagram.com/les_memoires_de_jeanlouis/' } },
  { nom: 'Baptiste', desc: 'Boucherie', photo: '/img/invites/profils/b-labourde.webp', avatar: '/img/invites/profils/b-labourde.webp', ig: { n: '213 k', url: 'https://www.instagram.com/b_labourde/' }, tk: { n: '536 k', url: 'https://www.tiktok.com/@b_labourde' } },
  { nom: 'Damien Épicurien', desc: 'Vin · Tradition · Terroir', photo: '/img/invites/profils/damien-epicurien.webp', avatar: '/img/invites/profils/damien-epicurien.webp', ig: { n: '143 k', url: 'https://www.instagram.com/damien_epicurien/' } },
  { nom: 'Joré Lagon Jardins', desc: 'Piscines lagon & jardins', photo: '/img/invites/profils/jore-lagon-jardins.webp', avatar: '/img/invites/profils/jore-lagon-jardins.webp', ig: { n: '92,8 k', url: 'https://www.instagram.com/jore_lagon_jardins/' } },
  { nom: 'Domaine di l’Alivi', desc: 'Agriculture · Domaine', photo: '/img/invites/profils/domainedilalivi.webp', avatar: '/img/invites/profils/domainedilalivi.webp', ig: { n: '81,9 k', url: 'https://www.instagram.com/domainedilalivi/' } },
  { nom: 'Pierre', desc: 'Agriculteur', photo: '/img/invites/profils/pierre-lsk.webp', avatar: '/img/invites/profils/pierre-lsk.webp', ig: { n: '80,5 k', url: 'https://www.instagram.com/pierre.lsk/' } },
  { nom: 'Mare e Monti', desc: 'Restaurant · Bandol', photo: '/img/invites/profils/mareemonti-bandol.webp', avatar: '/img/invites/profils/mareemonti-bandol.webp', ig: { n: '46,3 k', url: 'https://www.instagram.com/mareemonti_bandol/' } },
  { nom: 'Le Charbonheur', desc: 'Artisan investisseur', photo: '/img/invites/profils/le-charbonheur.webp', detour: '/img/invites/detour/charbonheur.webp', ig: { n: '42,3 k', url: 'https://www.instagram.com/le_charbonheur/' } },
  { nom: 'Aladdin Jammal', desc: 'Construction · Bricolage', photo: '/img/invites/profils/aladdin-jammal.webp', avatar: '/img/invites/profils/aladdin-jammal.webp', ig: { n: '37,3 k', url: 'https://www.instagram.com/aladdin.jammal/' } },
  { nom: 'Florent · Flambadou', desc: 'Traiteur au feu de bois', photo: '/img/invites/profils/flambadouu.webp', avatar: '/img/invites/profils/flambadouu.webp', detour: '/img/invites/detour/florent.webp', ig: { n: '37 k', url: 'https://www.instagram.com/flambadouu/' }, tk: { n: '3 k', url: 'https://www.tiktok.com/@flambadouu' } },
  { nom: 'LSO Bâti Rénov', desc: 'Maçonnerie · Couverture', photo: '/img/invites/profils/lso-bati-renov.webp', avatar: '/img/invites/profils/lso-bati-renov.webp', ig: { n: '27,1 k', url: 'https://www.instagram.com/lso.bati.renov/' } },
  { nom: 'Alto’bois', desc: 'Charpente · Couverture', photo: '/img/invites/profils/altobois.webp', avatar: '/img/invites/profils/altobois.webp', ig: { n: '16,8 k', url: 'https://www.instagram.com/altobois/' } },
  { nom: 'Madame Immo Travaux', desc: 'Immobilier · BTP', photo: '/img/invites/profils/madame-immo-travaux.webp', avatar: '/img/invites/profils/madame-immo-travaux.webp', ig: { n: '16,7 k', url: 'https://www.instagram.com/madame_immo_travaux/' } },
  { nom: 'Papa Ours', desc: 'Restaurant · Narbonne', photo: '/img/invites/profils/papaoursnarbonne.webp', avatar: '/img/invites/profils/papaoursnarbonne.webp', ig: { n: '14 k', url: 'https://www.instagram.com/papaoursnarbonne/' } },
  { nom: 'Jetbike Motorcycles', desc: 'Atelier moto', photo: '/img/invites/profils/jetbikemotorcycles.webp', avatar: '/img/invites/profils/jetbikemotorcycles.webp', ig: { n: '5,2 k', url: 'https://www.instagram.com/jetbikemotorcycles/' } },
  { nom: 'Ludo & Clémentine', desc: 'Rénovation · Vie de chantier', photo: '/img/invites/ludo-clementine.webp', detour: '/img/invites/detour/ludo-clementine.webp', ig: { n: '31 k', url: 'https://www.instagram.com/ludo_clem_renovation/' } },
  { nom: 'Terre Gauloise', desc: 'Paysages · Terroir · Patrimoine', photo: '/img/invites/terre-gauloise.webp', ig: { n: '55 k', url: 'https://www.instagram.com/terre.gauloise/' }, tk: { n: '13,4 k', url: 'https://www.tiktok.com/@terre.gauloise' } },
];

/**
 * Programme : jusqu'à PROGRAMME_REVELE, la page Programme affiche un compte à rebours.
 * Ensuite, elle affiche PROGRAMME (s'il est rempli), jour par jour.
 * Exemple : { jour: 'Vendredi 18 décembre', moments: [{ heure: '14 h', titre: 'Ouverture du marché', lieu: 'Entrée' }] }
 */
export const PROGRAMME_REVELE = '2026-12-14T00:00:00+01:00';
export type Moment = { heure?: string; titre: string; lieu?: string };
export const PROGRAMME: { jour: string; moments: Moment[] }[] = [];
