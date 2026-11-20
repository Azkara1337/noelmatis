// Tests du paiement en ligne des stands et des offres partenaires (faux Stripe, faux Sheet à plusieurs onglets).
const fs = require('fs'), assert = require('assert'), crypto = require('crypto');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.gs'), 'utf8');
function charger(stripeRep) {
  const env = { onglets: {}, appels: [], mails: [], props: { STRIPE_SECRET: 'sk_test_FAUX' }, cache: {} };
  const feuille = nom => { const L = env.onglets[nom] = env.onglets[nom] || []; return {
    getLastRow: () => L.length, getLastColumn: () => (L[0] || []).length, appendRow: r => L.push(r.slice()),
    getRange: (r, c, nr, nc) => ({ getValues: () => L.slice(r - 1, r - 1 + (nr || 1)).map(l => { const x = l.slice(c - 1, c - 1 + (nc || 1)); while (x.length < (nc || 1)) x.push(''); return x; }),
      getValue: () => (L[r - 1] || [])[c - 1], setValue: v => { L[r - 1][c - 1] = v; },
      setValues: v => { v[0].forEach((x, i) => { L[r - 1][c - 1 + i] = x; }); return { setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }) }; } }) }; };
  const g = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => env.props[k] || null, setProperty: (k, v) => { env.props[k] = v; } }) },
    UrlFetchApp: { fetch: (url, o) => { env.appels.push({ url, o }); const r = (stripeRep || (() => ({ code: 200, corps: { url: 'https://checkout.stripe.com/c/pay/cs_test_A', id: 'cs_test_A' } })))(url, o); return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(r.corps), getBlob: () => ({ getBytes: () => [], setName(n) { this.nom = n; return this; } }) }; } },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: feuille, getUrl: () => 'https://sheet' }) },
    CacheService: { getScriptCache: () => ({ get: k => env.cache[k] || null, put: (k, v) => { env.cache[k] = v; } }) },
    Utilities: { formatDate: (d, z, f) => /yyyy/.test(f) ? '2026112010' : '20/11 10:00', getUuid: () => crypto.randomUUID(), base64EncodeWebSafe: s => Buffer.from(s).toString('base64'), base64Encode: b => Buffer.from(b).toString('base64'),
      computeHmacSha256Signature: (v, k) => Array.from(crypto.createHmac('sha256', k).update(v).digest(), b => (b > 127 ? b - 256 : b)), newBlob: h => ({ getAs: () => ({ setName: n => ({ nom: n, html: h }) }) }) },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: m => env.mails.push(m), getRemainingDailyQuota: () => 100 },
    ContentService: { createTextOutput: t => ({ setMimeType: () => t }), MimeType: {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => '' }) },
  };
  const o = new Function(...Object.keys(g), src + '; return { ONGLETS, doPost, doGet, creerPaiement, verifierSession };')(...Object.values(g));
  for (const k of ['stand', 'repas', 'partenaire']) feuille(o.ONGLETS[k].nom).appendRow(o.ONGLETS[k].cols.map(c => c[1]));
  const col = (k, c) => o.ONGLETS[k].cols.map(x => x[0]).indexOf(c);
  return { env, ...o, col, ligne: k => env.onglets[o.ONGLETS[k].nom][1] };
}
const sess = env => env.appels.find(a => /checkout\/sessions$/.test(a.url));
const decode = s => Object.fromEntries(s.split('&').map(p => p.split('=').map(decodeURIComponent)));
let ok = 0; const t = (nom, fn) => { try { fn(); ok++; console.log('  ✓', nom); } catch (e) { console.log('  ✗', nom, '→', e.message); process.exitCode = 1; } };
const post = (c, d) => c.doPost({ postData: { contents: JSON.stringify(d) } });
const stand = { type: 'stand', nom: 'Jean Expo', tel: '0612345678', email: 'e@x.fr', stand: '12', categorie: 'Producteur, terroir', ref: 'S-ABCD2345' };
const parten = { type: 'partenaire', entreprise: 'Boulangerie Test', nom: 'Marie', tel: '0612345678', email: 'p@x.fr', offre: 'Sapin Gourmand', ref: 'P-ABCD2345' };

console.log('Stands');
t('demande de stand : référence et « Non payé » dans l\'onglet Stands', () => { const c = charger(); post(c, stand); assert.strictEqual(c.ligne('stand')[c.col('stand', 'ref')], 'S-ABCD2345'); assert.strictEqual(c.ligne('stand')[c.col('stand', 'paiement')], 'Non payé'); });
t('référence d\'un autre type (R- sur un stand) : vidée', () => { const c = charger(); post(c, Object.assign({}, stand, { ref: 'R-ABCD2345' })); assert.strictEqual(c.ligne('stand')[c.col('stand', 'ref')], ''); });
t('Producteur 180 € HT + TVA 20 %, facture Stripe, adresse demandée, retour sur /stand', () => { const c = charger(); const r = c.creerPaiement({ quoi: 'stand', cat: 'Producteur, terroir', stand: '12', email: 'e@x.fr', ref: 'S-ABCD2345' }); assert.ok(r.ok, JSON.stringify(r)); const p = decode(sess(c.env).o.payload);
  assert.strictEqual(p['line_items[0][price_data][unit_amount]'], '18000'); assert.ok(p['line_items[0][tax_rates][0]']); assert.strictEqual(p['invoice_creation[enabled]'], 'true'); assert.strictEqual(p.billing_address_collection, 'required'); assert.strictEqual(p['line_items[0][quantity]'], '1'); assert.match(p['line_items[0][price_data][product_data][description]'], /Stand n° 12 souhaité/); assert.strictEqual(p.success_url, 'https://www.noel-rcimmo.fr/stand/?paiement=ok&session={CHECKOUT_SESSION_ID}'); assert.strictEqual(p['payment_method_types[0]'], 'card'); });
