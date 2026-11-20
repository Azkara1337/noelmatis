// Test RÉEL du parcours repas avec Stripe en mode test : le vrai Code.gs, la vraie API Stripe, un faux Sheet en local.
//   1) node google-apps-script/tests/reel.js          → crée une réservation et ouvre la page de paiement Stripe
//      Payer avec la carte 4242 4242 4242 4242, date 12/34, code 123 (la page du site au retour peut ne rien afficher, c'est normal).
//   2) node google-apps-script/tests/reel.js verif    → vérifie le paiement, fabrique le ticket, l'ouvre et simule 2 scans à l'accueil.
// La clé est lue dans le fichier .env à la racine (ignoré par Git). Elle doit commencer par sk_test_.
const fs = require('fs'), path = require('path'), crypto = require('crypto'), { execFileSync } = require('child_process');
const racine = path.join(__dirname, '..', '..'), dossier = path.join(__dirname, '.reel');
fs.mkdirSync(dossier, { recursive: true });
const envFichier = path.join(racine, '.env');
const vars = fs.existsSync(envFichier) ? Object.fromEntries(fs.readFileSync(envFichier, 'utf8').split('\n').filter(l => /^\w+=/.test(l)).map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])) : {};
const cle = process.env.STRIPE_SECRET || vars.STRIPE_SECRET || '';
if (!/^sk_test_/.test(cle)) { console.error('Clé de test absente ou pas en mode test (sk_test_…) dans .env'); process.exit(1); }

const etatFichier = path.join(dossier, 'etat.json');
const etat = fs.existsSync(etatFichier) ? JSON.parse(fs.readFileSync(etatFichier, 'utf8')) : { lignes: [], props: {} };
const env = { lignes: etat.lignes, props: Object.assign({}, etat.props, { STRIPE_SECRET: cle, ACCUEIL_CODE: 'TEST' }), cache: {}, mails: [] };
const feuille = { getLastRow: () => env.lignes.length, getLastColumn: () => (env.lignes[0] || []).length, appendRow: r => env.lignes.push(r.slice()),
  getRange: (r, c, nr, nc) => ({ getValues: () => env.lignes.slice(r - 1, r - 1 + (nr || 1)).map(l => { const x = l.slice(c - 1, c - 1 + (nc || 1)); while (x.length < (nc || 1)) x.push(''); return x; }),
    getValue: () => (env.lignes[r - 1] || [])[c - 1], setValue: v => { env.lignes[r - 1][c - 1] = v; },
    setValues: v => { v[0].forEach((x, i) => { env.lignes[r - 1][c - 1 + i] = x; }); return { setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }) }; } }) };
