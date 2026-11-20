/**
 * Marché de Noël : réception des formulaires du site dans ce Google Sheet.
 *
 * Installation (une seule fois, 10 minutes) :
 * 1. Crée un Google Sheet vide, nommé « Marché de Noël · réservations ».
 * 2. Menu Extensions > Apps Script. Efface le contenu et colle tout ce fichier.
 * 3. Remplis NOTIFIER ci-dessous (les adresses qui reçoivent chaque demande).
 * 4. En haut, choisis la fonction « installer » puis clique sur Exécuter. Autorise l'accès.
 *    Ça crée les onglets Stands, Repas, Partenaires, Plan et Logos.
 * 5. Déployer > Nouveau déploiement > type « Application Web » :
 *      Exécuter en tant que : Moi
 *      Qui a accès : Tout le monde
 *    Copie l'URL qui finit par /exec et colle-la dans web/lib/config.ts : export const ENDPOINT = '...';
 *
 * Paiements (Stripe), factures et tickets : menu « Marché de Noël » du Google Sheet > Configurer les paiements.
 * (Si le menu n'apparaît pas : recharge la page du Sheet.)
 *
 * Au quotidien :
 * - Chaque demande arrive dans son onglet, et un e-mail part vers NOTIFIER.
 * - La personne qui a rempli le formulaire reçoit un e-mail de confirmation.
 * - Onglet Plan : quand un stand est confirmé, mets « réservé » dans Statut et le nom dans Exposant.
 *   Le plan du site se met à jour tout seul (stand en rouge, plus proposé dans la liste).
 * - Onglet Logos : pour chaque partenaire signé, une ligne avec « oui » dans Afficher, le nom,
 *   la ville, le lien du logo et le site web. Le logo apparaît sur le Mur des partenaires.
 *   Pour le logo : dépose l'image dans Google Drive, clic droit > Partager > Copier le lien,
 *   puis colle ce lien dans la colonne Logo. Mets « non » pour retirer un partenaire du site.
 *
 * Si tu modifies ce code : Déployer > Gérer les déploiements > crayon > Version : Nouvelle version.
 * L'URL /exec reste la même.
 */

// ===== à remplir =====
const NOTIFIER = 'saveyourshoot@gmail.com,mathilde.calero@rc-immo.com';   // adresses qui reçoivent chaque demande et chaque paiement, séparées par une virgule.
const NOM_EVENT = 'Marché de Noël';
const DATES = 'vendredi 18, samedi 19 et dimanche 20 décembre 2026';
const TELEPHONE = '05 34 03 24 40';
const STANDS_DEJA = {7: 'Crêpes', 11: 'Churros', 24: 'Aligot', 25: 'Brasero', 26: 'Vin chaud', 27: 'Raclette'};
const PRIX_MOYENNE = 10, PRIX_GRANDE = 20;           // repas, en € TTC (mêmes valeurs que web/lib/config.ts)
const OFFRE_LOT = 5, OFFRE_FIN = '2026-12-10T23:59:59+01:00';
const SITE = 'https://www.noel-rcimmo.fr';      // adresse du site, pour le retour après paiement Stripe
// Stands et offres partenaires : prix HT (mêmes valeurs que web/lib/config.ts). Le client paie le TTC (TVA ci-dessous).
const TVA = 0.20;                 // stands et offres partenaires (prix HT + TVA)
const TVA_REPAS = 0.20;           // repas : prix TTC, TVA comprise (20 %, confirmé par l'organisation le 20/11)
// Pied de page des factures Stripe. Le capital et le n° de TVA vont dans la propriété du script FACTURE_MENTIONS (pas dans le code).
// E-mails : par Resend si la propriété RESEND_KEY existe (adresse du site, pas de limite Gmail), sinon par Gmail.
const EXPEDITEUR_DEFAUT = 'billetterie@noel-rcimmo.fr';   // adresse d'envoi (domaine vérifié dans Resend) ; modifiable : propriété RESEND_FROM
const REPONDRE_A = 'mathilde.calero@rc-immo.com';          // les réponses des clients arrivent ici
const COPIE_CLIENTS = 'mathilde.calero@rc-immo.com';       // copie cachée de chaque e-mail envoyé à un client (vide = pas de copie)
const FACTURE_PIED = 'RC IMMO · SAS · 10 B rue Jean Rostand, 09100 Pamiers · RCS Foix 892 450 172';
const PRIX_STANDS = {'Artisanat, créations': 120, 'Producteur, terroir': 180, 'Snacking, gourmandises': 280, 'Restauration, spécialités': 420, 'Stand Premium, brasero': 590};
const PRIX_OFFRES = {'Étoile de Noël': 200, 'Sapin Gourmand': 400, 'Maison du Père Noël': 1200, 'Partenaire Prestige': 2500};
// Repas offerts (grande portion) inclus dans chaque offre partenaire : bon avec QR code envoyé après le paiement.
const REPAS_OFFRES = {'Étoile de Noël': 3, 'Sapin Gourmand': 6, 'Maison du Père Noël': 20, 'Partenaire Prestige': 40};
// =====================

const ONGLETS = {
  stand: {nom: 'Stands', cols: [['date', 'Reçu le'], ['statut', 'Suivi'], ['nom', 'Nom'], ['activite', 'Activité'], ['tel', 'Téléphone'], ['email', 'E-mail'], ['stand', 'Stand souhaité'], ['categorie', 'Catégorie'], ['message', 'Message'], ['code_promo', 'Code promo'], ['ref', 'Référence'], ['paiement', 'Paiement'], ['facture', 'Facture']]},
  repas: {nom: 'Repas', cols: [['date', 'Reçu le'], ['statut', 'Suivi'], ['nom', 'Nom'], ['email', 'E-mail'], ['tel', 'Téléphone'], ['profil', 'Profil'], ['repas', 'Nb repas'], ['total_ttc', 'Total TTC'], ['code_promo', 'Code promo'], ['moyennes', 'Moyennes'], ['grandes', 'Grandes'], ['offerts', 'Offerts'], ['offert_type', 'Type offert'], ['ref', 'Référence'], ['paiement', 'Paiement'], ['ticket', 'Ticket'], ['retrait', 'Retrait accueil'], ['facture', 'Facture']]},
  partenaire: {nom: 'Partenaires', cols: [['date', 'Reçu le'], ['statut', 'Suivi'], ['entreprise', 'Entreprise'], ['nom', 'Contact'], ['tel', 'Téléphone'], ['email', 'E-mail'], ['salaries', 'Salariés'], ['offre', 'Offre'], ['message', 'Message'], ['code_promo', 'Code promo'], ['ref', 'Référence'], ['paiement', 'Paiement'], ['facture', 'Facture'], ['ticket', 'Bons repas'], ['retrait', 'Retrait accueil']]}
};

function installer() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ONGLETS).forEach(function (k) {
    const o = ONGLETS[k];
    let sh = ss.getSheetByName(o.nom) || ss.insertSheet(o.nom);
    if (sh.getLastRow() === 0) {
      sh.appendRow(o.cols.map(function (c) { return c[1]; }));
      sh.getRange(1, 1, 1, o.cols.length).setFontWeight('bold').setBackground('#d63f2b').setFontColor('#ffffff');
      sh.setFrozenRows(1);
    }
  });
  let plan = ss.getSheetByName('Plan') || ss.insertSheet('Plan');
  if (plan.getLastRow() === 0) {
    plan.appendRow(['Stand', 'Statut', 'Exposant']);
    plan.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#2e5e2a').setFontColor('#ffffff');
    for (let n = 1; n <= 30; n++) {
      plan.appendRow([n, STANDS_DEJA[n] ? 'réservé' : 'libre', STANDS_DEJA[n] || '']);
    }
    const regle = SpreadsheetApp.newDataValidation().requireValueInList(['libre', 'réservé'], true).build();
    plan.getRange(2, 2, 30, 1).setDataValidation(regle);
    plan.setFrozenRows(1);
  }
  let lg = ss.getSheetByName('Logos') || ss.insertSheet('Logos');
  if (lg.getLastRow() === 0) {
    lg.appendRow(['Afficher', 'Entreprise', 'Ville', 'Logo (lien Google Drive ou lien d\'image)', 'Site web']);
    lg.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#c8962e').setFontColor('#ffffff');
    lg.getRange(2, 1, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['oui', 'non'], true).build());
    lg.setColumnWidth(4, 360);
    lg.setFrozenRows(1);
  }
  ongletCodesPromo(ss);
  const vide = ss.getSheetByName('Feuille 1') || ss.getSheetByName('Sheet1');
  if (vide && vide.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vide);
}

// Le site lit le plan (GET ...?action=plan) et le mur des partenaires (GET ...?action=partenaires)
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'partenaires') return json({partenaires: partenaires()});
  if (action === 'paiement') return json(creerPaiement(e.parameter));
  if (action === 'verif') return json(verifierSession(String(e.parameter.session || '')));
  if (action === 'controle') return json(controlerTicket(e.parameter, false));
  if (action === 'retirer') return json(controlerTicket(e.parameter, true));
  if (action !== 'plan') return json({ok: true});
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Plan');
  const pris = {};
  if (sh && sh.getLastRow() > 1) {
    sh.getRange(2, 1, sh.getLastRow() - 1, 3).getValues().forEach(function (r) {
      const n = parseInt(r[0], 10), st = String(r[1]).toLowerCase();
      if (n >= 1 && n <= 30 && st.indexOf('r') === 0) pris[n] = String(r[2] || 'Réservé').slice(0, 40);
    });
  }
  return json({pris: pris});
}

// Onglet Logos : une ligne par partenaire signé, « oui » dans Afficher.
function partenaires() {
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Logos');
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 5).getValues()
    .filter(function (r) { return String(r[0]).trim().toLowerCase() === 'oui' && String(r[1]).trim(); })
    .slice(0, 60)
    .map(function (r) {
      const site = String(r[4]).trim();
      return {
        nom: String(r[1]).trim().slice(0, 60),
        ville: String(r[2]).trim().slice(0, 40),
        logo: image(String(r[3]).trim()),
        site: /^https?:\/\//.test(site) ? site : (site ? 'https://' + site : '')
      };
    });
}

