// Tests unitaires de google-apps-script/Code.gs (paiement Stripe), avec de faux services Google et un faux Stripe.
const fs = require('fs'); const assert = require('assert');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.gs'), 'utf8');
function charger(opts = {}) {
  const env = { appels: [], lignes: [], props: { STRIPE_SECRET: opts.cle === undefined ? 'sk_test_FAUX' : opts.cle }, cache: {}, stripe: opts.stripe || (() => ({ code: 200, corps: { url: 'https://checkout.stripe.com/c/pay/cs_test_ABC', id: 'cs_test_ABC' } })) };
  const feuille = { lignes: env.lignes,
    getLastRow: () => env.lignes.length, getLastColumn: () => (env.lignes[0] || []).length,
    appendRow: r => env.lignes.push(r.slice()),
    getRange: (r, c, nr, nc) => ({
      getValues: () => env.lignes.slice(r - 1, r - 1 + (nr || 1)).map(l => l.slice(c - 1, c - 1 + (nc || 1))),
      getValue: () => (env.lignes[r - 1] || [])[c - 1], setValue: v => { env.lignes[r - 1][c - 1] = v; },
      setValues: v => { v[0].forEach((x, i) => { env.lignes[r - 1][c - 1 + i] = x; }); return { setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }) }; } }) };
  const g = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => env.props[k], setProperty: (k, v) => { env.props[k] = v; } }) },
    UrlFetchApp: { fetch: (url, o) => { env.appels.push({ url, o }); const r = env.stripe(url, o); return { getResponseCode: () => r.code, getContentText: () => JSON.stringify(r.corps) }; } },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: () => feuille, getUrl: () => '' }) },
    CacheService: { getScriptCache: () => ({ get: k => env.cache[k] || null, put: (k, v) => { env.cache[k] = v; } }) },
    Utilities: { formatDate: d => '20/11 10:00', base64EncodeWebSafe: s => Buffer.from(s).toString('base64') },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail() {}, getRemainingDailyQuota: () => 100 },
    ContentService: { createTextOutput: t => ({ setMimeType: () => t }), MimeType: {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => '' }) },
  };
  const f = new Function(...Object.keys(g), src + '; return { creerPaiement, verifierSession, marquer, encoder, doPost, doGet, ONGLETS, verifierPaiements };');
  const o = f(...Object.values(g));
  // opts.repas : ligne de réservation déjà enregistrée dans l'onglet Repas (référence R-ABCD2345)
  if (opts.repas) { const cols = o.ONGLETS.repas.cols.map(c => c[0]); env.lignes.push(o.ONGLETS.repas.cols.map(c => c[1])); const v = Object.assign({ ref: 'R-ABCD2345', email: 'a@b.fr', nom: 'Jean Test', paiement: 'Non payé' }, opts.repas); env.lignes.push(cols.map(k => v[k] === undefined ? '' : v[k])); }
  return { env, ...o };
}
const sess = env => env.appels.find(a => /checkout\/sessions$/.test(a.url));
const decode = s => Object.fromEntries(s.split('&').map(p => p.split('=').map(decodeURIComponent)));
let ok = 0; const t = (nom, fn) => { try { fn(); ok++; console.log('  ✓', nom); } catch (e) { console.log('  ✗', nom, '→', e.message); process.exitCode = 1; } };

console.log('encoder');
t('objets imbriqués au format Stripe', () => { const { encoder } = charger(); assert.strictEqual(decodeURIComponent(encoder({ a: 1, line_items: [{ price_data: { currency: 'eur' }, quantity: 2 }] })), 'a=1&line_items[0][price_data][currency]=eur&line_items[0][quantity]=2'); });
t('valeurs vides ignorées', () => { const { encoder } = charger(); assert.strictEqual(encoder({ a: '', b: null, c: 'x' }), 'c=x'); });