const g = {
  PropertiesService: { getScriptProperties: () => ({ getProperty: k => env.props[k] || null, setProperty: (k, v) => { env.props[k] = v; } }) },
  UrlFetchApp: { fetch: (url, o = {}) => {
    if (!/^https:\/\/api\.stripe\.com\//.test(url)) return { getResponseCode: () => 404, getBlob: () => ({ getBytes: () => [] }) };
    const args = ['-s', '-w', '\n%{http_code}', '-X', (o.method || 'get').toUpperCase(), url];
    for (const [k, v] of Object.entries(o.headers || {})) args.push('-H', k + ': ' + v);
    if (o.payload) args.push('--data-raw', o.payload);
    const out = execFileSync('curl', args).toString(), i = out.lastIndexOf('\n');
    return { getResponseCode: () => +out.slice(i + 1), getContentText: () => out.slice(0, i) };
  } },
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => feuille, getUrl: () => '' }) },
  CacheService: { getScriptCache: () => ({ get: k => env.cache[k] || null, put: (k, v) => { env.cache[k] = v; } }) },
  Utilities: { formatDate: (d, z, f) => { const p = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }).format(d).replace(' ', ' à '); return /yyyy/.test(f) ? 'h' + d.getHours() : p; },
    getUuid: () => crypto.randomUUID(),
    computeHmacSha256Signature: (v, k) => Array.from(crypto.createHmac('sha256', k).update(v).digest(), b => (b > 127 ? b - 256 : b)),
    base64Encode: b => Buffer.from(b).toString('base64'), base64EncodeWebSafe: s => Buffer.from(s).toString('base64'),
    newBlob: html => ({ getAs: () => ({ setName: n => ({ nom: n, html }) }) }) },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  MailApp: { sendEmail: m => env.mails.push(m), getRemainingDailyQuota: () => 100 },
  ContentService: { createTextOutput: t => ({ setMimeType: () => t }), MimeType: {} },
  Session: { getEffectiveUser: () => ({ getEmail: () => '' }) },
};
const src = fs.readFileSync(path.join(__dirname, '..', 'Code.gs'), 'utf8');
const s = new Function(...Object.keys(g), src + '; return { ONGLETS, doPost, doGet, verifierPaiements, codeTicket };')(...Object.values(g));
const cols = s.ONGLETS.repas.cols.map(c => c[0]);
const sauver = () => { const props = Object.assign({}, env.props); delete props.STRIPE_SECRET; fs.writeFileSync(etatFichier, JSON.stringify({ lignes: env.lignes, props, ref: etat.ref })); };
const J = x => JSON.parse(x);

if (process.argv[2] !== 'verif') {
  env.lignes.length = 0; env.lignes.push(s.ONGLETS.repas.cols.map(c => c[1]));
  etat.ref = 'R-' + Array.from(crypto.randomBytes(8), b => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[b % 32]).join('');
  s.doPost({ postData: { contents: JSON.stringify({ type: 'repas', nom: 'Client Test', email: 'client@example.com', moyennes: '5', grandes: '1', offert_type: 'Grande', ref: etat.ref }) } });
  const r = J(s.doGet({ parameter: { action: 'paiement', m: '5', g: '1', email: 'client@example.com', ref: etat.ref, type: 'Grande' } }));
  sauver();
  if (!r.ok) { console.error('Erreur :', r.erreur); process.exit(1); }
  console.log('Réservation ' + etat.ref + ' : 5 moyennes + 1 grande (70 €).\nPage de paiement ouverte dans ton navigateur. Carte 4242 4242 4242 4242, 12/34, 123.\nAprès le paiement : node google-apps-script/tests/reel.js verif');
  execFileSync('open', [r.url]);
} else {
  if (!etat.ref) { console.error('Lance d\'abord : node google-apps-script/tests/reel.js'); process.exit(1); }
  s.verifierPaiements();
  const l = env.lignes.find(x => x[cols.indexOf('ref')] === etat.ref) || [];
  console.log('Paiement :', l[cols.indexOf('paiement')] || '?');
  console.log('Ticket   :', l[cols.indexOf('ticket')] || 'pas envoyé (paiement pas encore fait ?)');
  if (env.mails.length) {
    const m = env.mails[0], html = m.attachments[0].html.replace('src="data:image/jpeg', 'data-x="').replace('<div style="background:#a3180f', '<img src="file://' + path.join(racine, 'web/public/img/ticket-bandeau.jpg') + '" style="width:640px;height:180px;object-fit:cover;display:block"><div style="background:#a3180f');
    const f = path.join(dossier, 'ticket.html'); fs.writeFileSync(f, html);
    console.log('E-mail   : « ' + m.subject + ' » à ' + m.to + ', pièce jointe ' + m.attachments[0].nom);
    execFileSync('open', [f]);
  }
  const code = s.codeTicket(etat.ref);
  for (const [nom, a] of [['Scan 1', 'controle'], ['Remise', 'retirer'], ['Scan 2', 'retirer']]) { const r = J(s.doGet({ parameter: { action: a, code, pin: 'TEST' } })); console.log(nom.padEnd(9), ':', r.etat, r.retrait || ''); }
  sauver();
}