for (const [cat, ttc] of [['Artisanat, créations', '12000'], ['Snacking, gourmandises', '28000'], ['Restauration, spécialités', '42000'], ['Stand Premium, brasero', '59000']]) t(cat + ' : ' + (+ttc / 100) + ' € HT + TVA', () => { const c = charger(); c.creerPaiement({ quoi: 'stand', cat, email: 'e@x.fr', ref: 'S-ABCD2345' }); assert.strictEqual(decode(sess(c.env).o.payload)['line_items[0][price_data][unit_amount]'], ttc); });
for (const [nom, p, err] of [['catégorie inventée', { cat: 'Gratuit' }, 'catégorie de stand invalide'], ['« Je ne sais pas encore »', { cat: 'Je ne sais pas encore' }, 'catégorie de stand invalide'], ['stand 99', { stand: '99' }, 'numéro de stand invalide'], ['référence repas', { ref: 'R-ABCD2345' }, 'référence invalide'], ['prix envoyé par le navigateur ignoré', { prix: '1' }, null]])
  t('stand : ' + nom, () => { const c = charger(); const r = c.creerPaiement(Object.assign({ quoi: 'stand', cat: 'Artisanat, créations', email: 'e@x.fr', ref: 'S-ABCD2345' }, p)); if (err) { assert.strictEqual(r.erreur, err); assert.strictEqual(c.env.appels.length, 0); } else assert.strictEqual(decode(sess(c.env).o.payload)['line_items[0][price_data][unit_amount]'], '12000'); });

console.log('Partenaires');
t('Sapin Gourmand 400 € HT + TVA, retour sur /partenaire', () => { const c = charger(); const r = c.creerPaiement({ quoi: 'partenaire', offre: 'Sapin Gourmand', email: 'p@x.fr', ref: 'P-ABCD2345' }); assert.ok(r.ok); const p = decode(sess(c.env).o.payload); assert.strictEqual(p['line_items[0][price_data][unit_amount]'], '40000'); assert.strictEqual(p.cancel_url, 'https://www.noel-rcimmo.fr/partenaire/?paiement=annule'); });
t('Partenaire Prestige 2 500 € HT + TVA', () => { const c = charger(); c.creerPaiement({ quoi: 'partenaire', offre: 'Partenaire Prestige', email: 'p@x.fr', ref: 'P-ABCD2345' }); assert.strictEqual(decode(sess(c.env).o.payload)['line_items[0][price_data][unit_amount]'], '250000'); });
t('offre inventée refusée', () => { const c = charger(); assert.strictEqual(c.creerPaiement({ quoi: 'partenaire', offre: 'Gratuite', email: 'p@x.fr', ref: 'P-ABCD2345' }).erreur, 'offre invalide'); });