console.log('creerPaiement');
t('2 moyennes + 1 grande : bonnes lignes et prix (en centimes)', () => {
  const { creerPaiement, env } = charger({ repas: { moyennes: '2', grandes: '1' } }); const r = creerPaiement({ email: 'a@b.fr', ref: 'R-ABCD2345' });
  assert.ok(r.ok, JSON.stringify(r)); assert.strictEqual(r.url, 'https://checkout.stripe.com/c/pay/cs_test_ABC');
  const p = decode(sess(env).o.payload);
  assert.strictEqual(sess(env).url, 'https://api.stripe.com/v1/checkout/sessions'); assert.strictEqual(sess(env).o.method, 'post');
  assert.strictEqual(sess(env).o.headers.Authorization, 'Bearer sk_test_FAUX');
  assert.strictEqual(p['line_items[0][price_data][unit_amount]'], '1000'); assert.strictEqual(p['line_items[0][quantity]'], '2');
  assert.strictEqual(p['line_items[1][price_data][unit_amount]'], '2000'); assert.strictEqual(p['line_items[1][quantity]'], '1');
  assert.strictEqual(p['line_items[0][price_data][currency]'], 'eur'); assert.strictEqual(p.mode, 'payment');
  assert.strictEqual(p.client_reference_id, 'R-ABCD2345'); assert.strictEqual(p.customer_email, 'a@b.fr');
  assert.strictEqual(p.success_url, 'https://www.noel-rcimmo.fr/paiement/?type=repas&session={CHECKOUT_SESSION_ID}');
});
t('uniquement des grandes : une seule ligne', () => { const { creerPaiement, env } = charger({ repas: { moyennes: '0', grandes: '3' } }); creerPaiement({ email: 'a@b.fr', ref: 'R-ABCD2345' }); const p = decode(sess(env).o.payload); assert.strictEqual(p['line_items[0][price_data][unit_amount]'], '2000'); assert.ok(!('line_items[1][quantity]' in p)); });
t('5 achetés : repas offert indiqué, pas facturé', () => { const { creerPaiement, env } = charger({ repas: { moyennes: '5', grandes: '0', offert_type: 'Grande' } }); creerPaiement({ email: 'a@b.fr', ref: 'R-ABCD2345' }); const p = decode(sess(env).o.payload); assert.strictEqual(p['metadata[offerts]'], '1'); assert.match(p['line_items[0][price_data][product_data][description]'], /1 repas offert \(grande portion\)/); assert.strictEqual(p['line_items[0][quantity]'], '5'); });
t('prix non modifiable depuis le navigateur (paramètre prix ignoré)', () => { const { creerPaiement, env } = charger({ repas: { moyennes: '1' } }); creerPaiement({ email: 'a@b.fr', ref: 'R-ABCD2345', prix: '1', unit_amount: '1' }); assert.strictEqual(decode(sess(env).o.payload)['line_items[0][price_data][unit_amount]'], '1000'); });
for (const [nom, ligne, p, err] of [['0 repas', { moyennes: '0', grandes: '0' }, {}, 'nombre de repas invalide'], ['quantité négative', { moyennes: '-1', grandes: '2' }, {}, 'nombre de repas invalide'], ['quantité énorme', { moyennes: '500', grandes: '0' }, {}, 'nombre de repas invalide'], ['e-mail piégé', { moyennes: '1' }, { email: '"><x>@a.fr' }, 'e-mail invalide'], ['référence piégée', { moyennes: '1' }, { ref: '<script>' }, 'référence invalide'],
  ['réservation absente du Sheet', null, {}, 'réservation introuvable'], ['réservation déjà payée', { moyennes: '1', paiement: 'Payé 10 €' }, {}, 'réservation déjà payée']])
  t('refus : ' + nom, () => { const { creerPaiement, env } = charger(ligne ? { repas: ligne } : {}); const r = creerPaiement(Object.assign({ email: 'a@b.fr', ref: 'R-ABCD2345' }, p)); assert.strictEqual(r.ok, false); assert.strictEqual(r.erreur, err); assert.strictEqual(env.appels.length, 0); });