// Un lien Google Drive devient une image intégrée (pas besoin de partager le fichier).
// Un lien d'image classique (https://…) est gardé tel quel.
function image(lien) {
  if (!lien) return '';
  const m = lien.match(/\/d\/([\w-]{20,})/) || lien.match(/[?&]id=([\w-]{20,})/);
  if (!m) return /^https:\/\//.test(lien) ? lien : '';
  const cache = CacheService.getScriptCache();
  const deja = cache.get('logo_' + m[1]);
  if (deja) return deja;
  try {
    const f = DriveApp.getFileById(m[1]);
    let b = f.getBlob();
    if (!/^image\//.test(b.getContentType())) return '';
    if (b.getBytes().length > 150000) b = f.getThumbnail();   // logo trop lourd : on prend la miniature Drive
    const url = 'data:' + b.getContentType() + ';base64,' + Utilities.base64Encode(b.getBytes());
    try { cache.put('logo_' + m[1], url, 21600); } catch (err) {}   // 6 h, si la taille le permet
    return url;
  } catch (err) {
    return '';
  }
}

// Le site envoie un formulaire : POST (corps JSON en texte)
// L'URL /exec est publique : on vérifie la demande ici, pas seulement dans le navigateur.
const REQUIS = {stand: ['nom', 'tel'], repas: ['nom', 'email'], partenaire: ['entreprise', 'nom', 'tel']};
const MAX_PAR_HEURE = 30;          // au-delà, les demandes sont refusées pendant l'heure (anti-spam)
const MAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[a-z]{2,}$/i;
const TEL_RE = /^(?:0[1-9]\d{8}|\+[1-9]\d{7,14})$/;
const REF_RE = /^[RSP]-[A-Z0-9]{8}$/;             // référence créée par le site : R- repas, S- stand, P- partenaire
const PREFIXE = {repas: 'R', stand: 'S', partenaire: 'P'}, TYPE_DE = {R: 'repas', S: 'stand', P: 'partenaire'};
const NOM_RE = /^[\p{L}\p{M}0-9 '’.,&()\/+-]+$/u;

function doPost(e) {
  const lock = LockService.getScriptLock();
  let d, o;
  try {
    lock.waitLock(10000);
    d = JSON.parse(e.postData.contents);
    o = (d && Object.prototype.hasOwnProperty.call(ONGLETS, d.type)) ? ONGLETS[d.type] : null;   // seulement stand, repas ou partenaire
    if (!o) return json({ok: false, erreur: 'type inconnu'});
    if (d.site_web) return json({ok: true});                       // champ anti-spam rempli : robot, on ignore
    if (REQUIS[d.type].some(function (k) { return !String(d[k] || '').trim(); })) return json({ok: false, erreur: 'champs manquants'});
    if (d.email && !MAIL_RE.test(String(d.email).trim())) return json({ok: false, erreur: 'e-mail invalide'});
    // Mêmes règles que web/lib/validation.ts : le navigateur peut être contourné, pas ce script.
    if (d.tel) {
      d.tel = String(d.tel).replace(/[\s.\-()]/g, '');
      if (!TEL_RE.test(d.tel)) return json({ok: false, erreur: 'téléphone invalide'});
    }
    if (['nom', 'activite', 'entreprise'].some(function (k) { return d[k] && !NOM_RE.test(String(d[k])); })) return json({ok: false, erreur: 'nom invalide'});
    if (d.salaries && !/^\d{1,4}$/.test(String(d.salaries))) return json({ok: false, erreur: 'salariés invalide'});
    if (d.code_promo) {
      d.code_promo = String(d.code_promo).replace(/\s+/g, '').toUpperCase();
      if (!/^[A-Z0-9_-]{1,30}$/.test(d.code_promo)) return json({ok: false, erreur: 'code promo invalide'});
    }
    if (d.type === 'repas') {
      // On recalcule ici le total et les repas offerts : on ne se fie pas aux chiffres envoyés par le navigateur.
      const m = parseInt(d.moyennes || '0', 10), g = parseInt(d.grandes || '0', 10);
      if (!(m >= 0 && m <= 99 && g >= 0 && g <= 99 && m + g > 0)) return json({ok: false, erreur: 'nombre de repas invalide'});
      const offerts = new Date() <= new Date(OFFRE_FIN) ? Math.floor((m + g) / OFFRE_LOT) : 0;
      d.moyennes = String(m); d.grandes = String(g); d.repas = String(m + g);
      d.total_ttc = (m * PRIX_MOYENNE + g * PRIX_GRANDE) + ' €';
      d.offerts = String(offerts);
      d.offert_type = offerts > 0 ? (d.offert_type === 'Grande' ? 'Grande' : 'Moyenne') : '';
    }
    // Référence de paiement : elle doit correspondre au type de demande (R- repas, S- stand, P- partenaire).
    d.ref = REF_RE.test(String(d.ref || '')) && String(d.ref).charAt(0) === PREFIXE[d.type] ? String(d.ref) : '';
    d.paiement = d.ref ? 'Non payé' : '';
    if (!quota()) return json({ok: false, erreur: 'trop de demandes'});
    d.date = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm');
    d.statut = 'À traiter';
    const ligne = o.cols.map(function (c) { return propre(d[c[0]]); });
    const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(o.nom);
    entetes(sh, o);
    sh.appendRow(ligne);
  } catch (err) {
    return json({ok: false, erreur: String(err)});
  } finally {
    lock.releaseLock();
  }
  // La ligne est enregistrée : un souci d'e-mail (quota Gmail…) ne doit pas faire échouer la demande.
  // Repas avec référence : l'organisation est prévenue au paiement et le ticket sert de confirmation (économise le quota Gmail).
  if (!(d.type === 'repas' && d.ref && cleStripe())) {   // sans clé Stripe (paiement pas encore branché) : e-mails comme avant
    try { prevenir(d, o); } catch (err) { console.error('prevenir', err); }
    try { confirmer(d); } catch (err) { console.error('confirmer', err); }
  }
  return json({ok: true});
}

// Ajoute les titres des colonnes créées après l'installation (ex. « Code promo »), sans toucher aux lignes existantes.
function entetes(sh, o) {
  const n = sh.getLastColumn();
  if (n >= o.cols.length) return;
  const titres = o.cols.slice(n).map(function (c) { return c[1]; });
  sh.getRange(1, n + 1, 1, titres.length).setValues([titres]).setFontWeight('bold').setBackground('#d63f2b').setFontColor('#ffffff');
}

// Compteur par heure (CacheService) : limite le nombre de demandes acceptées.
function quota() {
  const cache = CacheService.getScriptCache();
  const cle = 'n_' + Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyyMMddHH');
  const n = parseInt(cache.get(cle) || '0', 10) + 1;
  cache.put(cle, String(n), 3700);
  return n <= MAX_PAR_HEURE;
}

function propre(v) {
  let s = (v === undefined || v === null) ? '' : String(v).slice(0, 1000);
  s = s.replace(/[\u0000-\u0009\u000B-\u001F\u007F]/g, ' ').replace(/[<>]/g, '');   // pas de balise HTML ni de caractère de contrôle
  if (/^[=+\-@]/.test(s)) s = "'" + s;   // évite qu'une saisie soit lue comme une formule
  return s;
}

function prevenir(d, o) {
  const dest = NOTIFIER || Session.getEffectiveUser().getEmail();
  const titre = {stand: 'Nouvelle demande de stand', repas: 'Nouvelle réservation de repas', partenaire: 'Nouvelle demande partenaire'}[d.type];
  const corps = o.cols.map(function (c) { return c[1] + ' : ' + (d[c[0]] || '-'); }).join('\n');
  const url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  envoyerMail({to: dest, subject: NOM_EVENT + ' · ' + titre, body: corps + '\n\nTout est dans le Google Sheet : ' + url,
    html: gabarit({interne: true, apercu: titre + ' : ' + (d.entreprise || d.nom || ''), titre: titre,
      paragraphes: [d.ref && (PRIX_STANDS[d.categorie] || PRIX_OFFRES[d.offre]) ? 'La personne peut régler en ligne depuis le site. Vous recevrez un e-mail « paiement reçu » dès que c\'est fait.' : 'Une nouvelle demande vient d\'arriver.'],
      encadre: o.cols.filter(function (c) { return ['date', 'statut', 'paiement', 'facture', 'ticket', 'retrait'].indexOf(c[0]) < 0; }).map(function (c) { return [c[1], h(d[c[0]] || '')]; }),
      bouton: {texte: 'Ouvrir le Google Sheet', url: url}})});
}

function confirmer(d) {
  const mail = String(d.email || '').trim();
  if (!MAIL_RE.test(mail)) return;
  if (!cleResend() && MailApp.getRemainingDailyQuota() < 20) return;   // Gmail : on garde le quota pour prévenir l'organisation
  const cache = CacheService.getScriptCache(), cle = 'c_' + Utilities.base64EncodeWebSafe(mail.toLowerCase()).slice(0, 200);
  if (cache.get(cle)) return;                                      // une confirmation par adresse et par heure
  cache.put(cle, '1', 3600);
  const nom = String(d.nom || '').replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/[<>]/g, '').trim().slice(0, 60);
  const fin = '\n\nUne question ? Appelez le ' + TELEPHONE + '.\n\nÀ très vite,\nL\'équipe du ' + NOM_EVENT + '\n' + DATES;
  const payable = d.type === 'stand' ? PRIX_STANDS[d.categorie] : d.type === 'partenaire' ? PRIX_OFFRES[d.offre] : 0;
  const txt = {
    stand: 'Nous avons bien reçu votre demande de stand' + (d.stand ? ' (stand ' + d.stand + ' souhaité)' : '') + ' pour le ' + NOM_EVENT + '. ' + (payable ? 'Si ce n\'est pas déjà fait, réglez votre stand en ligne depuis le site. ' : '') + 'L\'organisation vous appelle pour confirmer votre emplacement.',
    repas: 'Nous avons bien reçu votre demande de ' + (d.repas || '') + ' repas (' + (d.moyennes || 0) + ' moyenne(s), ' + (d.grandes || 0) + ' grande(s), ' + (d.total_ttc || '') + ' TTC)' + (+d.offerts > 0 ? ', plus ' + d.offerts + ' repas offert(s) en portion ' + String(d.offert_type).toLowerCase() : '') + ' pour le ' + NOM_EVENT + '. Le paiement se fait en ligne, par carte bancaire, depuis le site. Dès le paiement reçu, vous recevez par e-mail votre ticket repas (PDF avec un QR code) : présentez-le à l\'accueil du marché pour récupérer vos tickets, à échanger dans le stand de votre choix.',
    partenaire: 'Nous avons bien reçu votre demande pour l\'offre « ' + (d.offre || '') + ' ». ' + (payable ? 'Si ce n\'est pas déjà fait, réglez votre offre en ligne depuis le site. ' : '') + 'Nous vous rappelons sous 48 h.'
  }[d.type];
  const html = gabarit({
    apercu: 'Votre demande est bien arrivée.',
    titre: 'Demande bien reçue',
    paragraphes: ['Bonjour ' + h(nom) + ',', {
      stand: 'Merci ! Votre demande de stand pour le Marché de Noël est bien arrivée. L\'organisation vous appelle pour confirmer votre emplacement.',
      repas: 'Merci ! Votre réservation de repas est bien arrivée. Dès le paiement reçu, vous recevez votre <b>ticket repas avec QR code</b>, à présenter à l\'accueil du marché.',
      partenaire: 'Merci de vouloir soutenir le Marché de Noël ! Votre demande est bien arrivée, nous vous rappelons sous 48 h.'
    }[d.type]],
    encadre: {
      stand: [['Catégorie', h(d.categorie)], ['Stand souhaité', d.stand ? 'n° ' + h(d.stand) : 'pas de préférence'], ['Tarif', payable ? h(payable + ' € HT, soit ' + euros(payable * (1 + TVA)) + ' TTC') : '']],
      repas: [['Repas', h(d.repas)], ['Total', h(d.total_ttc) + ' TTC']],
      partenaire: [['Offre', h(d.offre)], ['Entreprise', h(d.entreprise)], ['Tarif', payable ? h(payable + ' € HT, soit ' + euros(payable * (1 + TVA)) + ' TTC') : '']]
    }[d.type],
    bouton: payable ? {texte: d.type === 'stand' ? 'Régler mon stand en ligne' : 'Régler mon offre en ligne', url: SITE + (d.type === 'stand' ? '/stand/#fexpo' : '/partenaire/#contact')} : null,
    note: payable ? 'Déjà réglé ? Parfait : vous recevez une confirmation de paiement avec votre facture.' : ''
  });
  envoyerMail({to: mail, subject: NOM_EVENT + ' · demande bien reçue', body: 'Bonjour ' + nom + ',\n\n' + txt + fin, html: html, name: NOM_EVENT});
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}


// ===================== Paiement en ligne des repas (Stripe) =====================
// La clé secrète Stripe n'est jamais dans ce fichier : Paramètres du projet (roue dentée) > Propriétés du script >
// ajouter STRIPE_SECRET = sk_test_… (tests) ou rk_live_… / sk_live_… (réel).
// Le prix est calculé ici, jamais dans le navigateur. Aucun produit à créer dans Stripe : les lignes sont envoyées
// directement (price_data).

function cleStripe() {
  return PropertiesService.getScriptProperties().getProperty('STRIPE_SECRET') || '';
}

/** Appel à l'API Stripe. Lève une erreur lisible si Stripe refuse. */
function stripe(methode, chemin, params) {
  const cle = cleStripe();
  if (!cle) throw new Error('clé Stripe absente (propriété STRIPE_SECRET)');
  const opt = {method: methode, headers: {Authorization: 'Bearer ' + cle}, muteHttpExceptions: true};
  if (params) { opt.payload = encoder(params); opt.contentType = 'application/x-www-form-urlencoded'; }
  const r = UrlFetchApp.fetch('https://api.stripe.com/v1/' + chemin, opt);
  const corps = JSON.parse(r.getContentText());
  if (r.getResponseCode() >= 400) throw new Error((corps.error && corps.error.message) || 'erreur Stripe ' + r.getResponseCode());
  return corps;
}

/** Objet imbriqué -> format attendu par Stripe : line_items[0][price_data][currency]=eur&… */
function encoder(obj, prefixe) {
  const morceaux = [];
  Object.keys(obj).forEach(function (k) {
    const v = obj[k], cle = prefixe ? prefixe + '[' + k + ']' : k;
    if (v === undefined || v === null || v === '') return;
    if (typeof v === 'object') morceaux.push(encoder(v, cle));
    else morceaux.push(encodeURIComponent(cle) + '=' + encodeURIComponent(String(v)));
  });
  return morceaux.filter(String).join('&');
}

/** Montant et repas offerts, calculés côté serveur. */
function calculRepas(m, g) {
  const offerts = new Date() <= new Date(OFFRE_FIN) ? Math.floor((m + g) / OFFRE_LOT) : 0;
  return {offerts: offerts, total: m * PRIX_MOYENNE + g * PRIX_GRANDE};
}

/** Taux de TVA Stripe (créé une fois, gardé dans les propriétés du script, séparément pour le mode test et le mode réel). */
function tauxTVA(taux, inclus) {
  const props = PropertiesService.getScriptProperties();
  const cle = 'TXR_' + (/^(sk|rk)_live_/.test(cleStripe()) ? 'LIVE' : 'TEST') + '_' + Math.round(taux * 100) + (inclus ? 'I' : 'E');
  let id = props.getProperty(cle);
  if (!id) {
    id = stripe('post', 'tax_rates', {display_name: 'TVA', percentage: Math.round(taux * 10000) / 100, inclusive: inclus, country: 'FR', description: 'TVA ' + Math.round(taux * 100) + ' %' + (inclus ? ' incluse' : '')}).id;
    props.setProperty(cle, id);
  }
  return id;
}

/** Mentions légales en bas des factures (capital et n° de TVA : propriété FACTURE_MENTIONS). */
function piedFacture() {
  const plus = PropertiesService.getScriptProperties().getProperty('FACTURE_MENTIONS') || '';
  return (FACTURE_PIED + (plus ? ' · ' + plus : '')).slice(0, 5000);
}

/** Facture Stripe d'une session payée : {numero, pdf (fichier), url}, ou null si elle n'est pas encore prête. */
function factureDe(s) {
  let f = s.invoice;
  if (!f) return null;
  if (typeof f === 'string') f = stripe('get', 'invoices/' + encodeURIComponent(f));
  if (!f || !f.invoice_pdf) return null;
  const r = UrlFetchApp.fetch(f.invoice_pdf, {muteHttpExceptions: true, followRedirects: true});
  if (r.getResponseCode() !== 200) return null;
  return {numero: String(f.number || ''), url: String(f.hosted_invoice_url || ''), pdf: r.getBlob().setName('Facture-' + (f.number || 'Marche-de-Noel') + '.pdf')};
}


/**
 * GET ?action=paiement&quoi=repas&m=2&g=1&type=Moyenne&email=…&ref=R-XXXXXXXX
 *     ?action=paiement&quoi=stand&cat=Producteur, terroir&stand=12&email=…&ref=S-XXXXXXXX
 *     ?action=paiement&quoi=partenaire&offre=Sapin Gourmand&email=…&ref=P-XXXXXXXX
 * -> {ok, url} : page de paiement Stripe. Le prix est toujours calculé ici.
 */
function creerPaiement(p) {
  try {
    if (!quota()) return {ok: false, erreur: 'trop de demandes'};
    const quoi = p.quoi || 'repas';
    if (!PREFIXE[quoi]) return {ok: false, erreur: 'type inconnu'};
    const email = String(p.email || '').trim();
    if (!MAIL_RE.test(email)) return {ok: false, erreur: 'e-mail invalide'};
    const ref = String(p.ref || '');
    if (!REF_RE.test(ref) || ref.charAt(0) !== PREFIXE[quoi]) return {ok: false, erreur: 'référence invalide'};
    // Code promo (onglet « Codes promo » du Sheet) : vérifié ici, appliqué par Stripe (visible sur la facture)
    let remise = null;
    const codeP = String(p.code || '').replace(/\s+/g, '').toUpperCase();
    if (codeP) {
      remise = codePromo(codeP, quoi);
      if (!remise.ok) return {ok: false, promo: true, erreur: remise.erreur};
    }
    const lignes = [], meta = {ref: ref, type: quoi, code_promo: codeP};
    let page = quoi;
    if (quoi === 'repas') {
      const m = parseInt(p.m || '0', 10), g = parseInt(p.g || '0', 10);
      if (!(m >= 0 && m <= 99 && g >= 0 && g <= 99 && m + g > 0)) return {ok: false, erreur: 'nombre de repas invalide'};
      const c = calculRepas(m, g);
      const typeOffert = c.offerts > 0 ? (p.type === 'Grande' ? 'grande' : 'moyenne') : '';
      const tvaR = [tauxTVA(TVA_REPAS, true)];
      if (m) lignes.push({price_data: {currency: 'eur', unit_amount: PRIX_MOYENNE * 100, product_data: {name: 'Repas · moyenne portion'}}, quantity: m, tax_rates: tvaR});
      if (g) lignes.push({price_data: {currency: 'eur', unit_amount: PRIX_GRANDE * 100, product_data: {name: 'Repas · grande portion'}}, quantity: g, tax_rates: tvaR});
      if (c.offerts > 0) lignes[0].price_data.product_data.description = '+ ' + c.offerts + ' repas offert' + (c.offerts > 1 ? 's' : '') + ' (' + typeOffert + ' portion), remis à l\'accueil';
      Object.assign(meta, {moyennes: m, grandes: g, offerts: c.offerts, type_offert: typeOffert});
    } else if (quoi === 'stand') {
      const cat = String(p.cat || '');
      if (!Object.prototype.hasOwnProperty.call(PRIX_STANDS, cat)) return {ok: false, erreur: 'catégorie de stand invalide'};
      const n = String(p.stand || '');
      if (n && !/^([1-9]|[12]\d|30)$/.test(n)) return {ok: false, erreur: 'numéro de stand invalide'};
      lignes.push({price_data: {currency: 'eur', unit_amount: PRIX_STANDS[cat] * 100, product_data: {name: 'Stand 3 × 3 m · ' + cat + ' · 18, 19 et 20 décembre', description: (n ? 'Stand n° ' + n + ' souhaité. ' : '') + 'Emplacement confirmé par téléphone par l\'organisation.'}}, quantity: 1, tax_rates: [tauxTVA(TVA, false)]});
      Object.assign(meta, {categorie: cat, stand: n});
    } else {
      const offre = String(p.offre || '');
      if (!Object.prototype.hasOwnProperty.call(PRIX_OFFRES, offre)) return {ok: false, erreur: 'offre invalide'};
      lignes.push({price_data: {currency: 'eur', unit_amount: PRIX_OFFRES[offre] * 100, product_data: {name: 'Offre partenaire « ' + offre + ' » · ' + NOM_EVENT + ' 2026'}}, quantity: 1, tax_rates: [tauxTVA(TVA, false)]});
      Object.assign(meta, {offre: offre});
    }
    const session = stripe('post', 'checkout/sessions', {
      discounts: remise ? [{coupon: remise.coupon}] : undefined,
      mode: 'payment',
      payment_method_types: ['card'],   // carte (Apple Pay et Google Pay compris) : paiement confirmé tout de suite
      locale: 'fr',
      customer_email: email,
      client_reference_id: ref,
      success_url: SITE + '/paiement/?type=' + page + '&session={CHECKOUT_SESSION_ID}',
      cancel_url: SITE + '/paiement/?type=' + page + '&annule=1',
      line_items: lignes,
      metadata: meta,
      payment_intent_data: {description: NOM_EVENT + ' · ' + quoi + ' · ' + ref},
      // Facture Stripe (numérotée, HT / TVA / TTC) créée au paiement, envoyée ensuite par ce script
      invoice_creation: {enabled: true, invoice_data: {description: NOM_EVENT + ' · ' + DATES + ' · Pamiers', footer: piedFacture(), metadata: {ref: ref}, custom_fields: [{name: 'Référence', value: ref}]}},
      billing_address_collection: 'required',                        // adresse du client, obligatoire sur une facture
      name_collection: {business: {enabled: true, optional: true}},  // nom de l'entreprise (facultatif)
      tax_id_collection: {enabled: true}                             // n° de TVA intracommunautaire (facultatif)
    });
    marquer(ref, 'Paiement en cours', false);
    return {ok: true, url: session.url};
  } catch (err) {
    console.error('creerPaiement', err);
    return {ok: false, erreur: String(err.message || err)};
  }
}

/** GET ?action=verif&session=cs_… -> {ok, paye, total, ref}. Marque la ligne « Payé » dans l'onglet Repas. */
function verifierSession(id) {
  try {
    if (!/^cs_(test|live)_[A-Za-z0-9]+$/.test(id)) return {ok: false, erreur: 'session invalide'};
    const s = stripe('get', 'checkout/sessions/' + encodeURIComponent(id));
    const paye = s.payment_status === 'paid';
    if (paye) paiementRecu(s);
    return {ok: true, paye: paye, total: s.amount_total / 100, ref: s.client_reference_id};
  } catch (err) {
    console.error('verifierSession', err);
    return {ok: false, erreur: String(err.message || err)};
  }
}

/** Écrit l'état du paiement sur la ligne de la réservation (colonne Paiement). Ne remplace jamais un « Payé ». */
function marquer(ref, texte, force) {
  if (!REF_RE.test(String(ref || ''))) return;
  const o = ONGLETS[TYPE_DE[ref.charAt(0)]], sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(o.nom);
  if (!sh || sh.getLastRow() < 2) return;
  entetes(sh, o);
  const cRef = o.cols.map(function (c) { return c[0]; }).indexOf('ref') + 1;
  const cPay = o.cols.map(function (c) { return c[0]; }).indexOf('paiement') + 1;
  const refs = sh.getRange(2, cRef, sh.getLastRow() - 1, 1).getValues();
  for (let i = refs.length - 1; i >= 0; i--) {
    if (String(refs[i][0]) !== ref) continue;
    const cell = sh.getRange(i + 2, cPay), avant = String(cell.getValue());
    if (!force && /^Payé/.test(avant)) return avant;
    cell.setValue(texte);
    return avant;
  }
}

/**
 * À lancer à la main (ou avec un déclencheur horaire) : reprend les 100 derniers paiements Stripe
 * et marque « Payé » les réservations dont le client n'est pas revenu sur le site après avoir payé.
 */
function verifierPaiements() {
  const liste = stripe('get', 'checkout/sessions?limit=100').data || [];
  let n = 0;
  liste.forEach(function (s) {
    if (s.payment_status === 'paid' && REF_RE.test(String(s.client_reference_id || ''))) {
      paiementRecu(s);
      n++;
    }
  });
  console.log(n + ' paiement(s) reporté(s) dans le Sheet');
}

/**
 * Paiement confirmé par Stripe : « Payé » dans le Sheet, puis (une seule fois) ticket repas ou e-mail de
 * confirmation au client, et e-mail à l'organisation. Appelé au retour du client et par le déclencheur horaire.
 */
function paiementRecu(s) {
  const ref = String(s.client_reference_id || '');
  if (!REF_RE.test(ref)) return;
  const texte = 'Payé ' + (s.amount_total / 100) + ' € le ' + Utilities.formatDate(new Date(s.created * 1000), 'Europe/Paris', 'dd/MM HH:mm') + (s.livemode ? '' : ' (TEST)');
  const lock = LockService.getScriptLock();
  let nouveau = false;
  try {
    lock.waitLock(10000);
    const avant = marquer(ref, texte, true);
    nouveau = avant !== undefined && !/^Payé/.test(String(avant));
  } finally {
    lock.releaseLock();
  }
  // Facture : récupérée seulement si elle n'a pas encore été envoyée (colonne Facture vide)
  let fac = null;
  const l = ligneRepas(ref);
  if (l && !String(l.d.facture || '')) { try { fac = factureDe(s); } catch (err) { console.error('factureDe', err); } }
  if (ref.charAt(0) === 'R') envoyerTicketSiBesoin(ref, fac);
  if (nouveau) { try { mailsPaiement(ref, s.amount_total / 100, !s.livemode, fac); } catch (err) { console.error('mailsPaiement', err); } }
  if (ref.charAt(0) === 'P') envoyerTicketSiBesoin(ref, null);   // partenaire : bon pour ses repas offerts
  envoyerFactureSiBesoin(ref, fac);
}

/** Note la facture comme envoyée. */
function noterFacture(l, fac) {
  l.sh.getRange(l.ligne, l.col('facture')).setValue('N° ' + fac.numero + ' envoyée le ' + Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM HH:mm') + (fac.url ? ' · ' + fac.url : ''));
}

/** Envoie la facture seule si elle n'est partie ni avec le ticket ni avec la confirmation (ex. facture prête plus tard). */
function envoyerFactureSiBesoin(ref, fac) {
  if (!fac) return false;
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const l = ligneRepas(ref);
    if (!l || !/^Payé/.test(String(l.d.paiement)) || String(l.d.facture) || !MAIL_RE.test(String(l.d.email || ''))) return false;
    envoyerMail({to: String(l.d.email), subject: NOM_EVENT + ' · votre facture n° ' + fac.numero, name: NOM_EVENT, attachments: [fac.pdf],
      body: 'Bonjour ' + String(l.d.nom || '').replace(/[<>]/g, '').slice(0, 60) + ',\n\nVous trouverez ci-joint votre facture n° ' + fac.numero + ' (référence ' + ref + ').\n\nUne question ? Appelez le ' + TELEPHONE + '.\n\nL\'équipe du ' + NOM_EVENT + '\n' + DATES,
      html: gabarit({apercu: 'Votre facture n° ' + fac.numero, titre: 'Votre facture', paragraphes: ['Bonjour ' + h(String(l.d.nom || '').slice(0, 60)) + ',', 'Vous trouverez votre facture en pièce jointe.'],
        encadre: [['Facture', 'n° ' + h(fac.numero)], ['Référence', h(ref)]], bouton: fac.url ? {texte: 'Voir la facture en ligne', url: fac.url} : null})});
    noterFacture(l, fac);
    return true;
  } catch (err) {
    console.error('envoyerFactureSiBesoin', err);
    return false;
  } finally {
    lock.releaseLock();
  }
}

/** E-mail de confirmation au client (stand, partenaire) et e-mail à l'organisation, une fois par paiement. */
function mailsPaiement(ref, montant, test, fac) {
  const l = ligneRepas(ref);
  if (!l) return;
  const d = l.d, quoi = TYPE_DE[ref.charAt(0)], nom = String(d.nom || '').replace(/[<>]/g, '').slice(0, 60);
  const quoiTexte = {repas: d.repas + ' repas', stand: 'stand « ' + d.categorie + ' »' + (d.stand ? ' (n° ' + d.stand + ' souhaité)' : ''), partenaire: 'offre partenaire « ' + d.offre + ' »'}[quoi];
  const aFaire = quoi === 'stand' ? 'À faire : appeler l\'exposant pour confirmer son emplacement, puis le noter dans l\'onglet Plan.'
    : quoi === 'partenaire' ? 'À faire : rappeler le partenaire (logo avant le 1er décembre, tournage), puis l\'ajouter dans l\'onglet Logos.'
    : 'Le ticket repas est parti automatiquement.';
  const url = SpreadsheetApp.getActiveSpreadsheet().getUrl();
  envoyerMail({to: NOTIFIER || Session.getEffectiveUser().getEmail(), subject: NOM_EVENT + ' · paiement reçu' + (test ? ' (TEST)' : '') + ' · ' + montant + ' €',
    body: 'Paiement reçu' + (test ? ' en mode TEST (pas de vrai argent)' : '') + ' : ' + montant + ' € TTC\n\n' + quoiTexte + '\n' + (d.entreprise ? 'Entreprise : ' + d.entreprise + '\n' : '')
      + 'Nom : ' + nom + '\nTéléphone : ' + (d.tel || '-') + '\nE-mail : ' + (d.email || '-') + '\nRéférence : ' + ref + '\n\n' + aFaire
      + (fac && fac.url ? '\n\nFacture n° ' + fac.numero + ' : ' + fac.url : '')
      + '\n\nTout est dans le Google Sheet : ' + url,
    html: gabarit({interne: true, apercu: montant + ' € reçus · ' + quoiTexte, titre: 'Paiement reçu' + (test ? ' (TEST)' : '') + ' · ' + euros(montant),
      paragraphes: [test ? '<b>Mode test</b> : aucun vrai argent n\'a été encaissé.' : 'Un paiement vient d\'être encaissé sur le site.'],
      encadre: [['Achat', h(quoiTexte)], ['Entreprise', h(d.entreprise || '')], ['Nom', h(nom)], ['Téléphone', h(d.tel || '')], ['E-mail', h(d.email || '')], ['Code promo', h(d.code_promo || '')], ['Référence', h(ref)], ['Facture', fac ? (fac.url ? '<a href="' + h(fac.url) + '" style="color:#a3180f">n° ' + h(fac.numero) + '</a>' : 'n° ' + h(fac.numero)) : '']],
      note: h(aFaire), bouton: {texte: 'Ouvrir le Google Sheet', url: url}})});
  if (quoi === 'repas' || !MAIL_RE.test(String(d.email || ''))) return;   // repas : le ticket fait office de confirmation
  const txt = quoi === 'stand'
    ? 'Nous avons bien reçu votre paiement de ' + montant + ' € TTC pour votre ' + quoiTexte + ' au ' + NOM_EVENT + '.\n\nL\'organisation vous appelle au ' + (d.tel || 'numéro indiqué') + ' pour confirmer votre emplacement. Installation le vendredi 18 décembre de 8 h à 11 h, ouverture à 14 h. La tonnelle est à décorer par vos soins, sur le thème de Noël.'
    : 'Nous avons bien reçu votre paiement de ' + montant + ' € TTC pour l\'' + quoiTexte + '. Merci de soutenir le ' + NOM_EVENT + ' !\n\nNous vous rappelons sous 48 h pour la suite : votre logo (à nous envoyer avant le 1er décembre), les photos et vidéos, et vos repas offerts.';
  const libre = fac && !String(d.facture || '');
  const html = gabarit({
    apercu: 'Paiement de ' + euros(montant) + ' bien reçu, merci !',
    titre: 'Paiement bien reçu, merci !',
    paragraphes: quoi === 'stand'
      ? ['Bonjour ' + h(nom) + ',', 'Votre stand au Marché de Noël est réglé. L\'organisation vous appelle au <b>' + h(d.tel || 'numéro indiqué') + '</b> pour confirmer votre emplacement.']
      : ['Bonjour ' + h(nom) + ',', 'Merci de soutenir le Marché de Noël ! Nous vous rappelons sous 48 h pour la suite : votre logo, les photos et vidéos.', 'Vos <b>' + (REPAS_OFFRES[d.offre] || 0) + ' repas offerts</b> arrivent dans un e-mail séparé, avec un bon à QR code à présenter à l\'accueil.'],
    encadre: quoi === 'stand'
      ? [['Stand', h(d.categorie)], ['Emplacement souhaité', d.stand ? 'n° ' + h(d.stand) : 'pas de préférence'], ['Montant réglé', euros(montant) + ' TTC'], ['Installation', 'vendredi 18 décembre, 8 h-11 h'], ['Ouverture', 'vendredi 18 décembre, 14 h'], ['Référence', h(ref)]]
      : [['Offre', h(d.offre)], ['Entreprise', h(d.entreprise || '')], ['Montant réglé', euros(montant) + ' TTC'], ['Repas offerts', '× ' + (REPAS_OFFRES[d.offre] || 0) + ' (bon envoyé à part)'], ['Logo à envoyer', 'avant le 1er décembre'], ['Référence', h(ref)]],
    note: (quoi === 'stand' ? 'La tonnelle est à décorer par vos soins, <b>sur le thème de Noël</b>. Le plus beau stand aura une surprise, remise le samedi 19 décembre !<br>' : '')
      + (libre ? '🧾 Votre facture n° ' + h(fac.numero) + ' est jointe à cet e-mail.' : '🧾 Votre facture vous est envoyée par e-mail.'),
    bouton: libre && fac.url ? {texte: 'Voir ma facture', url: fac.url} : null
  });
  envoyerMail({to: String(d.email), subject: NOM_EVENT + ' · paiement bien reçu', name: NOM_EVENT, attachments: libre ? [fac.pdf] : [], html: html,
    body: 'Bonjour ' + nom + ',\n\n' + txt + '\n\n' + (libre ? 'Votre facture n° ' + fac.numero + ' est jointe à cet e-mail.' : 'Votre facture vous est envoyée par e-mail.') + ' Référence : ' + ref + '.\n\nUne question ? Appelez le ' + TELEPHONE + '.\n\nÀ très vite,\nL\'équipe du ' + NOM_EVENT + '\n' + DATES});
  if (libre) noterFacture(l, fac);
}


/** Crée l'onglet « Codes promo » s'il n'existe pas (avec une ligne d'exemple désactivée). */
function ongletCodesPromo(ss) {
  const cp = ss.getSheetByName('Codes promo') || ss.insertSheet('Codes promo');
  if (cp.getLastRow() === 0) {
    cp.appendRow(['Code', 'Réduction (ex. 10 % ou 5 €)', 'Valable pour (tous, repas, stand, partenaire)', 'Jusqu\'au (date, vide = sans fin)', 'Utilisations max (vide = illimité)', 'Actif']);
    cp.appendRow(['EXEMPLE10', '10 %', 'tous', '', '', 'non']);
    cp.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#2e5e2a').setFontColor('#ffffff').setWrap(true);
    cp.getRange(2, 6, 200, 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['oui', 'non'], true).build());
    cp.setFrozenRows(1);
  }
}

