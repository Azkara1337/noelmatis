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
const NOTIFIER = 'saveyourshoot@gmail.com';   // adresses qui reçoivent chaque demande, séparées par une virgule.
const NOM_EVENT = 'Marché de Noël';
const DATES = 'vendredi 18 et samedi 19 décembre 2026';
const TELEPHONE = '05 34 03 24 40';
const STANDS_DEJA = {7: 'Crêpes', 11: 'Churros', 24: 'Aligot', 25: 'Brasero', 26: 'Vin chaud', 27: 'Raclette'};
// =====================

const ONGLETS = {
  stand: {nom: 'Stands', cols: [['date', 'Reçu le'], ['statut', 'Suivi'], ['nom', 'Nom'], ['activite', 'Activité'], ['tel', 'Téléphone'], ['email', 'E-mail'], ['stand', 'Stand souhaité'], ['categorie', 'Catégorie'], ['message', 'Message']]},
  repas: {nom: 'Repas', cols: [['date', 'Reçu le'], ['statut', 'Suivi'], ['nom', 'Nom'], ['email', 'E-mail'], ['tel', 'Téléphone'], ['profil', 'Profil'], ['repas', 'Nb repas'], ['total_ttc', 'Total TTC']]},
  partenaire: {nom: 'Partenaires', cols: [['date', 'Reçu le'], ['statut', 'Suivi'], ['entreprise', 'Entreprise'], ['nom', 'Contact'], ['tel', 'Téléphone'], ['email', 'E-mail'], ['salaries', 'Salariés'], ['offre', 'Offre'], ['message', 'Message']]}
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
  const vide = ss.getSheetByName('Feuille 1') || ss.getSheetByName('Sheet1');
  if (vide && vide.getLastRow() === 0 && ss.getSheets().length > 1) ss.deleteSheet(vide);
}

// Le site lit le plan (GET ...?action=plan) et le mur des partenaires (GET ...?action=partenaires)
function doGet(e) {
  const action = e && e.parameter && e.parameter.action;
  if (action === 'partenaires') return json({partenaires: partenaires()});
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
const MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function doPost(e) {
  const lock = LockService.getScriptLock();
  let d, o;
  try {
    lock.waitLock(10000);
    d = JSON.parse(e.postData.contents);
    o = ONGLETS[d && d.type];
    if (!o) return json({ok: false, erreur: 'type inconnu'});
    if (d.site_web) return json({ok: true});                       // champ anti-spam rempli : robot, on ignore
    if (REQUIS[d.type].some(function (k) { return !String(d[k] || '').trim(); })) return json({ok: false, erreur: 'champs manquants'});
    if (d.email && !MAIL_RE.test(String(d.email).trim())) return json({ok: false, erreur: 'e-mail invalide'});
    if (!quota()) return json({ok: false, erreur: 'trop de demandes'});
    d.date = Utilities.formatDate(new Date(), 'Europe/Paris', 'dd/MM/yyyy HH:mm');
    d.statut = 'À traiter';
    const ligne = o.cols.map(function (c) { return propre(d[c[0]]); });
    SpreadsheetApp.getActiveSpreadsheet().getSheetByName(o.nom).appendRow(ligne);
  } catch (err) {
    return json({ok: false, erreur: String(err)});
  } finally {
    lock.releaseLock();
  }
  // La ligne est enregistrée : un souci d'e-mail (quota Gmail…) ne doit pas faire échouer la demande.
  try { prevenir(d, o); } catch (err) { console.error('prevenir', err); }
  try { confirmer(d); } catch (err) { console.error('confirmer', err); }
  return json({ok: true});
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
  if (/^[=+\-@]/.test(s)) s = "'" + s;   // évite qu'une saisie soit lue comme une formule
  return s;
}

function prevenir(d, o) {
  const dest = NOTIFIER || Session.getEffectiveUser().getEmail();
  const titre = {stand: 'Nouvelle demande de stand', repas: 'Nouvelle réservation de repas', partenaire: 'Nouvelle demande partenaire'}[d.type];
  const corps = o.cols.map(function (c) { return c[1] + ' : ' + (d[c[0]] || '-'); }).join('\n');
  MailApp.sendEmail({to: dest, subject: NOM_EVENT + ' · ' + titre, body: corps + '\n\nTout est dans le Google Sheet : ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()});
}

function confirmer(d) {
  const mail = String(d.email || '').trim();
  if (!MAIL_RE.test(mail)) return;
  if (MailApp.getRemainingDailyQuota() < 20) return;               // on garde le quota pour prévenir l'organisation
  const cache = CacheService.getScriptCache(), cle = 'c_' + Utilities.base64EncodeWebSafe(mail.toLowerCase()).slice(0, 200);
  if (cache.get(cle)) return;                                      // une confirmation par adresse et par heure
  cache.put(cle, '1', 3600);
  const nom = String(d.nom || '').replace(/https?:\/\/\S+|www\.\S+/gi, '').replace(/[<>]/g, '').trim().slice(0, 60);
  const bonjour = 'Bonjour ' + nom + ',\n\n';
  const fin = '\n\nUne question ? Appelez le ' + TELEPHONE + '.\n\nÀ très vite,\nL\'équipe du ' + NOM_EVENT + '\n' + DATES;
  const txt = {
    stand: 'Nous avons bien reçu votre demande de stand' + (d.stand ? ' (stand ' + d.stand + ')' : '') + ' pour le ' + NOM_EVENT + '. Nous vous rappelons pour confirmer votre emplacement, puis nous vous envoyons la facture par e-mail. Votre stand est réservé seulement à réception du paiement.',
    repas: 'Nous avons bien reçu votre demande de ' + (d.repas || '') + ' repas (' + (d.total_ttc || '') + ' TTC) pour le ' + NOM_EVENT + '. Vous allez recevoir la facture par e-mail, à régler par virement : votre réservation est confirmée dès le paiement. Vos tickets vous sont ensuite envoyés par e-mail, ou vous les retirez à l\'accueil du marché.',
    partenaire: 'Nous avons bien reçu votre demande pour l\'offre « ' + (d.offre || '') + ' ». Nous vous rappelons sous 48 h.'
  }[d.type];
  MailApp.sendEmail({to: mail, subject: NOM_EVENT + ' · demande bien reçue', body: bonjour + txt + fin, name: NOM_EVENT});
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