t('quantités de l\'adresse ignorées : on paie ce que dit le Sheet', () => { const { creerPaiement, env } = charger({ repas: { moyennes: '0', grandes: '99' } }); assert.ok(creerPaiement({ m: '1', g: '0', email: 'a@b.fr', ref: 'R-ABCD2345' }).ok); const p = decode(sess(env).o.payload); assert.strictEqual(p['line_items[0][price_data][unit_amount]'], '2000'); assert.strictEqual(p['line_items[0][quantity]'], '99'); assert.ok(!('line_items[1][quantity]' in p)); });
t('sans clé Stripe : erreur claire, pas de plantage', () => { const { creerPaiement } = charger({ cle: '', repas: { moyennes: '1' } }); const r = creerPaiement({ m: '1', email: 'a@b.fr', ref: 'R-ABCD2345' }); assert.strictEqual(r.ok, false); assert.match(r.erreur, /clé Stripe absente/); });
t('Stripe refuse : message de Stripe renvoyé', () => { const { creerPaiement } = charger({ repas: { moyennes: '1' }, stripe: () => ({ code: 401, corps: { error: { message: 'Invalid API Key provided' } } }) }); const r = creerPaiement({ m: '1', email: 'a@b.fr', ref: 'R-ABCD2345' }); assert.strictEqual(r.ok, false); assert.match(r.erreur, /Invalid API Key/); });