// ===================== Codes promo (onglet « Codes promo » du Sheet) =====================
// Une ligne par code : Code · Réduction (« 10 % » ou « 5 € ») · Valable pour (tous / repas / stand / partenaire, séparés
// par des virgules) · Jusqu'au (date) · Utilisations max · Actif (oui / non). Le script crée le coupon Stripe tout seul.

/** Vérifie un code pour un type d'achat. Renvoie {ok, coupon} ou {ok: false, erreur}. */
function codePromo(code, quoi) {
  if (!/^[A-Z0-9_-]{1,30}$/.test(code)) return {ok: false, erreur: 'code promo invalide'};
  const sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Codes promo');
  if (!sh || sh.getLastRow() < 2) return {ok: false, erreur: 'code promo inconnu'};
  const ligne = sh.getRange(2, 1, sh.getLastRow() - 1, 6).getValues().filter(function (r) { return String(r[0]).replace(/\s+/g, '').toUpperCase() === code; })[0];
  if (!ligne || String(ligne[5]).trim().toLowerCase() !== 'oui') return {ok: false, erreur: 'code promo inconnu'};
  const pour = String(ligne[2] || 'tous').toLowerCase();
  if (!/tous/.test(pour) && pour.split(/[,;\s]+/).indexOf(quoi) < 0) return {ok: false, erreur: 'ce code promo n\'est pas valable ici'};
  if (ligne[3]) {
    const fin = ligne[3] instanceof Date ? ligne[3] : new Date(String(ligne[3]).split('/').reverse().join('-'));
    fin.setHours(23, 59, 59);
    if (!isNaN(fin) && new Date() > fin) return {ok: false, erreur: 'ce code promo a expiré'};
  }
  const max = parseInt(ligne[4], 10);
  if (max > 0 && utilisations(code) >= max) return {ok: false, erreur: 'ce code promo a déjà été utilisé le nombre de fois prévu'};
  const m = String(ligne[1]).replace(',', '.').match(/^\s*(\d+(?:\.\d+)?)\s*(%|€|eur)?\s*$/i);
  if (!m || +m[1] <= 0) return {ok: false, erreur: 'réduction mal écrite dans le Sheet (ex. 10 % ou 5 €)'};
  const pct = !m[2] || m[2] === '%';
  if (pct && +m[1] > 100) return {ok: false, erreur: 'réduction mal écrite dans le Sheet (plus de 100 %)'};
  const props = PropertiesService.getScriptProperties();
  const cle = 'CPN_' + (/^(sk|rk)_live_/.test(cleStripe()) ? 'L' : 'T') + '_' + code + '_' + (pct ? 'P' : 'E') + m[1];
  let id = props.getProperty(cle);
  if (!id) {
    id = stripe('post', 'coupons', pct ? {percent_off: +m[1], duration: 'once', name: 'Code ' + code} : {amount_off: Math.round(+m[1] * 100), currency: 'eur', duration: 'once', name: 'Code ' + code}).id;
    props.setProperty(cle, id);
  }
  return {ok: true, coupon: id};
}

/** Nombre de paiements faits avec ce code (lignes « Payé » des onglets Repas, Stands et Partenaires). */
function utilisations(code) {
  let n = 0;
  Object.keys(ONGLETS).forEach(function (k) {
    const o = ONGLETS[k], sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(o.nom);
    if (!sh || sh.getLastRow() < 2) return;
    const cles = o.cols.map(function (c) { return c[0]; }), cc = cles.indexOf('code_promo'), cp = cles.indexOf('paiement');
    sh.getRange(2, 1, sh.getLastRow() - 1, cles.length).getValues().forEach(function (r) { if (String(r[cc]).toUpperCase() === code && /^Payé/.test(String(r[cp]))) n++; });
  });
  return n;
}

// ===================== Modèle des e-mails (aux couleurs du site) =====================

/** Échappe un texte pour le HTML d'un e-mail. */
function h(t) { return String(t === undefined || t === null ? '' : t).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); }

/**
 * E-mail HTML : bannière, ruban rouge, carte crème bordée d'or, bouton, pied de page.
 * o = {apercu, titre, paragraphes: [html], encadre: [[libellé, valeur]], bouton: {texte, url}, note: html, interne: bool}
 * Les paragraphes et la note sont déjà du HTML (échapper les données avec h()).
 */