console.log('Après le paiement');
const paye = (ref, total) => () => ({ code: 200, corps: { payment_status: 'paid', amount_total: total, client_reference_id: ref, created: 1795000000, livemode: false } });
t('stand payé : « Payé 216 € (TEST) », e-mail à l\'organisation + au client, une seule fois', () => {
  const c = charger(paye('S-ABCD2345', 21600)); post(c, stand); c.env.mails.length = 0;
  c.verifierSession('cs_test_A'); assert.match(c.ligne('stand')[c.col('stand', 'paiement')], /^Payé 216 € .*\(TEST\)$/);
  assert.strictEqual(c.env.mails.length, 2); assert.match(c.env.mails[0].to, /mathilde\.calero@rc-immo\.com/); assert.match(c.env.mails[0].body, /appeler l'exposant/);
  assert.strictEqual(c.env.mails[1].to, 'e@x.fr'); assert.match(c.env.mails[1].body, /216 € TTC/); assert.match(c.env.mails[1].body, /Votre facture vous est envoyée par e-mail/);
  c.verifierSession('cs_test_A'); assert.strictEqual(c.env.mails.length, 2, 'pas de 2e envoi'); });
t('partenaire payé : e-mails envoyés, « Payé 480 € »', () => { const c = charger(paye('P-ABCD2345', 48000)); post(c, parten); c.env.mails.length = 0; c.verifierSession('cs_test_A'); assert.match(c.ligne('partenaire')[c.col('partenaire', 'paiement')], /^Payé 480 €/); assert.strictEqual(c.env.mails.length, 2); assert.match(c.env.mails[1].body, /logo/); });
t('repas payé : ticket + e-mail à l\'organisation, pas de doublon', () => { const c = charger(paye('R-ABCD2345', 4000)); post(c, { type: 'repas', nom: 'Jean', email: 'r@x.fr', moyennes: '2', grandes: '1', ref: 'R-ABCD2345' }); c.env.mails.length = 0; c.verifierSession('cs_test_A'); c.verifierSession('cs_test_A'); assert.deepStrictEqual(c.env.mails.map(m => m.subject).sort(), ['Marché de Noël · paiement reçu (TEST) · 40 €', 'Marché de Noël · votre ticket repas']); });
t('paiement d\'une référence inconnue : aucun e-mail', () => { const c = charger(paye('S-ZZZZ9999', 14400)); c.verifierSession('cs_test_A'); assert.strictEqual(c.env.mails.length, 0); });

console.log('Factures');
const avecFacture = (ref, total, prete = () => true) => (url) => {
  if (/\/invoices\/in_1$/.test(url)) return prete() ? { code: 200, corps: { number: 'RC-0001', invoice_pdf: 'https://pay.stripe.com/invoice/x/pdf', hosted_invoice_url: 'https://invoice.stripe.com/i/x' } } : { code: 200, corps: { number: 'RC-0001', invoice_pdf: null } };
  if (/pay\.stripe\.com/.test(url)) return { code: 200, corps: {} };
  return { code: 200, corps: { payment_status: 'paid', amount_total: total, client_reference_id: ref, created: 1795000000, livemode: false, invoice: 'in_1' } };
};
t('stand payé : facture PDF jointe à la confirmation, notée dans le Sheet, envoyée une seule fois', () => {
  const c = charger(avecFacture('S-ABCD2345', 21600)); post(c, stand); c.env.mails.length = 0;
  c.verifierSession('cs_test_A'); c.verifierSession('cs_test_A');
  const client = c.env.mails.filter(m => m.to === 'e@x.fr'); assert.strictEqual(client.length, 1);
  assert.strictEqual(client[0].attachments[0].nom, 'Facture-RC-0001.pdf'); assert.match(client[0].body, /facture n° RC-0001 est jointe/);
  assert.match(c.ligne('stand')[c.col('stand', 'facture')], /^N° RC-0001 envoyée le .*invoice\.stripe\.com/);
  assert.match(c.env.mails[0].body, /Facture n° RC-0001 : https:\/\/invoice\.stripe\.com/); });
t('repas payé : ticket + facture dans le même e-mail', () => {
  const c = charger(avecFacture('R-ABCD2345', 4000)); post(c, { type: 'repas', nom: 'Jean', email: 'r@x.fr', moyennes: '2', grandes: '1', ref: 'R-ABCD2345' }); c.env.mails.length = 0;
  c.verifierSession('cs_test_A'); const tk = c.env.mails.filter(m => m.to === 'r@x.fr');
  assert.strictEqual(tk.length, 1); assert.deepStrictEqual(tk[0].attachments.map(a => a.nom), ['Ticket-repas-R-ABCD2345.pdf', 'Facture-RC-0001.pdf']); });
t('facture prête plus tard : envoyée seule au passage suivant, une fois', () => {
  let prete = false; const c = charger(avecFacture('P-ABCD2345', 48000, () => prete)); post(c, parten); c.env.mails.length = 0;
  c.verifierSession('cs_test_A'); assert.match(c.env.mails[1].body, /facture vous est envoyée/); assert.strictEqual(c.ligne('partenaire')[c.col('partenaire', 'facture')], '');
  prete = true; c.verifierSession('cs_test_A'); c.verifierSession('cs_test_A');
  const f = c.env.mails.filter(m => /votre facture n° RC-0001/.test(m.subject)); assert.strictEqual(f.length, 1); assert.strictEqual(f[0].attachments[0].nom, 'Facture-RC-0001.pdf'); });
t('réservation de repas : pas d\'e-mail avant le paiement (quota Gmail)', () => { const c = charger(); post(c, { type: 'repas', nom: 'Jean', email: 'r@x.fr', moyennes: '1', ref: 'R-ABCD2345' }); assert.strictEqual(c.env.mails.length, 0); });
t('taux de TVA créé une seule fois (20 % hors taxes, 10 % TTC pour les repas)', () => { const c = charger(); c.creerPaiement({ quoi: 'stand', cat: 'Artisanat, créations', email: 'e@x.fr', ref: 'S-ABCD2345' }); c.creerPaiement({ quoi: 'stand', cat: 'Artisanat, créations', email: 'e@x.fr', ref: 'S-ABCD2346' }); c.creerPaiement({ quoi: 'repas', m: '1', email: 'e@x.fr', ref: 'R-ABCD2345' });
  const tx = c.env.appels.filter(a => /tax_rates$/.test(a.url)).map(a => decode(a.o.payload)); assert.deepStrictEqual(tx.map(x => [x.percentage, x.inclusive]), [['20', 'false'], ['10', 'true']]); });
console.log(`\n${ok} tests réussis` + (process.exitCode ? ' — DES TESTS ÉCHOUENT' : ''));