console.log('Sheet : référence et statut de paiement');
const repasValide = { type: 'repas', nom: 'Jean Test', email: 'a@b.fr', moyennes: '2', grandes: '1', ref: 'R-ABCD2345' };
t('la réservation enregistre la référence et « Non payé »', () => { const { doPost, env, ONGLETS } = charger(); env.lignes.push(ONGLETS.repas.cols.map(c => c[1])); assert.match(doPost({ postData: { contents: JSON.stringify(repasValide) } }), /"ok":true/); const l = env.lignes[1], cols = ONGLETS.repas.cols.map(c => c[0]); assert.strictEqual(l[cols.indexOf('ref')], 'R-ABCD2345'); assert.strictEqual(l[cols.indexOf('paiement')], 'Non payé'); assert.strictEqual(l[cols.indexOf('total_ttc')], '40 €'); });
t('référence piégée envoyée au Sheet : vidée', () => { const { doPost, env, ONGLETS } = charger(); env.lignes.push(ONGLETS.repas.cols.map(c => c[1])); doPost({ postData: { contents: JSON.stringify(Object.assign({}, repasValide, { ref: '=HYPERLINK("x")' })) } }); assert.strictEqual(env.lignes[1][ONGLETS.repas.cols.map(c => c[0]).indexOf('ref')], ''); });
t('création du paiement : « Paiement en cours »', () => { const { doPost, creerPaiement, env, ONGLETS } = charger(); env.lignes.push(ONGLETS.repas.cols.map(c => c[1])); doPost({ postData: { contents: JSON.stringify(repasValide) } }); creerPaiement({ m: '2', g: '1', email: 'a@b.fr', ref: 'R-ABCD2345' }); assert.strictEqual(env.lignes[1][ONGLETS.repas.cols.map(c => c[0]).indexOf('paiement')], 'Paiement en cours'); });
t('retour Stripe payé : « Payé 40 € … (TEST) »', () => {
  const { doPost, verifierSession, env, ONGLETS } = charger({ stripe: () => ({ code: 200, corps: { payment_status: 'paid', amount_total: 4000, client_reference_id: 'R-ABCD2345', created: 1795000000, metadata: { ref: 'R-ABCD2345', type: 'repas', moyennes: '2', grandes: '1' } } }) });
  env.lignes.push(ONGLETS.repas.cols.map(c => c[1])); doPost({ postData: { contents: JSON.stringify(repasValide) } });
  const r = verifierSession('cs_test_ABC123'); assert.deepStrictEqual([r.ok, r.paye, r.total], [true, true, 40]);
  assert.strictEqual(env.appels[0].url, 'https://api.stripe.com/v1/checkout/sessions/cs_test_ABC123'); assert.strictEqual(env.appels[0].o.method, 'get');
  assert.match(env.lignes[1][ONGLETS.repas.cols.map(c => c[0]).indexOf('paiement')], /^Payé 40 € le .*\(TEST\)$/);
});
t('retour Stripe non payé : rien marqué', () => { const { doPost, verifierSession, env, ONGLETS } = charger({ stripe: () => ({ code: 200, corps: { payment_status: 'unpaid', amount_total: 4000, client_reference_id: 'R-ABCD2345', created: 1 } }) }); env.lignes.push(ONGLETS.repas.cols.map(c => c[1])); doPost({ postData: { contents: JSON.stringify(repasValide) } }); assert.strictEqual(verifierSession('cs_test_X').paye, false); assert.strictEqual(env.lignes[1][ONGLETS.repas.cols.map(c => c[0]).indexOf('paiement')], 'Non payé'); });
t('un « Payé » n\'est jamais écrasé par « Paiement en cours »', () => { const { marquer, env, ONGLETS } = charger(); const cols = ONGLETS.repas.cols.map(c => c[0]); env.lignes.push(ONGLETS.repas.cols.map(c => c[1])); const l = cols.map(() => ''); l[cols.indexOf('ref')] = 'R-ABCD2345'; l[cols.indexOf('paiement')] = 'Payé 40 €'; env.lignes.push(l); marquer('R-ABCD2345', 'Paiement en cours', false); assert.strictEqual(env.lignes[1][cols.indexOf('paiement')], 'Payé 40 €'); });
t('session piégée refusée sans appeler Stripe', () => { const { verifierSession, env } = charger(); assert.strictEqual(verifierSession('cs_test_A/../../charges').ok, false); assert.strictEqual(env.appels.length, 0); });
t('doGet ?action=paiement branché', () => { const { doGet } = charger({ repas: { moyennes: '1' } }); assert.match(doGet({ parameter: { action: 'paiement', m: '1', g: '0', email: 'a@b.fr', ref: 'R-ABCD2345' } }), /checkout\.stripe\.com/); });
t('anti-spam : au-delà de 30 demandes par heure, refus', () => { const { creerPaiement, env } = charger(); let r; for (let i = 0; i < 31; i++) r = creerPaiement({ m: '1', email: 'a@b.fr', ref: 'R-ABCD2345' }); assert.strictEqual(r.erreur, 'trop de demandes'); });
t('payé 1 repas pour une demande de 99 : « À VÉRIFIER », jamais « Payé »', () => {
  const { verifierSession, env, ONGLETS } = charger({ repas: { moyennes: '99', grandes: '0' }, stripe: () => ({ code: 200, corps: { payment_status: 'paid', amount_total: 1000, client_reference_id: 'R-ABCD2345', created: 1795000000, metadata: { ref: 'R-ABCD2345', type: 'repas', moyennes: '1', grandes: '0' } } }) });
  verifierSession('cs_test_ABC'); verifierSession('cs_test_ABC');
  assert.match(env.lignes[1][ONGLETS.repas.cols.map(c => c[0]).indexOf('paiement')], /^À VÉRIFIER : 10 € payés, payé 1 moyenne\(s\) \+ 0 grande\(s\), demande de 99 \+ 0/); });
t('session sans métadonnées (créée hors du site) : « À VÉRIFIER »', () => {
  const { verifierSession, env, ONGLETS } = charger({ repas: { moyennes: '1' }, stripe: () => ({ code: 200, corps: { payment_status: 'paid', amount_total: 1000, client_reference_id: 'R-ABCD2345', created: 1795000000 } }) });
  verifierSession('cs_test_ABC'); assert.match(env.lignes[1][ONGLETS.repas.cols.map(c => c[0]).indexOf('paiement')], /^À VÉRIFIER/); });
console.log(`\n${ok} tests réussis` + (process.exitCode ? ' — DES TESTS ÉCHOUENT' : ''));