function gabarit(o) {
  const F = "'Barlow',Arial,Helvetica,sans-serif", FC = "'Barlow Condensed','Arial Narrow',Arial,sans-serif", FS = "'Kaushan Script',Georgia,'Times New Roman',serif";
  const encadre = (o.encadre || []).filter(function (l) { return l && l[1] !== '' && l[1] !== undefined && l[1] !== null; }).map(function (l, i) {
    return '<tr><td style="padding:10px 14px;' + (i ? 'border-top:1px solid #f1e2bf;' : '') + 'font:600 13px/1.3 ' + FC + ';color:#8a6d55;text-transform:uppercase;letter-spacing:.04em;width:42%;vertical-align:top">' + h(l[0]) + '</td>'
      + '<td style="padding:10px 14px;' + (i ? 'border-top:1px solid #f1e2bf;' : '') + 'font:600 15px/1.35 ' + F + ';color:#1a1a17;vertical-align:top">' + l[1] + '</td></tr>';
  }).join('');
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only">'
    + '<link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Barlow+Condensed:wght@600;700;800&family=Kaushan+Script&display=swap" rel="stylesheet"></head>'
    + '<body style="margin:0;padding:0;background:#efe3c8">'
    + '<div style="display:none;max-height:0;overflow:hidden;opacity:0">' + h(o.apercu || '') + '</div>'
    + '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#efe3c8"><tr><td align="center" style="padding:24px 12px">'
    + '<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#fffaf0;border:2px solid #c8962e;border-radius:18px;overflow:hidden;box-shadow:0 10px 30px rgba(90,50,15,.18)">'
    // bannière
    + '<tr><td style="padding:0;line-height:0"><img src="' + SITE + '/img/mail-bandeau.jpg" width="600" alt="Marché de Noël des Artisans &amp; Commerçants" style="display:block;width:100%;max-width:600px;height:auto;border:0"></td></tr>'
    // ruban
    + '<tr><td align="center" style="background:#a3180f;background-image:linear-gradient(180deg,#d8322a,#a3180f);border-top:3px solid #c8962e;border-bottom:3px solid #c8962e;padding:14px 16px">'
    + '<div style="font:400 30px/1.1 ' + FS + ';color:#ffffff">Marché de Noël</div>'
    + '<div style="margin-top:4px;font:600 14px/1.3 ' + FC + ';color:#ffe6a6;letter-spacing:.08em;text-transform:uppercase">des Artisans &amp; Commerçants · Pamiers</div></td></tr>'
    // contenu
    + '<tr><td style="padding:28px 28px 8px">'
    + (o.interne ? '<div style="display:inline-block;margin-bottom:10px;padding:3px 10px;border-radius:999px;background:#2e5e2a;color:#fff;font:700 11px/1.6 ' + FC + ';letter-spacing:.08em;text-transform:uppercase">Organisation</div>' : '')
    + '<h1 style="margin:0 0 14px;font:800 26px/1.15 ' + FC + ';color:#a3180f">' + h(o.titre) + '</h1>'
    + (o.paragraphes || []).map(function (t) { return '<p style="margin:0 0 14px;font:500 16px/1.55 ' + F + ';color:#1a1a17">' + t + '</p>'; }).join('')
    + (encadre ? '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:6px 0 18px;background:#ffffff;border:1.5px solid #ecd3a0;border-radius:12px;border-collapse:separate">' + encadre + '</table>' : '')
    + (o.bouton ? '<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 18px"><tr><td style="border-radius:999px;background:#c8251a;border:2px solid #c8962e"><a href="' + h(o.bouton.url) + '" style="display:inline-block;padding:13px 26px;font:700 16px/1 ' + FC + ';color:#ffffff;text-decoration:none;letter-spacing:.03em">' + h(o.bouton.texte) + '</a></td></tr></table>' : '')
    + (o.note ? '<div style="margin:0 0 18px;padding:12px 14px;background:#fff3d6;border-left:4px solid #c8962e;border-radius:8px;font:500 14px/1.5 ' + F + ';color:#5a3d1e">' + o.note + '</div>' : '')
    + '<p style="margin:6px 0 22px;font:500 15px/1.5 ' + F + ';color:#1a1a17">À très vite,<br><span style="font:400 20px/1.4 ' + FS + ';color:#a3180f">L\'équipe du Marché de Noël</span></p>'
    + '</td></tr>'
    // pied de page
    + '<tr><td style="background:#3b2416;background-image:linear-gradient(180deg,#4a2d1b,#2f1c11);padding:18px 24px;border-top:3px solid #c8962e">'
    + '<div style="font:700 15px/1.4 ' + FC + ';color:#ffe6a6;letter-spacing:.03em">Vendredi 18 (14 h-20 h) · samedi 19 (10 h-20 h) · dimanche 20 décembre (10 h-18 h)</div>'
    + '<div style="margin-top:6px;font:500 13px/1.5 ' + F + ';color:#f3e3c3">10 B rue Jean Rostand, 09100 Pamiers · <a href="tel:+33534032440" style="color:#f3e3c3;text-decoration:none">' + TELEPHONE + '</a> · <a href="' + SITE + '" style="color:#ffe6a6">noel-rcimmo.fr</a></div>'
    + '</td></tr></table>'
    + '<div style="max-width:600px;margin-top:12px;font:500 11px/1.5 ' + F + ';color:#8a6d55">Vous recevez cet e-mail suite à votre demande sur ' + SITE.replace('https://', '') + '. Pour toute question, répondez simplement à cet e-mail.</div>'
    + '</td></tr></table></body></html>';
}

function euros(n) { return String(Math.round(n * 100) / 100).replace('.', ',') + ' €'; }

// ===================== Envoi des e-mails (Resend, ou Gmail en secours) =====================

function cleResend() { return PropertiesService.getScriptProperties().getProperty('RESEND_KEY') || ''; }
function expediteur() { return PropertiesService.getScriptProperties().getProperty('RESEND_FROM') || EXPEDITEUR_DEFAUT; }

/**
 * Envoie un e-mail : {to, subject, body, name?, attachments?: [fichiers]}.
 * Avec Resend : depuis l'adresse du site, réponse vers REPONDRE_A. Si Resend refuse, on retombe sur Gmail.
 */
function envoyerMail(m) {
  if (m.name && COPIE_CLIENTS && String(m.to).indexOf(COPIE_CLIENTS) < 0) m.bcc = COPIE_CLIENTS;   // e-mail client : copie à la secrétaire
  const cle = cleResend();
  if (cle) {
    const corps = {
      from: (m.name || NOM_EVENT) + ' <' + expediteur() + '>',
      to: String(m.to).split(',').map(function (x) { return x.trim(); }).filter(String),
      subject: m.subject,
      text: m.body,
      html: m.html || undefined,
      reply_to: REPONDRE_A,
      bcc: m.bcc ? [m.bcc] : undefined,
      attachments: (m.attachments || []).map(function (b) { return {filename: b.getName(), content: Utilities.base64Encode(b.getBytes())}; })
    };
    const r = UrlFetchApp.fetch('https://api.resend.com/emails', {method: 'post', contentType: 'application/json', headers: {Authorization: 'Bearer ' + cle}, payload: JSON.stringify(corps), muteHttpExceptions: true});
    if (r.getResponseCode() < 300) return;
    console.error('Resend refuse l\'e-mail (' + r.getResponseCode() + ') : ' + r.getContentText() + ' — envoi par Gmail');
  }
  const g = {to: m.to, subject: m.subject, body: m.body, name: m.name, attachments: m.attachments};
  if (m.bcc) g.bcc = m.bcc;
  if (REPONDRE_A) g.replyTo = REPONDRE_A;   // les réponses vont à la secrétaire, même par Gmail
  if (m.html) g.htmlBody = m.html;
  MailApp.sendEmail(g);
}

/** Menu : clé Resend et adresse d'envoi, vérifiées par un e-mail de test. */
function configurerEmails() {
  const ui = SpreadsheetApp.getUi(), props = PropertiesService.getScriptProperties();
  const cle = demander(ui, '1/2 · Clé Resend', 'Colle la clé API Resend (re_…). Resend > API Keys. Tape « gmail » pour revenir aux envois par Gmail.', props.getProperty('RESEND_KEY'));
  if (cle === null) return;
  if (cle.toLowerCase() === 'gmail') { props.deleteProperty('RESEND_KEY'); ui.alert('Les e-mails repartent par Gmail.'); return; }
  if (!/^re_[A-Za-z0-9_]+$/.test(cle)) { ui.alert('Ce n\'est pas une clé Resend (elle commence par re_). Rien n\'a été changé.'); return; }
  const de = demander(ui, '2/2 · Adresse d\'envoi', 'Adresse qui envoie les e-mails. Son domaine doit être vérifié dans Resend (Domains). Actuelle : ' + expediteur(), expediteur());
  if (de === null) return;
  if (!MAIL_RE.test(de)) { ui.alert('Adresse invalide. Rien n\'a été changé.'); return; }
  const moi = Session.getEffectiveUser().getEmail() || NOTIFIER.split(',')[0];
  const r = UrlFetchApp.fetch('https://api.resend.com/emails', {method: 'post', contentType: 'application/json', headers: {Authorization: 'Bearer ' + cle}, muteHttpExceptions: true,
    payload: JSON.stringify({from: NOM_EVENT + ' <' + de + '>', to: [moi], subject: NOM_EVENT + ' · test Resend', text: 'Cet e-mail confirme que Resend est bien branché. Les clients recevront leurs e-mails depuis ' + de + '.', reply_to: REPONDRE_A})});
  if (r.getResponseCode() >= 300) { ui.alert('Resend refuse l\'envoi : ' + r.getContentText() + '\n\nSouvent : le domaine de ' + de + ' n\'est pas encore vérifié dans Resend. Rien n\'a été changé.'); return; }
  props.setProperty('RESEND_KEY', cle); props.setProperty('RESEND_FROM', de);
  ui.alert('Resend est branché ✓\nUn e-mail de test vient de partir vers ' + moi + '.\nLes clients recevront leurs e-mails depuis ' + de + ' (réponses vers ' + REPONDRE_A + ').');
}

// ===================== Menu « Marché de Noël » dans le Google Sheet =====================
// Configurer : clé Stripe, code accueil, mentions des factures, déclencheur horaire. Tout se fait par des fenêtres,
// sans ouvrir Apps Script. Les secrets vont dans les propriétés du script, jamais dans ce fichier.

function onOpen() {
  try { ongletCodesPromo(SpreadsheetApp.getActiveSpreadsheet()); } catch (err) {}
  SpreadsheetApp.getUi().createMenu('Marché de Noël')
    .addItem('Configurer les paiements', 'configurer')
    .addItem('Configurer les e-mails (Resend)', 'configurerEmails')
    .addItem('Vérifier la configuration', 'etatConfiguration')
    .addItem('Reprendre les paiements maintenant', 'verifierPaiements')
    .addToUi();
}

/** Demande une valeur ; renvoie null si on annule, l'ancienne valeur si on laisse vide. */
function demander(ui, titre, texte, ancienne) {
  const r = ui.prompt(titre, texte + (ancienne ? '\n\nLaisser vide pour garder la valeur actuelle.' : ''), ui.ButtonSet.OK_CANCEL);
  if (r.getSelectedButton() !== ui.Button.OK) return null;
  const v = r.getResponseText().trim();
  return v || ancienne || '';
}

function configurer() {
  const ui = SpreadsheetApp.getUi(), props = PropertiesService.getScriptProperties();
  // 1. Clé Stripe, vérifiée auprès de Stripe avant d'être enregistrée
  const cle = demander(ui, '1/3 · Clé secrète Stripe', 'Colle la clé secrète Stripe : sk_test_… pour les tests, sk_live_… pour le réel (Stripe > Développeurs > Clés API).', props.getProperty('STRIPE_SECRET'));
  if (cle === null) return;
  if (!/^(sk|rk)_(test|live)_[A-Za-z0-9]+$/.test(cle)) { ui.alert('Ce n\'est pas une clé secrète Stripe (elle commence par sk_test_ ou sk_live_). Rien n\'a été changé.'); return; }
  const r = UrlFetchApp.fetch('https://api.stripe.com/v1/account', {headers: {Authorization: 'Bearer ' + cle}, muteHttpExceptions: true});
  const compte = JSON.parse(r.getContentText());
  if (r.getResponseCode() !== 200) { ui.alert('Stripe refuse cette clé : ' + ((compte.error && compte.error.message) || r.getResponseCode()) + '\nRien n\'a été changé.'); return; }
  props.setProperty('STRIPE_SECRET', cle);
  // 2. Code accueil (6 chiffres tirés au hasard si rien n'existe)
  let code = props.getProperty('ACCUEIL_CODE');
  if (!code) code = String(100000 + Math.floor(Math.random() * 900000));
  const c = demander(ui, '2/3 · Code accueil', 'Code à taper sur la page /accueil du site pour scanner les tickets. Code actuel : ' + code, code);
  if (c === null) return;
  props.setProperty('ACCUEIL_CODE', c);
  // 3. Mentions des factures
  const m = demander(ui, '3/3 · Mentions des factures', 'Capital social et n° de TVA de RC IMMO, ex. : Capital 1 200 € · TVA FR12345678901', props.getProperty('FACTURE_MENTIONS'));
  if (m === null) return;
  if (m) props.setProperty('FACTURE_MENTIONS', m.slice(0, 300));
  // Déclencheur toutes les 15 minutes (un seul), onglets et colonnes à jour
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'verifierPaiements') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('verifierPaiements').timeBased().everyMinutes(15).create();
  installer();
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(ONGLETS).forEach(function (k) { const sh = ss.getSheetByName(ONGLETS[k].nom); if (sh) entetes(sh, ONGLETS[k]); });
  ui.alert('C\'est prêt ✓\n\n' + resumeConfiguration(compte, cle));
}

function resumeConfiguration(compte, cle) {
  const props = PropertiesService.getScriptProperties();
  const live = /_live_/.test(cle);
  return 'Stripe : ' + (live ? 'MODE RÉEL (vrais paiements)' : 'mode TEST (carte 4242…, pas de vrai argent)') + '\n'
    + 'Compte : ' + ((compte.settings && compte.settings.dashboard && compte.settings.dashboard.display_name) || compte.id) + (compte.charges_enabled ? ' · paiements activés' : ' · PAIEMENTS NON ACTIVÉS (finir le dossier Stripe)') + '\n'
    + 'Code accueil : ' + (props.getProperty('ACCUEIL_CODE') || 'aucun') + '\n'
    + 'Mentions des factures : ' + (props.getProperty('FACTURE_MENTIONS') || 'MANQUANTES (capital et n° de TVA)') + '\n'
    + 'Vérification des paiements : toutes les 15 minutes\n'
    + 'E-mails : ' + (cleResend() ? 'Resend, depuis ' + expediteur() : 'Gmail (' + MailApp.getRemainingDailyQuota() + ' restants aujourd\'hui). Resend : menu Marché de Noël > Configurer les e-mails');
}

function etatConfiguration() {
  const ui = SpreadsheetApp.getUi(), cle = cleStripe();
  if (!cle) { ui.alert('Aucune clé Stripe. Menu Marché de Noël > Configurer les paiements.'); return; }
  const r = UrlFetchApp.fetch('https://api.stripe.com/v1/account', {headers: {Authorization: 'Bearer ' + cle}, muteHttpExceptions: true});
  const declencheur = ScriptApp.getProjectTriggers().some(function (t) { return t.getHandlerFunction() === 'verifierPaiements'; });
  ui.alert((r.getResponseCode() === 200 ? '' : 'ATTENTION : Stripe refuse la clé enregistrée.\n\n') + resumeConfiguration(JSON.parse(r.getContentText()), cle).replace('toutes les 15 minutes', declencheur ? 'toutes les 15 minutes' : 'NON INSTALLÉE'));
}

// ===================== Ticket repas (PDF + QR code) et contrôle à l'accueil =====================
// Après le paiement, le client reçoit UNE fois un PDF avec un QR code signé (impossible à fabriquer sans la clé
// secrète TICKET_SECRET, créée automatiquement). À l'accueil, la page /accueil du site scanne le QR :
// le script vérifie la signature, que la réservation est payée et que les tickets n'ont pas déjà été remis.
// Propriété du script ACCUEIL_CODE = code à taper sur la page /accueil (sans lui, le contrôle est refusé).

const ACCUEIL_ESSAIS_MAX = 20;   // codes accueil faux tolérés par heure, au-delà le contrôle est bloqué une heure

function secretTicket() {
  const props = PropertiesService.getScriptProperties();
  let s = props.getProperty('TICKET_SECRET');
  if (!s) { s = Utilities.getUuid() + Utilities.getUuid(); props.setProperty('TICKET_SECRET', s); }
  return s;
}

/** Signature courte d'une référence (12 caractères hexadécimaux, HMAC-SHA256). */
function signer(ref) {
  const octets = Utilities.computeHmacSha256Signature(ref, secretTicket());
  return octets.slice(0, 6).map(function (b) { return ('0' + ((b + 256) % 256).toString(16)).slice(-2); }).join('').toUpperCase();
}

/** Contenu du QR code : R-XXXXXXXX-SIGNATURE */
function codeTicket(ref) { return ref + '-' + signer(ref); }

/** Lit une ligne par sa référence (onglet Repas, Stands ou Partenaires selon la première lettre). */
function ligneRepas(ref) {
  if (!REF_RE.test(String(ref || ''))) return null;
  const o = ONGLETS[TYPE_DE[ref.charAt(0)]], sh = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(o.nom);
  if (!sh || sh.getLastRow() < 2) return null;
  entetes(sh, o);
  const cles = o.cols.map(function (c) { return c[0]; });
  const valeurs = sh.getRange(2, 1, sh.getLastRow() - 1, cles.length).getValues();
  for (let i = valeurs.length - 1; i >= 0; i--) {
    if (String(valeurs[i][cles.indexOf('ref')]) !== ref) continue;
    const d = {};
    cles.forEach(function (k, j) { d[k] = valeurs[i][j]; });
    return {sh: sh, ligne: i + 2, d: d, col: function (k) { return cles.indexOf(k) + 1; }};
  }
  return null;
}

/** Envoie le ticket une seule fois (colonne Ticket vide), uniquement si la réservation est payée. */
function envoyerTicketSiBesoin(ref, fac) {
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const l = ligneRepas(ref);
    if (!l || !/^Payé/.test(String(l.d.paiement)) || String(l.d.ticket)) return false;
    const avecFacture = fac && !String(l.d.facture || '');
    envoyerTicket(l.d, avecFacture ? fac : null);
    if (avecFacture) noterFacture(l, fac);
    l.sh.getRange(l.ligne, l.col('ticket')).setValue('Envoyé le ' + Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM HH:mm'));
    return true;
  } catch (err) {
    console.error('envoyerTicketSiBesoin', err);
    return false;
  } finally {
    lock.releaseLock();
  }
}

/** À lancer à la main si un client a perdu son e-mail : renvoyerTicket('R-XXXXXXXX'). */
function renvoyerTicket(ref) {
  const l = ligneRepas(ref);
  if (!l || !/^Payé/.test(String(l.d.paiement))) throw new Error('réservation introuvable ou non payée');
  envoyerTicket(l.d);
  l.sh.getRange(l.ligne, l.col('ticket')).setValue('Renvoyé le ' + Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM HH:mm'));
}

/** QR code en image GIF (bibliothèque qrcode-generator, en bas de ce fichier). */
function qrDataUrl(texte) {
  const qr = qrcode(0, 'M');
  qr.addData(texte);
  qr.make();
  return qr.createDataURL(8, 4);
}

/** Construit le PDF du ticket et l'envoie par e-mail. */
function envoyerTicket(d, fac) {
  const code = codeTicket(String(d.ref));
  const part = String(d.ref).charAt(0) === 'P';   // partenaire : repas offerts avec son offre (grande portion)
  const m = part ? 0 : parseInt(d.moyennes || '0', 10), g = part ? (REPAS_OFFRES[d.offre] || 0) : parseInt(d.grandes || '0', 10), off = part ? 0 : parseInt(d.offerts || '0', 10);
  const esc = function (t) { return String(t).replace(/[&<>"']/g, function (c) { return {'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]; }); };
  let bandeau = '';
  try {
    const img = UrlFetchApp.fetch(SITE + '/img/ticket-bandeau.jpg', {muteHttpExceptions: true});
    if (img.getResponseCode() === 200) bandeau = 'data:image/jpeg;base64,' + Utilities.base64Encode(img.getBlob().getBytes());
  } catch (err) {}
  const ligneRepasHtml = function (n, libelle) { return n > 0 ? '<tr><td style="padding:6px 0;font-size:16px">' + libelle + '</td><td style="padding:6px 0;font-size:20px;font-weight:bold;text-align:right">× ' + n + '</td></tr>' : ''; };
  const html = '<html><body style="margin:0;font-family:Arial,Helvetica,sans-serif;color:#2a1a12">'
    + '<div style="width:640px;margin:0 auto;border:3px solid #c8962e;border-radius:18px;overflow:hidden">'
    + (bandeau ? '<img src="' + bandeau + '" style="width:640px;height:180px;object-fit:cover;display:block">' : '')
    + '<div style="background:#a3180f;color:#fff;text-align:center;padding:12px 10px"><div style="font-size:26px;font-weight:bold;letter-spacing:1px">' + esc(NOM_EVENT) + ' · ' + (part ? 'BONS REPAS PARTENAIRE' : 'TICKET REPAS') + '</div>'
    + '<div style="font-size:14px;margin-top:4px">' + esc(DATES) + ' · Pamiers</div></div>'
    + '<table style="width:100%;border-collapse:collapse"><tr>'
    + '<td style="width:58%;vertical-align:top;padding:18px 22px">'
    + '<div style="font-size:13px;color:#6b5546">Au nom de</div><div style="font-size:20px;font-weight:bold;margin-bottom:12px">' + esc(part ? (d.entreprise || d.nom) : d.nom) + '</div>'
    + '<table style="width:100%;border-top:1px solid #ecd3a0">' + ligneRepasHtml(m, 'Repas moyenne portion') + ligneRepasHtml(g, 'Repas grande portion')
    + (off > 0 ? '<tr><td style="padding:6px 0;font-size:16px;color:#2e5e2a">Offert' + (off > 1 ? 's' : '') + ' (' + esc(String(d.offert_type || 'moyenne').toLowerCase()) + ')</td><td style="padding:6px 0;font-size:20px;font-weight:bold;text-align:right;color:#2e5e2a">× ' + off + '</td></tr>' : '')
    + '</table>'
    + (part ? '<div style="margin-top:10px;font-size:14px">Offerts avec votre offre <b>« ' + esc(d.offre) + ' »</b></div>' : '<div style="margin-top:10px;font-size:14px">Total réglé : <b>' + esc(d.total_ttc) + ' TTC</b></div>')
    + '<div style="margin-top:14px;font-size:12px;color:#6b5546;line-height:1.5">' + (part ? 'Présentez ce QR code à l’accueil du marché : on vous remet ' + g + ' tickets repas, à distribuer à vos salariés et invités. 1 ticket = 1 portion, dans le stand de leur choix, pendant les 3 jours.' : 'Présentez ce QR code à l’accueil du marché : on vous remet vos tickets, à échanger dans le stand de votre choix pendant les 3 jours.') + ' Ce QR code ne fonctionne qu’une seule fois.</div>'
    + '</td><td style="width:42%;text-align:center;vertical-align:middle;padding:14px;background:#fffaf0;border-left:2px dashed #c8962e">'
    + '<img src="' + qrDataUrl(code) + '" style="width:210px;height:210px">'
    + '<div style="font-family:Courier New,monospace;font-size:13px;margin-top:6px;letter-spacing:1px">' + esc(code) + '</div></td></tr></table></div></body></html>';
  const pdf = Utilities.newBlob(html, 'text/html', 'ticket.html').getAs('application/pdf').setName((part ? 'Bons-repas-' : 'Ticket-repas-') + d.ref + '.pdf');
  if (part) {
    const nomP = String(d.nom || '').replace(/[<>]/g, '').slice(0, 60);
    envoyerMail({to: String(d.email), subject: NOM_EVENT + ' · vos ' + g + ' bons repas', name: NOM_EVENT, attachments: [pdf],
      body: 'Bonjour ' + nomP + ',\n\nVotre offre « ' + d.offre + ' » comprend ' + g + ' repas offerts (grande portion). Votre bon est en pièce jointe (PDF avec QR code).\n\nLe jour du marché, présentez le QR code à l\'accueil : on vous remet ' + g + ' tickets repas, à distribuer à vos salariés et invités. 1 ticket = 1 portion, dans le stand de leur choix, pendant les 3 jours.\nLe QR code ne fonctionne qu\'une seule fois.\n\nRéférence : ' + d.ref + '\n\nUne question ? Appelez le ' + TELEPHONE + '.\n\nÀ très vite,\nL\'équipe du ' + NOM_EVENT + '\n' + DATES,
      html: gabarit({apercu: 'Vos ' + g + ' repas offerts : bon avec QR code en pièce jointe.', titre: 'Vos ' + g + ' repas offerts 🎫',
        paragraphes: ['Bonjour ' + h(nomP) + ',', 'Votre offre <b>« ' + h(d.offre) + ' »</b> comprend <b>' + g + ' repas offerts</b>, en grande portion. Votre bon est en pièce jointe (PDF, avec QR code).'],
        encadre: [['Entreprise', h(d.entreprise || '')], ['Repas offerts', '× ' + g + ' (grande portion)'], ['Valeur', euros(g * PRIX_GRANDE) + ' TTC'], ['Référence', h(d.ref)]],
        note: '<b>Le jour du marché :</b> présentez le QR code à l\'accueil (sur votre téléphone ou imprimé). On vous remet <b>' + g + ' tickets repas</b>, à distribuer à vos salariés et invités : 1 ticket = 1 portion, dans le stand de leur choix, pendant les 3 jours.<br>⚠️ Le QR code ne fonctionne qu\'une seule fois.'})});
    return;
  }
  const corps = 'Bonjour ' + String(d.nom).replace(/[<>]/g, '') + ',\n\nMerci pour votre paiement ! Vous trouverez votre ticket repas en pièce jointe (PDF).\n\n'
    + 'Le jour du marché, présentez le QR code à l\'accueil (sur votre téléphone ou imprimé) : on vous remet vos tickets, à échanger dans le stand de votre choix.\n'
    + 'Attention : le QR code ne fonctionne qu\'une seule fois, ne le partagez pas.\n\nRéférence : ' + d.ref + '\n\nUne question ? Appelez le ' + TELEPHONE + '.\n\nÀ très vite,\nL\'équipe du ' + NOM_EVENT + '\n' + DATES;
  const htmlMail = gabarit({
    apercu: 'Votre ticket repas avec QR code est en pièce jointe.',
    titre: 'Votre ticket repas 🎫',
    paragraphes: ['Bonjour ' + h(String(d.nom).slice(0, 60)) + ',', 'Merci pour votre paiement ! Votre <b>ticket repas</b> est en pièce jointe (PDF, avec votre QR code).'],
    encadre: [['Moyennes portions', m > 0 ? '× ' + m : ''], ['Grandes portions', g > 0 ? '× ' + g : ''], ['Repas offerts', off > 0 ? '× ' + off + ' (' + h(String(d.offert_type || 'moyenne').toLowerCase()) + ')' : ''], ['Total réglé', h(d.total_ttc) + ' TTC'], ['Référence', h(d.ref)]],
    note: '<b>Le jour du marché :</b> présentez le QR code à l\'accueil (sur votre téléphone ou imprimé). On vous remet vos tickets, à échanger dans le stand de votre choix pendant les 3 jours.<br>⚠️ Le QR code ne fonctionne qu\'une seule fois : ne le partagez pas.' + (fac ? '<br>🧾 Votre facture n° ' + h(fac.numero) + ' est également jointe.' : '')
  });
  envoyerMail({to: String(d.email), subject: NOM_EVENT + ' · votre ticket repas', body: corps + (fac ? '\n\nVotre facture n° ' + fac.numero + ' est également jointe.' : ''), html: htmlMail, name: NOM_EVENT, attachments: fac ? [pdf, fac.pdf] : [pdf]});
}

/** Vérifie le code accueil, avec limite d'essais. */
function codeAccueilOk(pin) {
  const attendu = PropertiesService.getScriptProperties().getProperty('ACCUEIL_CODE') || '';
  if (!attendu) return {ok: false, erreur: 'code accueil non configuré (propriété ACCUEIL_CODE)'};
  const cache = CacheService.getScriptCache(), cle = 'pin_' + Utilities.formatDate(new Date(), 'Europe/Paris', 'yyyyMMddHH');
  const essais = parseInt(cache.get(cle) || '0', 10);
  if (essais >= ACCUEIL_ESSAIS_MAX) return {ok: false, erreur: 'trop de codes faux, réessayez dans une heure'};
  if (String(pin || '') !== attendu) { cache.put(cle, String(essais + 1), 3700); return {ok: false, erreur: 'code accueil incorrect'}; }
  return {ok: true};
}

/**
 * GET ?action=controle&code=R-…-SIG&pin=… : état du ticket, sans rien modifier.
 * GET ?action=retirer&code=…&pin=…        : marque les tickets comme remis (une seule fois, sous verrou).
 * etat : ok (à remettre) · deja (déjà remis) · nonpaye · inconnu · faux (signature invalide)
 */
function controlerTicket(p, retirer) {
  const acces = codeAccueilOk(p.pin);
  if (!acces.ok) return acces;
  const code = String(p.code || '').trim().toUpperCase();
  const m = code.match(/^([RP]-[A-Z0-9]{8})-([0-9A-F]{12})$/);
  if (!m) return {ok: true, etat: 'faux'};
  const ref = m[1];
  // comparaison en temps constant de la signature
  const attendu = signer(ref);
  let diff = 0;
  for (let i = 0; i < 12; i++) diff |= attendu.charCodeAt(i) ^ m[2].charCodeAt(i);
  if (diff !== 0) return {ok: true, etat: 'faux'};
  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000);
    const l = ligneRepas(ref);
    if (!l) return {ok: true, etat: 'inconnu', ref: ref};
    const part = ref.charAt(0) === 'P';
    const info = part
      ? {ok: true, ref: ref, nom: String(l.d.entreprise || l.d.nom) + ' (partenaire)', moyennes: 0, grandes: REPAS_OFFRES[l.d.offre] || 0, offerts: 0, type_offert: '', retrait: String(l.d.retrait || '')}
      : {ok: true, ref: ref, nom: String(l.d.nom), moyennes: parseInt(l.d.moyennes || '0', 10), grandes: parseInt(l.d.grandes || '0', 10), offerts: parseInt(l.d.offerts || '0', 10), type_offert: String(l.d.offert_type || ''), retrait: String(l.d.retrait || '')};
    if (!/^Payé/.test(String(l.d.paiement))) { info.etat = 'nonpaye'; return info; }
    if (info.retrait) { info.etat = 'deja'; return info; }
    if (!retirer) { info.etat = 'ok'; return info; }
    info.retrait = 'Remis le ' + Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM à HH:mm');
    l.sh.getRange(l.ligne, l.col('retrait')).setValue(info.retrait);
    info.etat = 'remis';
    return info;
  } finally {
    lock.releaseLock();
  }
}


// ===================== Bibliothèque qrcode-generator 1.4.4 (Kazuhiko Arase, licence MIT), sans modification =====================
//---------------------------------------------------------------------
//
// QR Code Generator for JavaScript
//
// Copyright (c) 2009 Kazuhiko Arase
//
// URL: http://www.d-project.com/
//
// Licensed under the MIT license:
//  http://www.opensource.org/licenses/mit-license.php
//
// The word 'QR Code' is registered trademark of
// DENSO WAVE INCORPORATED
//  http://www.denso-wave.com/qrcode/faqpatent-e.html
//
//---------------------------------------------------------------------

var qrcode = function() {

  //---------------------------------------------------------------------
  // qrcode
  //---------------------------------------------------------------------

  /**
   * qrcode
   * @param typeNumber 1 to 40
   * @param errorCorrectionLevel 'L','M','Q','H'
   */
  var qrcode = function(typeNumber, errorCorrectionLevel) {

    var PAD0 = 0xEC;
    var PAD1 = 0x11;

    var _typeNumber = typeNumber;
    var _errorCorrectionLevel = QRErrorCorrectionLevel[errorCorrectionLevel];
    var _modules = null;
    var _moduleCount = 0;
    var _dataCache = null;
    var _dataList = [];

    var _this = {};

    var makeImpl = function(test, maskPattern) {

      _moduleCount = _typeNumber * 4 + 17;
      _modules = function(moduleCount) {
        var modules = new Array(moduleCount);
        for (var row = 0; row < moduleCount; row += 1) {
          modules[row] = new Array(moduleCount);
          for (var col = 0; col < moduleCount; col += 1) {
            modules[row][col] = null;
          }
        }
        return modules;
      }(_moduleCount);

      setupPositionProbePattern(0, 0);
      setupPositionProbePattern(_moduleCount - 7, 0);
      setupPositionProbePattern(0, _moduleCount - 7);
      setupPositionAdjustPattern();
      setupTimingPattern();
      setupTypeInfo(test, maskPattern);

      if (_typeNumber >= 7) {
        setupTypeNumber(test);
      }

      if (_dataCache == null) {
        _dataCache = createData(_typeNumber, _errorCorrectionLevel, _dataList);
      }

      mapData(_dataCache, maskPattern);
    };

    var setupPositionProbePattern = function(row, col) {

      for (var r = -1; r <= 7; r += 1) {

        if (row + r <= -1 || _moduleCount <= row + r) continue;

        for (var c = -1; c <= 7; c += 1) {

          if (col + c <= -1 || _moduleCount <= col + c) continue;

          if ( (0 <= r && r <= 6 && (c == 0 || c == 6) )
              || (0 <= c && c <= 6 && (r == 0 || r == 6) )
              || (2 <= r && r <= 4 && 2 <= c && c <= 4) ) {
            _modules[row + r][col + c] = true;
          } else {
            _modules[row + r][col + c] = false;
          }
        }
      }
    };

    var getBestMaskPattern = function() {

      var minLostPoint = 0;
      var pattern = 0;

      for (var i = 0; i < 8; i += 1) {

        makeImpl(true, i);

        var lostPoint = QRUtil.getLostPoint(_this);

        if (i == 0 || minLostPoint > lostPoint) {
          minLostPoint = lostPoint;
          pattern = i;
        }
      }

      return pattern;
    };

    var setupTimingPattern = function() {

      for (var r = 8; r < _moduleCount - 8; r += 1) {
        if (_modules[r][6] != null) {
          continue;
        }
        _modules[r][6] = (r % 2 == 0);
      }

      for (var c = 8; c < _moduleCount - 8; c += 1) {
        if (_modules[6][c] != null) {
          continue;
        }
        _modules[6][c] = (c % 2 == 0);
      }
    };

    var setupPositionAdjustPattern = function() {

      var pos = QRUtil.getPatternPosition(_typeNumber);

      for (var i = 0; i < pos.length; i += 1) {

        for (var j = 0; j < pos.length; j += 1) {

          var row = pos[i];
          var col = pos[j];

          if (_modules[row][col] != null) {
            continue;
          }

          for (var r = -2; r <= 2; r += 1) {

            for (var c = -2; c <= 2; c += 1) {

              if (r == -2 || r == 2 || c == -2 || c == 2
                  || (r == 0 && c == 0) ) {
                _modules[row + r][col + c] = true;
              } else {
                _modules[row + r][col + c] = false;
              }
            }
          }
        }
      }
    };

    var setupTypeNumber = function(test) {

      var bits = QRUtil.getBCHTypeNumber(_typeNumber);

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[Math.floor(i / 3)][i % 3 + _moduleCount - 8 - 3] = mod;
      }

      for (var i = 0; i < 18; i += 1) {
        var mod = (!test && ( (bits >> i) & 1) == 1);
        _modules[i % 3 + _moduleCount - 8 - 3][Math.floor(i / 3)] = mod;
      }
    };

    var setupTypeInfo = function(test, maskPattern) {

      var data = (_errorCorrectionLevel << 3) | maskPattern;
      var bits = QRUtil.getBCHTypeInfo(data);

      // vertical
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 6) {
          _modules[i][8] = mod;
        } else if (i < 8) {
          _modules[i + 1][8] = mod;
        } else {
          _modules[_moduleCount - 15 + i][8] = mod;
        }
      }

      // horizontal
      for (var i = 0; i < 15; i += 1) {

        var mod = (!test && ( (bits >> i) & 1) == 1);

        if (i < 8) {
          _modules[8][_moduleCount - i - 1] = mod;
        } else if (i < 9) {
          _modules[8][15 - i - 1 + 1] = mod;
        } else {
          _modules[8][15 - i - 1] = mod;
        }
      }

      // fixed module
      _modules[_moduleCount - 8][8] = (!test);
    };

    var mapData = function(data, maskPattern) {

      var inc = -1;
      var row = _moduleCount - 1;
      var bitIndex = 7;
      var byteIndex = 0;
      var maskFunc = QRUtil.getMaskFunction(maskPattern);

      for (var col = _moduleCount - 1; col > 0; col -= 2) {

        if (col == 6) col -= 1;

        while (true) {

          for (var c = 0; c < 2; c += 1) {

            if (_modules[row][col - c] == null) {

              var dark = false;

              if (byteIndex < data.length) {
                dark = ( ( (data[byteIndex] >>> bitIndex) & 1) == 1);
              }

              var mask = maskFunc(row, col - c);

              if (mask) {
                dark = !dark;
              }

              _modules[row][col - c] = dark;
              bitIndex -= 1;

              if (bitIndex == -1) {
                byteIndex += 1;
                bitIndex = 7;
              }
            }
          }

          row += inc;

          if (row < 0 || _moduleCount <= row) {
            row -= inc;
            inc = -inc;
            break;
          }
        }
      }
    };

    var createBytes = function(buffer, rsBlocks) {

      var offset = 0;

      var maxDcCount = 0;
      var maxEcCount = 0;

      var dcdata = new Array(rsBlocks.length);
      var ecdata = new Array(rsBlocks.length);

      for (var r = 0; r < rsBlocks.length; r += 1) {

        var dcCount = rsBlocks[r].dataCount;
        var ecCount = rsBlocks[r].totalCount - dcCount;

        maxDcCount = Math.max(maxDcCount, dcCount);
        maxEcCount = Math.max(maxEcCount, ecCount);

        dcdata[r] = new Array(dcCount);

        for (var i = 0; i < dcdata[r].length; i += 1) {
          dcdata[r][i] = 0xff & buffer.getBuffer()[i + offset];
        }
        offset += dcCount;

        var rsPoly = QRUtil.getErrorCorrectPolynomial(ecCount);
        var rawPoly = qrPolynomial(dcdata[r], rsPoly.getLength() - 1);

        var modPoly = rawPoly.mod(rsPoly);
        ecdata[r] = new Array(rsPoly.getLength() - 1);
        for (var i = 0; i < ecdata[r].length; i += 1) {
          var modIndex = i + modPoly.getLength() - ecdata[r].length;
          ecdata[r][i] = (modIndex >= 0)? modPoly.getAt(modIndex) : 0;
        }
      }

      var totalCodeCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalCodeCount += rsBlocks[i].totalCount;
      }

      var data = new Array(totalCodeCount);
      var index = 0;

      for (var i = 0; i < maxDcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < dcdata[r].length) {
            data[index] = dcdata[r][i];
            index += 1;
          }
        }
      }

      for (var i = 0; i < maxEcCount; i += 1) {
        for (var r = 0; r < rsBlocks.length; r += 1) {
          if (i < ecdata[r].length) {
            data[index] = ecdata[r][i];
            index += 1;
          }
        }
      }

      return data;
    };

    var createData = function(typeNumber, errorCorrectionLevel, dataList) {

      var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, errorCorrectionLevel);

      var buffer = qrBitBuffer();

      for (var i = 0; i < dataList.length; i += 1) {
        var data = dataList[i];
        buffer.put(data.getMode(), 4);
        buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
        data.write(buffer);
      }

      // calc num max data.
      var totalDataCount = 0;
      for (var i = 0; i < rsBlocks.length; i += 1) {
        totalDataCount += rsBlocks[i].dataCount;
      }

      if (buffer.getLengthInBits() > totalDataCount * 8) {
        throw 'code length overflow. ('
          + buffer.getLengthInBits()
          + '>'
          + totalDataCount * 8
          + ')';
      }

      // end code
      if (buffer.getLengthInBits() + 4 <= totalDataCount * 8) {
        buffer.put(0, 4);
      }

      // padding
      while (buffer.getLengthInBits() % 8 != 0) {
        buffer.putBit(false);
      }

      // padding
      while (true) {

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD0, 8);

        if (buffer.getLengthInBits() >= totalDataCount * 8) {
          break;
        }
        buffer.put(PAD1, 8);
      }

      return createBytes(buffer, rsBlocks);
    };

    _this.addData = function(data, mode) {

      mode = mode || 'Byte';

      var newData = null;

      switch(mode) {
      case 'Numeric' :
        newData = qrNumber(data);
        break;
      case 'Alphanumeric' :
        newData = qrAlphaNum(data);
        break;
      case 'Byte' :
        newData = qr8BitByte(data);
        break;
      case 'Kanji' :
        newData = qrKanji(data);
        break;
      default :
        throw 'mode:' + mode;
      }

      _dataList.push(newData);
      _dataCache = null;
    };

    _this.isDark = function(row, col) {
      if (row < 0 || _moduleCount <= row || col < 0 || _moduleCount <= col) {
        throw row + ',' + col;
      }
      return _modules[row][col];
    };

    _this.getModuleCount = function() {
      return _moduleCount;
    };

    _this.make = function() {
      if (_typeNumber < 1) {
        var typeNumber = 1;

        for (; typeNumber < 40; typeNumber++) {
          var rsBlocks = QRRSBlock.getRSBlocks(typeNumber, _errorCorrectionLevel);
          var buffer = qrBitBuffer();

          for (var i = 0; i < _dataList.length; i++) {
            var data = _dataList[i];
            buffer.put(data.getMode(), 4);
            buffer.put(data.getLength(), QRUtil.getLengthInBits(data.getMode(), typeNumber) );
            data.write(buffer);
          }

          var totalDataCount = 0;
          for (var i = 0; i < rsBlocks.length; i++) {
            totalDataCount += rsBlocks[i].dataCount;
          }

          if (buffer.getLengthInBits() <= totalDataCount * 8) {
            break;
          }
        }

        _typeNumber = typeNumber;
      }

      makeImpl(false, getBestMaskPattern() );
    };

    _this.createTableTag = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var qrHtml = '';

      qrHtml += '<table style="';
      qrHtml += ' border-width: 0px; border-style: none;';
      qrHtml += ' border-collapse: collapse;';
      qrHtml += ' padding: 0px; margin: ' + margin + 'px;';
      qrHtml += '">';
      qrHtml += '<tbody>';

      for (var r = 0; r < _this.getModuleCount(); r += 1) {

        qrHtml += '<tr>';

        for (var c = 0; c < _this.getModuleCount(); c += 1) {
          qrHtml += '<td style="';
          qrHtml += ' border-width: 0px; border-style: none;';
          qrHtml += ' border-collapse: collapse;';
          qrHtml += ' padding: 0px; margin: 0px;';
          qrHtml += ' width: ' + cellSize + 'px;';
          qrHtml += ' height: ' + cellSize + 'px;';
          qrHtml += ' background-color: ';
          qrHtml += _this.isDark(r, c)? '#000000' : '#ffffff';
          qrHtml += ';';
          qrHtml += '"/>';
        }

        qrHtml += '</tr>';
      }

      qrHtml += '</tbody>';
      qrHtml += '</table>';

      return qrHtml;
    };

    _this.createSvgTag = function(cellSize, margin, alt, title) {

      var opts = {};
      if (typeof arguments[0] == 'object') {
        // Called by options.
        opts = arguments[0];
        // overwrite cellSize and margin.
        cellSize = opts.cellSize;
        margin = opts.margin;
        alt = opts.alt;
        title = opts.title;
      }

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      // Compose alt property surrogate
      alt = (typeof alt === 'string') ? {text: alt} : alt || {};
      alt.text = alt.text || null;
      alt.id = (alt.text) ? alt.id || 'qrcode-description' : null;

      // Compose title property surrogate
      title = (typeof title === 'string') ? {text: title} : title || {};
      title.text = title.text || null;
      title.id = (title.text) ? title.id || 'qrcode-title' : null;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var c, mc, r, mr, qrSvg='', rect;

      rect = 'l' + cellSize + ',0 0,' + cellSize +
        ' -' + cellSize + ',0 0,-' + cellSize + 'z ';

      qrSvg += '<svg version="1.1" xmlns="http://www.w3.org/2000/svg"';
      qrSvg += !opts.scalable ? ' width="' + size + 'px" height="' + size + 'px"' : '';
      qrSvg += ' viewBox="0 0 ' + size + ' ' + size + '" ';
      qrSvg += ' preserveAspectRatio="xMinYMin meet"';
      qrSvg += (title.text || alt.text) ? ' role="img" aria-labelledby="' +
          escapeXml([title.id, alt.id].join(' ').trim() ) + '"' : '';
      qrSvg += '>';
      qrSvg += (title.text) ? '<title id="' + escapeXml(title.id) + '">' +
          escapeXml(title.text) + '</title>' : '';
      qrSvg += (alt.text) ? '<description id="' + escapeXml(alt.id) + '">' +
          escapeXml(alt.text) + '</description>' : '';
      qrSvg += '<rect width="100%" height="100%" fill="white" cx="0" cy="0"/>';
      qrSvg += '<path d="';

      for (r = 0; r < _this.getModuleCount(); r += 1) {
        mr = r * cellSize + margin;
        for (c = 0; c < _this.getModuleCount(); c += 1) {
          if (_this.isDark(r, c) ) {
            mc = c*cellSize+margin;
            qrSvg += 'M' + mc + ',' + mr + rect;
          }
        }
      }

      qrSvg += '" stroke="transparent" fill="black"/>';
      qrSvg += '</svg>';

      return qrSvg;
    };

    _this.createDataURL = function(cellSize, margin) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      return createDataURL(size, size, function(x, y) {
        if (min <= x && x < max && min <= y && y < max) {
          var c = Math.floor( (x - min) / cellSize);
          var r = Math.floor( (y - min) / cellSize);
          return _this.isDark(r, c)? 0 : 1;
        } else {
          return 1;
        }
      } );
    };

    _this.createImgTag = function(cellSize, margin, alt) {

      cellSize = cellSize || 2;
      margin = (typeof margin == 'undefined')? cellSize * 4 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;

      var img = '';
      img += '<img';
      img += '\u0020src="';
      img += _this.createDataURL(cellSize, margin);
      img += '"';
      img += '\u0020width="';
      img += size;
      img += '"';
      img += '\u0020height="';
      img += size;
      img += '"';
      if (alt) {
        img += '\u0020alt="';
        img += escapeXml(alt);
        img += '"';
      }
      img += '/>';

      return img;
    };

    var escapeXml = function(s) {
      var escaped = '';
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charAt(i);
        switch(c) {
        case '<': escaped += '&lt;'; break;
        case '>': escaped += '&gt;'; break;
        case '&': escaped += '&amp;'; break;
        case '"': escaped += '&quot;'; break;
        default : escaped += c; break;
        }
      }
      return escaped;
    };

    var _createHalfASCII = function(margin) {
      var cellSize = 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r1, r2, p;

      var blocks = {
        '██': '█',
        '█ ': '▀',
        ' █': '▄',
        '  ': ' '
      };

      var blocksLastLineNoMargin = {
        '██': '▀',
        '█ ': '▀',
        ' █': ' ',
        '  ': ' '
      };

      var ascii = '';
      for (y = 0; y < size; y += 2) {
        r1 = Math.floor((y - min) / cellSize);
        r2 = Math.floor((y + 1 - min) / cellSize);
        for (x = 0; x < size; x += 1) {
          p = '█';

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r1, Math.floor((x - min) / cellSize))) {
            p = ' ';
          }

          if (min <= x && x < max && min <= y+1 && y+1 < max && _this.isDark(r2, Math.floor((x - min) / cellSize))) {
            p += ' ';
          }
          else {
            p += '█';
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          ascii += (margin < 1 && y+1 >= max) ? blocksLastLineNoMargin[p] : blocks[p];
        }

        ascii += '\n';
      }

      if (size % 2 && margin > 0) {
        return ascii.substring(0, ascii.length - size - 1) + Array(size+1).join('▀');
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.createASCII = function(cellSize, margin) {
      cellSize = cellSize || 1;

      if (cellSize < 2) {
        return _createHalfASCII(margin);
      }

      cellSize -= 1;
      margin = (typeof margin == 'undefined')? cellSize * 2 : margin;

      var size = _this.getModuleCount() * cellSize + margin * 2;
      var min = margin;
      var max = size - margin;

      var y, x, r, p;

      var white = Array(cellSize+1).join('██');
      var black = Array(cellSize+1).join('  ');

      var ascii = '';
      var line = '';
      for (y = 0; y < size; y += 1) {
        r = Math.floor( (y - min) / cellSize);
        line = '';
        for (x = 0; x < size; x += 1) {
          p = 1;

          if (min <= x && x < max && min <= y && y < max && _this.isDark(r, Math.floor((x - min) / cellSize))) {
            p = 0;
          }

          // Output 2 characters per pixel, to create full square. 1 character per pixels gives only half width of square.
          line += p ? white : black;
        }

        for (r = 0; r < cellSize; r += 1) {
          ascii += line + '\n';
        }
      }

      return ascii.substring(0, ascii.length-1);
    };

    _this.renderTo2dContext = function(context, cellSize) {
      cellSize = cellSize || 2;
      var length = _this.getModuleCount();
      for (var row = 0; row < length; row++) {
        for (var col = 0; col < length; col++) {
          context.fillStyle = _this.isDark(row, col) ? 'black' : 'white';
          context.fillRect(row * cellSize, col * cellSize, cellSize, cellSize);
        }
      }
    }

    return _this;
  };

  //---------------------------------------------------------------------
  // qrcode.stringToBytes
  //---------------------------------------------------------------------

  qrcode.stringToBytesFuncs = {
    'default' : function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        bytes.push(c & 0xff);
      }
      return bytes;
    }
  };

  qrcode.stringToBytes = qrcode.stringToBytesFuncs['default'];

  //---------------------------------------------------------------------
  // qrcode.createStringToBytes
  //---------------------------------------------------------------------

  /**
   * @param unicodeData base64 string of byte array.
   * [16bit Unicode],[16bit Bytes], ...
   * @param numChars
   */
  qrcode.createStringToBytes = function(unicodeData, numChars) {

    // create conversion map.

    var unicodeMap = function() {

      var bin = base64DecodeInputStream(unicodeData);
      var read = function() {
        var b = bin.read();
        if (b == -1) throw 'eof';
        return b;
      };

      var count = 0;
      var unicodeMap = {};
      while (true) {
        var b0 = bin.read();
        if (b0 == -1) break;
        var b1 = read();
        var b2 = read();
        var b3 = read();
        var k = String.fromCharCode( (b0 << 8) | b1);
        var v = (b2 << 8) | b3;
        unicodeMap[k] = v;
        count += 1;
      }
      if (count != numChars) {
        throw count + ' != ' + numChars;
      }

      return unicodeMap;
    }();

    var unknownChar = '?'.charCodeAt(0);

    return function(s) {
      var bytes = [];
      for (var i = 0; i < s.length; i += 1) {
        var c = s.charCodeAt(i);
        if (c < 128) {
          bytes.push(c);
        } else {
          var b = unicodeMap[s.charAt(i)];
          if (typeof b == 'number') {
            if ( (b & 0xff) == b) {
              // 1byte
              bytes.push(b);
            } else {
              // 2bytes
              bytes.push(b >>> 8);
              bytes.push(b & 0xff);
            }
          } else {
            bytes.push(unknownChar);
          }
        }
      }
      return bytes;
    };
  };

  //---------------------------------------------------------------------
  // QRMode
  //---------------------------------------------------------------------

  var QRMode = {
    MODE_NUMBER :    1 << 0,
    MODE_ALPHA_NUM : 1 << 1,
    MODE_8BIT_BYTE : 1 << 2,
    MODE_KANJI :     1 << 3
  };

  //---------------------------------------------------------------------
  // QRErrorCorrectionLevel
  //---------------------------------------------------------------------

  var QRErrorCorrectionLevel = {
    L : 1,
    M : 0,
    Q : 3,
    H : 2
  };

  //---------------------------------------------------------------------
  // QRMaskPattern
  //---------------------------------------------------------------------

  var QRMaskPattern = {
    PATTERN000 : 0,
    PATTERN001 : 1,
    PATTERN010 : 2,
    PATTERN011 : 3,
    PATTERN100 : 4,
    PATTERN101 : 5,
    PATTERN110 : 6,
    PATTERN111 : 7
  };

  //---------------------------------------------------------------------
  // QRUtil
  //---------------------------------------------------------------------

  var QRUtil = function() {

    var PATTERN_POSITION_TABLE = [
      [],
      [6, 18],
      [6, 22],
      [6, 26],
      [6, 30],
      [6, 34],
      [6, 22, 38],
      [6, 24, 42],
      [6, 26, 46],
      [6, 28, 50],
      [6, 30, 54],
      [6, 32, 58],
      [6, 34, 62],
      [6, 26, 46, 66],
      [6, 26, 48, 70],
      [6, 26, 50, 74],
      [6, 30, 54, 78],
      [6, 30, 56, 82],
      [6, 30, 58, 86],
      [6, 34, 62, 90],
      [6, 28, 50, 72, 94],
      [6, 26, 50, 74, 98],
      [6, 30, 54, 78, 102],
      [6, 28, 54, 80, 106],
      [6, 32, 58, 84, 110],
      [6, 30, 58, 86, 114],
      [6, 34, 62, 90, 118],
      [6, 26, 50, 74, 98, 122],
      [6, 30, 54, 78, 102, 126],
      [6, 26, 52, 78, 104, 130],
      [6, 30, 56, 82, 108, 134],
      [6, 34, 60, 86, 112, 138],
      [6, 30, 58, 86, 114, 142],
      [6, 34, 62, 90, 118, 146],
      [6, 30, 54, 78, 102, 126, 150],
      [6, 24, 50, 76, 102, 128, 154],
      [6, 28, 54, 80, 106, 132, 158],
      [6, 32, 58, 84, 110, 136, 162],
      [6, 26, 54, 82, 110, 138, 166],
      [6, 30, 58, 86, 114, 142, 170]
    ];
    var G15 = (1 << 10) | (1 << 8) | (1 << 5) | (1 << 4) | (1 << 2) | (1 << 1) | (1 << 0);
    var G18 = (1 << 12) | (1 << 11) | (1 << 10) | (1 << 9) | (1 << 8) | (1 << 5) | (1 << 2) | (1 << 0);
    var G15_MASK = (1 << 14) | (1 << 12) | (1 << 10) | (1 << 4) | (1 << 1);

    var _this = {};

    var getBCHDigit = function(data) {
      var digit = 0;
      while (data != 0) {
        digit += 1;
        data >>>= 1;
      }
      return digit;
    };

    _this.getBCHTypeInfo = function(data) {
      var d = data << 10;
      while (getBCHDigit(d) - getBCHDigit(G15) >= 0) {
        d ^= (G15 << (getBCHDigit(d) - getBCHDigit(G15) ) );
      }
      return ( (data << 10) | d) ^ G15_MASK;
    };

    _this.getBCHTypeNumber = function(data) {
      var d = data << 12;
      while (getBCHDigit(d) - getBCHDigit(G18) >= 0) {
        d ^= (G18 << (getBCHDigit(d) - getBCHDigit(G18) ) );
      }
      return (data << 12) | d;
    };

    _this.getPatternPosition = function(typeNumber) {
      return PATTERN_POSITION_TABLE[typeNumber - 1];
    };

    _this.getMaskFunction = function(maskPattern) {

      switch (maskPattern) {

      case QRMaskPattern.PATTERN000 :
        return function(i, j) { return (i + j) % 2 == 0; };
      case QRMaskPattern.PATTERN001 :
        return function(i, j) { return i % 2 == 0; };
      case QRMaskPattern.PATTERN010 :
        return function(i, j) { return j % 3 == 0; };
      case QRMaskPattern.PATTERN011 :
        return function(i, j) { return (i + j) % 3 == 0; };
      case QRMaskPattern.PATTERN100 :
        return function(i, j) { return (Math.floor(i / 2) + Math.floor(j / 3) ) % 2 == 0; };
      case QRMaskPattern.PATTERN101 :
        return function(i, j) { return (i * j) % 2 + (i * j) % 3 == 0; };
      case QRMaskPattern.PATTERN110 :
        return function(i, j) { return ( (i * j) % 2 + (i * j) % 3) % 2 == 0; };
      case QRMaskPattern.PATTERN111 :
        return function(i, j) { return ( (i * j) % 3 + (i + j) % 2) % 2 == 0; };

      default :
        throw 'bad maskPattern:' + maskPattern;
      }
    };

    _this.getErrorCorrectPolynomial = function(errorCorrectLength) {
      var a = qrPolynomial([1], 0);
      for (var i = 0; i < errorCorrectLength; i += 1) {
        a = a.multiply(qrPolynomial([1, QRMath.gexp(i)], 0) );
      }
      return a;
    };

    _this.getLengthInBits = function(mode, type) {

      if (1 <= type && type < 10) {

        // 1 - 9

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 10;
        case QRMode.MODE_ALPHA_NUM : return 9;
        case QRMode.MODE_8BIT_BYTE : return 8;
        case QRMode.MODE_KANJI     : return 8;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 27) {

        // 10 - 26

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 12;
        case QRMode.MODE_ALPHA_NUM : return 11;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 10;
        default :
          throw 'mode:' + mode;
        }

      } else if (type < 41) {

        // 27 - 40

        switch(mode) {
        case QRMode.MODE_NUMBER    : return 14;
        case QRMode.MODE_ALPHA_NUM : return 13;
        case QRMode.MODE_8BIT_BYTE : return 16;
        case QRMode.MODE_KANJI     : return 12;
        default :
          throw 'mode:' + mode;
        }

      } else {
        throw 'type:' + type;
      }
    };

    _this.getLostPoint = function(qrcode) {

      var moduleCount = qrcode.getModuleCount();

      var lostPoint = 0;

      // LEVEL1

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount; col += 1) {

          var sameCount = 0;
          var dark = qrcode.isDark(row, col);

          for (var r = -1; r <= 1; r += 1) {

            if (row + r < 0 || moduleCount <= row + r) {
              continue;
            }

            for (var c = -1; c <= 1; c += 1) {

              if (col + c < 0 || moduleCount <= col + c) {
                continue;
              }

              if (r == 0 && c == 0) {
                continue;
              }

              if (dark == qrcode.isDark(row + r, col + c) ) {
                sameCount += 1;
              }
            }
          }

          if (sameCount > 5) {
            lostPoint += (3 + sameCount - 5);
          }
        }
      };

      // LEVEL2

      for (var row = 0; row < moduleCount - 1; row += 1) {
        for (var col = 0; col < moduleCount - 1; col += 1) {
          var count = 0;
          if (qrcode.isDark(row, col) ) count += 1;
          if (qrcode.isDark(row + 1, col) ) count += 1;
          if (qrcode.isDark(row, col + 1) ) count += 1;
          if (qrcode.isDark(row + 1, col + 1) ) count += 1;
          if (count == 0 || count == 4) {
            lostPoint += 3;
          }
        }
      }

      // LEVEL3

      for (var row = 0; row < moduleCount; row += 1) {
        for (var col = 0; col < moduleCount - 6; col += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row, col + 1)
              &&  qrcode.isDark(row, col + 2)
              &&  qrcode.isDark(row, col + 3)
              &&  qrcode.isDark(row, col + 4)
              && !qrcode.isDark(row, col + 5)
              &&  qrcode.isDark(row, col + 6) ) {
            lostPoint += 40;
          }
        }
      }

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount - 6; row += 1) {
          if (qrcode.isDark(row, col)
              && !qrcode.isDark(row + 1, col)
              &&  qrcode.isDark(row + 2, col)
              &&  qrcode.isDark(row + 3, col)
              &&  qrcode.isDark(row + 4, col)
              && !qrcode.isDark(row + 5, col)
              &&  qrcode.isDark(row + 6, col) ) {
            lostPoint += 40;
          }
        }
      }

      // LEVEL4

      var darkCount = 0;

      for (var col = 0; col < moduleCount; col += 1) {
        for (var row = 0; row < moduleCount; row += 1) {
          if (qrcode.isDark(row, col) ) {
            darkCount += 1;
          }
        }
      }

      var ratio = Math.abs(100 * darkCount / moduleCount / moduleCount - 50) / 5;
      lostPoint += ratio * 10;

      return lostPoint;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // QRMath
  //---------------------------------------------------------------------

  var QRMath = function() {

    var EXP_TABLE = new Array(256);
    var LOG_TABLE = new Array(256);

    // initialize tables
    for (var i = 0; i < 8; i += 1) {
      EXP_TABLE[i] = 1 << i;
    }
    for (var i = 8; i < 256; i += 1) {
      EXP_TABLE[i] = EXP_TABLE[i - 4]
        ^ EXP_TABLE[i - 5]
        ^ EXP_TABLE[i - 6]
        ^ EXP_TABLE[i - 8];
    }
    for (var i = 0; i < 255; i += 1) {
      LOG_TABLE[EXP_TABLE[i] ] = i;
    }

    var _this = {};

    _this.glog = function(n) {

      if (n < 1) {
        throw 'glog(' + n + ')';
      }

      return LOG_TABLE[n];
    };

    _this.gexp = function(n) {

      while (n < 0) {
        n += 255;
      }

      while (n >= 256) {
        n -= 255;
      }

      return EXP_TABLE[n];
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrPolynomial
  //---------------------------------------------------------------------

  function qrPolynomial(num, shift) {

    if (typeof num.length == 'undefined') {
      throw num.length + '/' + shift;
    }

    var _num = function() {
      var offset = 0;
      while (offset < num.length && num[offset] == 0) {
        offset += 1;
      }
      var _num = new Array(num.length - offset + shift);
      for (var i = 0; i < num.length - offset; i += 1) {
        _num[i] = num[i + offset];
      }
      return _num;
    }();

    var _this = {};

    _this.getAt = function(index) {
      return _num[index];
    };

    _this.getLength = function() {
      return _num.length;
    };

    _this.multiply = function(e) {

      var num = new Array(_this.getLength() + e.getLength() - 1);

      for (var i = 0; i < _this.getLength(); i += 1) {
        for (var j = 0; j < e.getLength(); j += 1) {
          num[i + j] ^= QRMath.gexp(QRMath.glog(_this.getAt(i) ) + QRMath.glog(e.getAt(j) ) );
        }
      }

      return qrPolynomial(num, 0);
    };

    _this.mod = function(e) {

      if (_this.getLength() - e.getLength() < 0) {
        return _this;
      }

      var ratio = QRMath.glog(_this.getAt(0) ) - QRMath.glog(e.getAt(0) );

      var num = new Array(_this.getLength() );
      for (var i = 0; i < _this.getLength(); i += 1) {
        num[i] = _this.getAt(i);
      }

      for (var i = 0; i < e.getLength(); i += 1) {
        num[i] ^= QRMath.gexp(QRMath.glog(e.getAt(i) ) + ratio);
      }

      // recursive call
      return qrPolynomial(num, 0).mod(e);
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // QRRSBlock
  //---------------------------------------------------------------------

  var QRRSBlock = function() {

    var RS_BLOCK_TABLE = [

      // L
      // M
      // Q
      // H

      // 1
      [1, 26, 19],
      [1, 26, 16],
      [1, 26, 13],
      [1, 26, 9],

      // 2
      [1, 44, 34],
      [1, 44, 28],
      [1, 44, 22],
      [1, 44, 16],

      // 3
      [1, 70, 55],
      [1, 70, 44],
      [2, 35, 17],
      [2, 35, 13],

      // 4
      [1, 100, 80],
      [2, 50, 32],
      [2, 50, 24],
      [4, 25, 9],

      // 5
      [1, 134, 108],
      [2, 67, 43],
      [2, 33, 15, 2, 34, 16],
      [2, 33, 11, 2, 34, 12],

      // 6
      [2, 86, 68],
      [4, 43, 27],
      [4, 43, 19],
      [4, 43, 15],

      // 7
      [2, 98, 78],
      [4, 49, 31],
      [2, 32, 14, 4, 33, 15],
      [4, 39, 13, 1, 40, 14],

      // 8
      [2, 121, 97],
      [2, 60, 38, 2, 61, 39],
      [4, 40, 18, 2, 41, 19],
      [4, 40, 14, 2, 41, 15],

      // 9
      [2, 146, 116],
      [3, 58, 36, 2, 59, 37],
      [4, 36, 16, 4, 37, 17],
      [4, 36, 12, 4, 37, 13],

      // 10
      [2, 86, 68, 2, 87, 69],
      [4, 69, 43, 1, 70, 44],
      [6, 43, 19, 2, 44, 20],
      [6, 43, 15, 2, 44, 16],

      // 11
      [4, 101, 81],
      [1, 80, 50, 4, 81, 51],
      [4, 50, 22, 4, 51, 23],
      [3, 36, 12, 8, 37, 13],

      // 12
      [2, 116, 92, 2, 117, 93],
      [6, 58, 36, 2, 59, 37],
      [4, 46, 20, 6, 47, 21],
      [7, 42, 14, 4, 43, 15],

      // 13
      [4, 133, 107],
      [8, 59, 37, 1, 60, 38],
      [8, 44, 20, 4, 45, 21],
      [12, 33, 11, 4, 34, 12],

      // 14
      [3, 145, 115, 1, 146, 116],
      [4, 64, 40, 5, 65, 41],
      [11, 36, 16, 5, 37, 17],
      [11, 36, 12, 5, 37, 13],

      // 15
      [5, 109, 87, 1, 110, 88],
      [5, 65, 41, 5, 66, 42],
      [5, 54, 24, 7, 55, 25],
      [11, 36, 12, 7, 37, 13],

      // 16
      [5, 122, 98, 1, 123, 99],
      [7, 73, 45, 3, 74, 46],
      [15, 43, 19, 2, 44, 20],
      [3, 45, 15, 13, 46, 16],

      // 17
      [1, 135, 107, 5, 136, 108],
      [10, 74, 46, 1, 75, 47],
      [1, 50, 22, 15, 51, 23],
      [2, 42, 14, 17, 43, 15],

      // 18
      [5, 150, 120, 1, 151, 121],
      [9, 69, 43, 4, 70, 44],
      [17, 50, 22, 1, 51, 23],
      [2, 42, 14, 19, 43, 15],

      // 19
      [3, 141, 113, 4, 142, 114],
      [3, 70, 44, 11, 71, 45],
      [17, 47, 21, 4, 48, 22],
      [9, 39, 13, 16, 40, 14],

      // 20
      [3, 135, 107, 5, 136, 108],
      [3, 67, 41, 13, 68, 42],
      [15, 54, 24, 5, 55, 25],
      [15, 43, 15, 10, 44, 16],

      // 21
      [4, 144, 116, 4, 145, 117],
      [17, 68, 42],
      [17, 50, 22, 6, 51, 23],
      [19, 46, 16, 6, 47, 17],

      // 22
      [2, 139, 111, 7, 140, 112],
      [17, 74, 46],
      [7, 54, 24, 16, 55, 25],
      [34, 37, 13],

      // 23
      [4, 151, 121, 5, 152, 122],
      [4, 75, 47, 14, 76, 48],
      [11, 54, 24, 14, 55, 25],
      [16, 45, 15, 14, 46, 16],

      // 24
      [6, 147, 117, 4, 148, 118],
      [6, 73, 45, 14, 74, 46],
      [11, 54, 24, 16, 55, 25],
      [30, 46, 16, 2, 47, 17],

      // 25
      [8, 132, 106, 4, 133, 107],
      [8, 75, 47, 13, 76, 48],
      [7, 54, 24, 22, 55, 25],
      [22, 45, 15, 13, 46, 16],

      // 26
      [10, 142, 114, 2, 143, 115],
      [19, 74, 46, 4, 75, 47],
      [28, 50, 22, 6, 51, 23],
      [33, 46, 16, 4, 47, 17],

      // 27
      [8, 152, 122, 4, 153, 123],
      [22, 73, 45, 3, 74, 46],
      [8, 53, 23, 26, 54, 24],
      [12, 45, 15, 28, 46, 16],

      // 28
      [3, 147, 117, 10, 148, 118],
      [3, 73, 45, 23, 74, 46],
      [4, 54, 24, 31, 55, 25],
      [11, 45, 15, 31, 46, 16],

      // 29
      [7, 146, 116, 7, 147, 117],
      [21, 73, 45, 7, 74, 46],
      [1, 53, 23, 37, 54, 24],
      [19, 45, 15, 26, 46, 16],

      // 30
      [5, 145, 115, 10, 146, 116],
      [19, 75, 47, 10, 76, 48],
      [15, 54, 24, 25, 55, 25],
      [23, 45, 15, 25, 46, 16],

      // 31
      [13, 145, 115, 3, 146, 116],
      [2, 74, 46, 29, 75, 47],
      [42, 54, 24, 1, 55, 25],
      [23, 45, 15, 28, 46, 16],

      // 32
      [17, 145, 115],
      [10, 74, 46, 23, 75, 47],
      [10, 54, 24, 35, 55, 25],
      [19, 45, 15, 35, 46, 16],

      // 33
      [17, 145, 115, 1, 146, 116],
      [14, 74, 46, 21, 75, 47],
      [29, 54, 24, 19, 55, 25],
      [11, 45, 15, 46, 46, 16],

      // 34
      [13, 145, 115, 6, 146, 116],
      [14, 74, 46, 23, 75, 47],
      [44, 54, 24, 7, 55, 25],
      [59, 46, 16, 1, 47, 17],

      // 35
      [12, 151, 121, 7, 152, 122],
      [12, 75, 47, 26, 76, 48],
      [39, 54, 24, 14, 55, 25],
      [22, 45, 15, 41, 46, 16],

      // 36
      [6, 151, 121, 14, 152, 122],
      [6, 75, 47, 34, 76, 48],
      [46, 54, 24, 10, 55, 25],
      [2, 45, 15, 64, 46, 16],

      // 37
      [17, 152, 122, 4, 153, 123],
      [29, 74, 46, 14, 75, 47],
      [49, 54, 24, 10, 55, 25],
      [24, 45, 15, 46, 46, 16],

      // 38
      [4, 152, 122, 18, 153, 123],
      [13, 74, 46, 32, 75, 47],
      [48, 54, 24, 14, 55, 25],
      [42, 45, 15, 32, 46, 16],

      // 39
      [20, 147, 117, 4, 148, 118],
      [40, 75, 47, 7, 76, 48],
      [43, 54, 24, 22, 55, 25],
      [10, 45, 15, 67, 46, 16],

      // 40
      [19, 148, 118, 6, 149, 119],
      [18, 75, 47, 31, 76, 48],
      [34, 54, 24, 34, 55, 25],
      [20, 45, 15, 61, 46, 16]
    ];

    var qrRSBlock = function(totalCount, dataCount) {
      var _this = {};
      _this.totalCount = totalCount;
      _this.dataCount = dataCount;
      return _this;
    };

    var _this = {};

    var getRsBlockTable = function(typeNumber, errorCorrectionLevel) {

      switch(errorCorrectionLevel) {
      case QRErrorCorrectionLevel.L :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 0];
      case QRErrorCorrectionLevel.M :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 1];
      case QRErrorCorrectionLevel.Q :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 2];
      case QRErrorCorrectionLevel.H :
        return RS_BLOCK_TABLE[(typeNumber - 1) * 4 + 3];
      default :
        return undefined;
      }
    };

    _this.getRSBlocks = function(typeNumber, errorCorrectionLevel) {

      var rsBlock = getRsBlockTable(typeNumber, errorCorrectionLevel);

      if (typeof rsBlock == 'undefined') {
        throw 'bad rs block @ typeNumber:' + typeNumber +
            '/errorCorrectionLevel:' + errorCorrectionLevel;
      }

      var length = rsBlock.length / 3;

      var list = [];

      for (var i = 0; i < length; i += 1) {

        var count = rsBlock[i * 3 + 0];
        var totalCount = rsBlock[i * 3 + 1];
        var dataCount = rsBlock[i * 3 + 2];

        for (var j = 0; j < count; j += 1) {
          list.push(qrRSBlock(totalCount, dataCount) );
        }
      }

      return list;
    };

    return _this;
  }();

  //---------------------------------------------------------------------
  // qrBitBuffer
  //---------------------------------------------------------------------

  var qrBitBuffer = function() {

    var _buffer = [];
    var _length = 0;

    var _this = {};

    _this.getBuffer = function() {
      return _buffer;
    };

    _this.getAt = function(index) {
      var bufIndex = Math.floor(index / 8);
      return ( (_buffer[bufIndex] >>> (7 - index % 8) ) & 1) == 1;
    };

    _this.put = function(num, length) {
      for (var i = 0; i < length; i += 1) {
        _this.putBit( ( (num >>> (length - i - 1) ) & 1) == 1);
      }
    };

    _this.getLengthInBits = function() {
      return _length;
    };

    _this.putBit = function(bit) {

      var bufIndex = Math.floor(_length / 8);
      if (_buffer.length <= bufIndex) {
        _buffer.push(0);
      }

      if (bit) {
        _buffer[bufIndex] |= (0x80 >>> (_length % 8) );
      }

      _length += 1;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrNumber
  //---------------------------------------------------------------------

  var qrNumber = function(data) {

    var _mode = QRMode.MODE_NUMBER;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var data = _data;

      var i = 0;

      while (i + 2 < data.length) {
        buffer.put(strToNum(data.substring(i, i + 3) ), 10);
        i += 3;
      }

      if (i < data.length) {
        if (data.length - i == 1) {
          buffer.put(strToNum(data.substring(i, i + 1) ), 4);
        } else if (data.length - i == 2) {
          buffer.put(strToNum(data.substring(i, i + 2) ), 7);
        }
      }
    };

    var strToNum = function(s) {
      var num = 0;
      for (var i = 0; i < s.length; i += 1) {
        num = num * 10 + chatToNum(s.charAt(i) );
      }
      return num;
    };

    var chatToNum = function(c) {
      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      }
      throw 'illegal char :' + c;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrAlphaNum
  //---------------------------------------------------------------------

  var qrAlphaNum = function(data) {

    var _mode = QRMode.MODE_ALPHA_NUM;
    var _data = data;

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _data.length;
    };

    _this.write = function(buffer) {

      var s = _data;

      var i = 0;

      while (i + 1 < s.length) {
        buffer.put(
          getCode(s.charAt(i) ) * 45 +
          getCode(s.charAt(i + 1) ), 11);
        i += 2;
      }

      if (i < s.length) {
        buffer.put(getCode(s.charAt(i) ), 6);
      }
    };

    var getCode = function(c) {

      if ('0' <= c && c <= '9') {
        return c.charCodeAt(0) - '0'.charCodeAt(0);
      } else if ('A' <= c && c <= 'Z') {
        return c.charCodeAt(0) - 'A'.charCodeAt(0) + 10;
      } else {
        switch (c) {
        case ' ' : return 36;
        case '$' : return 37;
        case '%' : return 38;
        case '*' : return 39;
        case '+' : return 40;
        case '-' : return 41;
        case '.' : return 42;
        case '/' : return 43;
        case ':' : return 44;
        default :
          throw 'illegal char :' + c;
        }
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qr8BitByte
  //---------------------------------------------------------------------

  var qr8BitByte = function(data) {

    var _mode = QRMode.MODE_8BIT_BYTE;
    var _data = data;
    var _bytes = qrcode.stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return _bytes.length;
    };

    _this.write = function(buffer) {
      for (var i = 0; i < _bytes.length; i += 1) {
        buffer.put(_bytes[i], 8);
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // qrKanji
  //---------------------------------------------------------------------

  var qrKanji = function(data) {

    var _mode = QRMode.MODE_KANJI;
    var _data = data;

    var stringToBytes = qrcode.stringToBytesFuncs['SJIS'];
    if (!stringToBytes) {
      throw 'sjis not supported.';
    }
    !function(c, code) {
      // self test for sjis support.
      var test = stringToBytes(c);
      if (test.length != 2 || ( (test[0] << 8) | test[1]) != code) {
        throw 'sjis not supported.';
      }
    }('\u53cb', 0x9746);

    var _bytes = stringToBytes(data);

    var _this = {};

    _this.getMode = function() {
      return _mode;
    };

    _this.getLength = function(buffer) {
      return ~~(_bytes.length / 2);
    };

    _this.write = function(buffer) {

      var data = _bytes;

      var i = 0;

      while (i + 1 < data.length) {

        var c = ( (0xff & data[i]) << 8) | (0xff & data[i + 1]);

        if (0x8140 <= c && c <= 0x9FFC) {
          c -= 0x8140;
        } else if (0xE040 <= c && c <= 0xEBBF) {
          c -= 0xC140;
        } else {
          throw 'illegal char at ' + (i + 1) + '/' + c;
        }

        c = ( (c >>> 8) & 0xff) * 0xC0 + (c & 0xff);

        buffer.put(c, 13);

        i += 2;
      }

      if (i < data.length) {
        throw 'illegal char at ' + (i + 1);
      }
    };

    return _this;
  };

  //=====================================================================
  // GIF Support etc.
  //

  //---------------------------------------------------------------------
  // byteArrayOutputStream
  //---------------------------------------------------------------------

  var byteArrayOutputStream = function() {

    var _bytes = [];

    var _this = {};

    _this.writeByte = function(b) {
      _bytes.push(b & 0xff);
    };

    _this.writeShort = function(i) {
      _this.writeByte(i);
      _this.writeByte(i >>> 8);
    };

    _this.writeBytes = function(b, off, len) {
      off = off || 0;
      len = len || b.length;
      for (var i = 0; i < len; i += 1) {
        _this.writeByte(b[i + off]);
      }
    };

    _this.writeString = function(s) {
      for (var i = 0; i < s.length; i += 1) {
        _this.writeByte(s.charCodeAt(i) );
      }
    };

    _this.toByteArray = function() {
      return _bytes;
    };

    _this.toString = function() {
      var s = '';
      s += '[';
      for (var i = 0; i < _bytes.length; i += 1) {
        if (i > 0) {
          s += ',';
        }
        s += _bytes[i];
      }
      s += ']';
      return s;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64EncodeOutputStream
  //---------------------------------------------------------------------

  var base64EncodeOutputStream = function() {

    var _buffer = 0;
    var _buflen = 0;
    var _length = 0;
    var _base64 = '';

    var _this = {};

    var writeEncoded = function(b) {
      _base64 += String.fromCharCode(encode(b & 0x3f) );
    };

    var encode = function(n) {
      if (n < 0) {
        // error.
      } else if (n < 26) {
        return 0x41 + n;
      } else if (n < 52) {
        return 0x61 + (n - 26);
      } else if (n < 62) {
        return 0x30 + (n - 52);
      } else if (n == 62) {
        return 0x2b;
      } else if (n == 63) {
        return 0x2f;
      }
      throw 'n:' + n;
    };

    _this.writeByte = function(n) {

      _buffer = (_buffer << 8) | (n & 0xff);
      _buflen += 8;
      _length += 1;

      while (_buflen >= 6) {
        writeEncoded(_buffer >>> (_buflen - 6) );
        _buflen -= 6;
      }
    };

    _this.flush = function() {

      if (_buflen > 0) {
        writeEncoded(_buffer << (6 - _buflen) );
        _buffer = 0;
        _buflen = 0;
      }

      if (_length % 3 != 0) {
        // padding
        var padlen = 3 - _length % 3;
        for (var i = 0; i < padlen; i += 1) {
          _base64 += '=';
        }
      }
    };

    _this.toString = function() {
      return _base64;
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // base64DecodeInputStream
  //---------------------------------------------------------------------

  var base64DecodeInputStream = function(str) {

    var _str = str;
    var _pos = 0;
    var _buffer = 0;
    var _buflen = 0;

    var _this = {};

    _this.read = function() {

      while (_buflen < 8) {

        if (_pos >= _str.length) {
          if (_buflen == 0) {
            return -1;
          }
          throw 'unexpected end of file./' + _buflen;
        }

        var c = _str.charAt(_pos);
        _pos += 1;

        if (c == '=') {
          _buflen = 0;
          return -1;
        } else if (c.match(/^\s$/) ) {
          // ignore if whitespace.
          continue;
        }

        _buffer = (_buffer << 6) | decode(c.charCodeAt(0) );
        _buflen += 6;
      }

      var n = (_buffer >>> (_buflen - 8) ) & 0xff;
      _buflen -= 8;
      return n;
    };

    var decode = function(c) {
      if (0x41 <= c && c <= 0x5a) {
        return c - 0x41;
      } else if (0x61 <= c && c <= 0x7a) {
        return c - 0x61 + 26;
      } else if (0x30 <= c && c <= 0x39) {
        return c - 0x30 + 52;
      } else if (c == 0x2b) {
        return 62;
      } else if (c == 0x2f) {
        return 63;
      } else {
        throw 'c:' + c;
      }
    };

    return _this;
  };

  //---------------------------------------------------------------------
  // gifImage (B/W)
  //---------------------------------------------------------------------

  var gifImage = function(width, height) {

    var _width = width;
    var _height = height;
    var _data = new Array(width * height);

    var _this = {};

    _this.setPixel = function(x, y, pixel) {
      _data[y * _width + x] = pixel;
    };

    _this.write = function(out) {

      //---------------------------------
      // GIF Signature

      out.writeString('GIF87a');

      //---------------------------------
      // Screen Descriptor

      out.writeShort(_width);
      out.writeShort(_height);

      out.writeByte(0x80); // 2bit
      out.writeByte(0);
      out.writeByte(0);

      //---------------------------------
      // Global Color Map

      // black
      out.writeByte(0x00);
      out.writeByte(0x00);
      out.writeByte(0x00);

      // white
      out.writeByte(0xff);
      out.writeByte(0xff);
      out.writeByte(0xff);

      //---------------------------------
      // Image Descriptor

      out.writeString(',');
      out.writeShort(0);
      out.writeShort(0);
      out.writeShort(_width);
      out.writeShort(_height);
      out.writeByte(0);

      //---------------------------------
      // Local Color Map

      //---------------------------------
      // Raster Data

      var lzwMinCodeSize = 2;
      var raster = getLZWRaster(lzwMinCodeSize);

      out.writeByte(lzwMinCodeSize);

      var offset = 0;

      while (raster.length - offset > 255) {
        out.writeByte(255);
        out.writeBytes(raster, offset, 255);
        offset += 255;
      }

      out.writeByte(raster.length - offset);
      out.writeBytes(raster, offset, raster.length - offset);
      out.writeByte(0x00);

      //---------------------------------
      // GIF Terminator
      out.writeString(';');
    };

    var bitOutputStream = function(out) {

      var _out = out;
      var _bitLength = 0;
      var _bitBuffer = 0;

      var _this = {};

      _this.write = function(data, length) {

        if ( (data >>> length) != 0) {
          throw 'length over';
        }

        while (_bitLength + length >= 8) {
          _out.writeByte(0xff & ( (data << _bitLength) | _bitBuffer) );
          length -= (8 - _bitLength);
          data >>>= (8 - _bitLength);
          _bitBuffer = 0;
          _bitLength = 0;
        }

        _bitBuffer = (data << _bitLength) | _bitBuffer;
        _bitLength = _bitLength + length;
      };

      _this.flush = function() {
        if (_bitLength > 0) {
          _out.writeByte(_bitBuffer);
        }
      };

      return _this;
    };

    var getLZWRaster = function(lzwMinCodeSize) {

      var clearCode = 1 << lzwMinCodeSize;
      var endCode = (1 << lzwMinCodeSize) + 1;
      var bitLength = lzwMinCodeSize + 1;

      // Setup LZWTable
      var table = lzwTable();

      for (var i = 0; i < clearCode; i += 1) {
        table.add(String.fromCharCode(i) );
      }
      table.add(String.fromCharCode(clearCode) );
      table.add(String.fromCharCode(endCode) );

      var byteOut = byteArrayOutputStream();
      var bitOut = bitOutputStream(byteOut);

      // clear code
      bitOut.write(clearCode, bitLength);

      var dataIndex = 0;

      var s = String.fromCharCode(_data[dataIndex]);
      dataIndex += 1;

      while (dataIndex < _data.length) {

        var c = String.fromCharCode(_data[dataIndex]);
        dataIndex += 1;

        if (table.contains(s + c) ) {

          s = s + c;

        } else {

          bitOut.write(table.indexOf(s), bitLength);

          if (table.size() < 0xfff) {

            if (table.size() == (1 << bitLength) ) {
              bitLength += 1;
            }

            table.add(s + c);
          }

          s = c;
        }
      }

      bitOut.write(table.indexOf(s), bitLength);

      // end code
      bitOut.write(endCode, bitLength);

      bitOut.flush();

      return byteOut.toByteArray();
    };

    var lzwTable = function() {

      var _map = {};
      var _size = 0;

      var _this = {};

      _this.add = function(key) {
        if (_this.contains(key) ) {
          throw 'dup key:' + key;
        }
        _map[key] = _size;
        _size += 1;
      };

      _this.size = function() {
        return _size;
      };

      _this.indexOf = function(key) {
        return _map[key];
      };

      _this.contains = function(key) {
        return typeof _map[key] != 'undefined';
      };

      return _this;
    };

    return _this;
  };

  var createDataURL = function(width, height, getPixel) {
    var gif = gifImage(width, height);
    for (var y = 0; y < height; y += 1) {
      for (var x = 0; x < width; x += 1) {
        gif.setPixel(x, y, getPixel(x, y) );
      }
    }

    var b = byteArrayOutputStream();
    gif.write(b);

    var base64 = base64EncodeOutputStream();
    var bytes = b.toByteArray();
    for (var i = 0; i < bytes.length; i += 1) {
      base64.writeByte(bytes[i]);
    }
    base64.flush();

    return 'data:image/gif;base64,' + base64;
  };

  //---------------------------------------------------------------------
  // returns qrcode function.

  return qrcode;
}();

// multibyte support
!function() {

  qrcode.stringToBytesFuncs['UTF-8'] = function(s) {
    // http://stackoverflow.com/questions/18729405/how-to-convert-utf8-string-to-byte-array
    function toUTF8Array(str) {
      var utf8 = [];
      for (var i=0; i < str.length; i++) {
        var charcode = str.charCodeAt(i);
        if (charcode < 0x80) utf8.push(charcode);
        else if (charcode < 0x800) {
          utf8.push(0xc0 | (charcode >> 6),
              0x80 | (charcode & 0x3f));
        }
        else if (charcode < 0xd800 || charcode >= 0xe000) {
          utf8.push(0xe0 | (charcode >> 12),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
        // surrogate pair
        else {
          i++;
          // UTF-16 encodes 0x10000-0x10FFFF by
          // subtracting 0x10000 and splitting the
          // 20 bits of 0x0-0xFFFFF into two halves
          charcode = 0x10000 + (((charcode & 0x3ff)<<10)
            | (str.charCodeAt(i) & 0x3ff));
          utf8.push(0xf0 | (charcode >>18),
              0x80 | ((charcode>>12) & 0x3f),
              0x80 | ((charcode>>6) & 0x3f),
              0x80 | (charcode & 0x3f));
        }
      }
      return utf8;
    }
    return toUTF8Array(s);
  };

}();

(function (factory) {
  if (typeof define === 'function' && define.amd) {
      define([], factory);
  } else if (typeof exports === 'object') {
      module.exports = factory();
  }
}(function () {
    return qrcode;
}));
