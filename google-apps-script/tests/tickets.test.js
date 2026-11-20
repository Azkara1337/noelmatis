// Tests unitaires du ticket repas (QR signé, envoi unique, contrôle à l'accueil) de google-apps-script/Code.gs.
// Lancer : node google-apps-script/tests/tickets.test.js  (jsQR facultatif : NODE_PATH=…/node_modules pour décoder le QR)
const fs = require('fs'); const assert = require('assert'); const crypto = require('crypto');
const src = fs.readFileSync(require('path').join(__dirname, '..', 'Code.gs'), 'utf8');
let horloge = 0;
function charger() {
  const env = { lignes: [], props: { ACCUEIL_CODE: '4821' }, cache: {}, mails: [] };
  const feuille = {
    getLastRow: () => env.lignes.length, getLastColumn: () => (env.lignes[0] || []).length,
    appendRow: r => env.lignes.push(r.slice()),
    getRange: (r, c, nr, nc) => ({
      getValues: () => env.lignes.slice(r - 1, r - 1 + (nr || 1)).map(l => { const x = l.slice(c - 1, c - 1 + (nc || 1)); while (x.length < (nc || 1)) x.push(''); return x; }),
      getValue: () => (env.lignes[r - 1] || [])[c - 1], setValue: v => { env.lignes[r - 1][c - 1] = v; },
      setValues: v => { v[0].forEach((x, i) => { env.lignes[r - 1][c - 1 + i] = x; }); return { setFontWeight: () => ({ setBackground: () => ({ setFontColor: () => {} }) }) }; } }) };
  const g = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: k => env.props[k] || null, setProperty: (k, v) => { env.props[k] = v; } }) },
    UrlFetchApp: { fetch: () => ({ getResponseCode: () => 200, getBlob: () => ({ getBytes: () => [1, 2, 3] }), getContentText: () => '{}' }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: n => (n === 'Partenaires' && !env.avecPartenaires ? null : feuille), getUrl: () => '' }) },
    CacheService: { getScriptCache: () => ({ get: k => env.cache[k] || null, put: (k, v) => { env.cache[k] = v; } }) },
    Utilities: {
      formatDate: (d, z, f) => /yyyy/.test(f) ? '2026121910' : '19/12 à 10:0' + (horloge++ % 10),
      getUuid: () => crypto.randomUUID(),
      computeHmacSha256Signature: (v, k) => Array.from(crypto.createHmac('sha256', k).update(v).digest(), b => (b > 127 ? b - 256 : b)),
      base64Encode: b => Buffer.from(b).toString('base64'),
      newBlob: (html) => ({ getAs: () => ({ setName: n => ({ nom: n, html }) }) }),
    },
    LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
    MailApp: { sendEmail: m => env.mails.push(m), getRemainingDailyQuota: () => 100 },
    ContentService: { createTextOutput: t => ({ setMimeType: () => t }), MimeType: {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => '' }) },
  };
  const f = new Function(...Object.keys(g), src + '; return { ONGLETS, codeTicket, signer, envoyerTicketSiBesoin, controlerTicket, rechercherTicket, doGet, qrDataUrl, qrcode };');
  const o = f(...Object.values(g));
  const cols = o.ONGLETS.repas.cols.map(c => c[0]);
  env.lignes.push(o.ONGLETS.repas.cols.map(c => c[1]));
  const ajouter = (ref, paiement, extra = {}) => { const l = cols.map(() => ''); Object.assign(l, Object.fromEntries(Object.entries(Object.assign({ ref, paiement, nom: 'Jean Test', email: 'a@b.fr', moyennes: '5', grandes: '1', offerts: '1', offert_type: 'Grande', total_ttc: '70 €' }, extra)).map(([k, v]) => [cols.indexOf(k), v]))); env.lignes.push(l); return env.lignes.length - 1; };
  const val = (i, k) => env.lignes[i][cols.indexOf(k)];
  return { env, ajouter, val, ...o };
}
let ok = 0; const t = (nom, fn) => { try { fn(); ok++; console.log('  ✓', nom); } catch (e) { console.log('  ✗', nom, '→', e.message); process.exitCode = 1; } };

console.log('Code du QR');
t('format R-XXXXXXXX-SIGNATURE (12 hexa)', () => { const { codeTicket } = charger(); assert.match(codeTicket('R-ABCD2345'), /^R-ABCD2345-[0-9A-F]{12}$/); });
t('clé secrète créée une fois, signature stable', () => { const { codeTicket, env } = charger(); const a = codeTicket('R-ABCD2345'); const s = env.props.TICKET_SECRET; assert.ok(s && s.length >= 64); assert.strictEqual(codeTicket('R-ABCD2345'), a); });
t('autre installation (autre clé) = autre signature', () => { assert.notStrictEqual(charger().codeTicket('R-ABCD2345'), charger().codeTicket('R-ABCD2345')); });
t('le QR contient bien le code (image GIF, relu par jsQR)', () => {
  const { qrDataUrl, qrcode, codeTicket } = charger(); const code = codeTicket('R-ABCD2345');
  assert.match(qrDataUrl(code), /^data:image\/gif;base64,/);
  let jsQR; try { jsQR = require('jsqr'); } catch { console.log('    (jsQR absent : décodage non vérifié)'); return; }
  const qr = qrcode(0, 'M'); qr.addData(code); qr.make(); const n = qr.getModuleCount(), px = 8, bord = 4, w = (n + bord * 2) * px;
  const img = new Uint8ClampedArray(w * w * 4).fill(255);
  for (let y = 0; y < w; y++) for (let x = 0; x < w; x++) { const r = Math.floor(y / px) - bord, c = Math.floor(x / px) - bord; if (r >= 0 && c >= 0 && r < n && c < n && qr.isDark(r, c)) { const i = (y * w + x) * 4; img[i] = img[i + 1] = img[i + 2] = 0; } }
  assert.strictEqual(jsQR(img, w, w).data, code);
});

console.log('Envoi du ticket');
t('payé : PDF envoyé une fois, colonne Ticket remplie', () => {
  const { envoyerTicketSiBesoin, ajouter, val, env } = charger(); const i = ajouter('R-ABCD2345', 'Payé 70 € le 20/11 10:00');
  assert.strictEqual(envoyerTicketSiBesoin('R-ABCD2345'), true); assert.strictEqual(env.mails.length, 1);
  const m = env.mails[0]; assert.strictEqual(m.to, 'a@b.fr'); assert.strictEqual(m.attachments[0].nom, 'Ticket-repas-R-ABCD2345.pdf');
  assert.match(m.attachments[0].html, /data:image\/gif;base64,/); assert.match(m.attachments[0].html, /R-ABCD2345-[0-9A-F]{12}/); assert.match(m.attachments[0].html, /Repas grande portion/);
  assert.match(val(i, 'ticket'), /^Envoyé le/);
});
t('doublon : un 2e retour Stripe ne renvoie pas le ticket', () => { const { envoyerTicketSiBesoin, ajouter, env } = charger(); ajouter('R-ABCD2345', 'Payé 70 €'); envoyerTicketSiBesoin('R-ABCD2345'); assert.strictEqual(envoyerTicketSiBesoin('R-ABCD2345'), false); assert.strictEqual(env.mails.length, 1); });
t('non payé : aucun ticket', () => { const { envoyerTicketSiBesoin, ajouter, env } = charger(); ajouter('R-ABCD2345', 'Paiement en cours'); assert.strictEqual(envoyerTicketSiBesoin('R-ABCD2345'), false); assert.strictEqual(env.mails.length, 0); });
t('nom piégé échappé dans le PDF', () => { const { envoyerTicketSiBesoin, ajouter, env } = charger(); ajouter('R-ABCD2345', 'Payé 70 €', { nom: '<img src=x onerror=alert(1)>' }); envoyerTicketSiBesoin('R-ABCD2345'); assert.ok(!/<img src=x/.test(env.mails[0].attachments[0].html)); });

console.log('Contrôle à l\'accueil');
const pret = () => { const c = charger(); c.ajouter('R-ABCD2345', 'Payé 70 €'); return Object.assign(c, { code: c.codeTicket('R-ABCD2345') }); };
t('sans code accueil : refusé', () => { const { controlerTicket, code } = pret(); const r = controlerTicket({ code, pin: '' }, false); assert.strictEqual(r.ok, false); assert.match(r.erreur, /incorrect/); });
t('code accueil non configuré : refusé', () => { const c = pret(); delete c.env.props.ACCUEIL_CODE; assert.match(c.controlerTicket({ code: c.code, pin: '' }, false).erreur, /non configuré/); });
t('valide : état ok, détail des repas, rien modifié', () => { const { controlerTicket, code, val } = pret(); const r = controlerTicket({ code, pin: '4821' }, false); assert.deepStrictEqual([r.etat, r.nom, r.moyennes, r.grandes, r.offerts], ['ok', 'Jean Test', 5, 1, 1]); assert.strictEqual(val(1, 'retrait'), ''); });
t('remise : « Remis le … », puis 2e scan = DÉJÀ REMIS', () => { const { controlerTicket, code, val } = pret(); assert.strictEqual(controlerTicket({ code, pin: '4821' }, true).etat, 'remis'); assert.match(val(1, 'retrait'), /^Remis le/); const r2 = controlerTicket({ code, pin: '4821' }, true); assert.strictEqual(r2.etat, 'deja'); assert.match(r2.retrait, /^Remis le/); assert.strictEqual(controlerTicket({ code, pin: '4821' }, false).etat, 'deja'); });
t('code minuscule ou avec espaces accepté', () => { const { controlerTicket, code } = pret(); assert.strictEqual(controlerTicket({ code: '  ' + code.toLowerCase() + ' ', pin: '4821' }, false).etat, 'ok'); });
t('faux QR (signature inventée) : faux', () => { const { controlerTicket } = pret(); assert.strictEqual(controlerTicket({ code: 'R-ABCD2345-000000000000', pin: '4821' }, false).etat, 'faux'); });
t('signature d\'une autre réservation : faux', () => { const c = pret(); c.ajouter('R-ZZZZ9999', 'Payé 10 €'); const sig = c.code.slice(-12); assert.strictEqual(c.controlerTicket({ code: 'R-ZZZZ9999-' + sig, pin: '4821' }, true).etat, 'faux'); });
t('format piégé : faux', () => { const { controlerTicket } = pret(); for (const x of ['', '<script>', '=HYPERLINK("x")', 'R-ABCD2345']) assert.strictEqual(controlerTicket({ code: x, pin: '4821' }, false).etat, 'faux'); });
t('signé mais pas dans le Sheet : inconnu', () => { const c = pret(); assert.strictEqual(c.controlerTicket({ code: c.codeTicket('R-QQQQ2222'), pin: '4821' }, true).etat, 'inconnu'); });
t('signé mais non payé : nonpaye, pas de remise', () => { const c = charger(); c.ajouter('R-ABCD2345', 'Paiement en cours'); const r = c.controlerTicket({ code: c.codeTicket('R-ABCD2345'), pin: '4821' }, true); assert.strictEqual(r.etat, 'nonpaye'); assert.strictEqual(c.val(1, 'retrait'), ''); });
t('20 codes accueil faux par heure, puis blocage même avec le bon', () => { const { controlerTicket, code } = pret(); for (let i = 0; i < 20; i++) controlerTicket({ code, pin: '0000' }, false); assert.match(controlerTicket({ code, pin: '4821' }, false).erreur, /trop de codes faux/); });
t('doGet ?action=controle et ?action=retirer branchés', () => { const { doGet, code } = pret(); assert.match(doGet({ parameter: { action: 'controle', code, pin: '4821' } }), /"etat":"ok"/); assert.match(doGet({ parameter: { action: 'retirer', code, pin: '4821' } }), /"etat":"remis"/); assert.match(doGet({ parameter: { action: 'retirer', code, pin: '4821' } }), /"etat":"deja"/); });

console.log('Ticket perdu : recherche par nom ou e-mail');
t('sans code accueil : refusé', () => { const { rechercherTicket } = pret(); assert.strictEqual(rechercherTicket({ q: 'jean', pin: '' }).ok, false); });
t('nom sans accents ni majuscules : trouvé, avec le code du QR', () => { const c = pret(); c.ajouter('R-ZZZZ9999', 'Payé 10 €', { nom: 'Hélène Durand', email: 'h@d.fr' }); const r = c.rechercherTicket({ q: 'HELENE', pin: '4821' }); assert.strictEqual(r.resultats.length, 1); assert.strictEqual(r.resultats[0].ref, 'R-ZZZZ9999'); assert.strictEqual(r.resultats[0].code, c.codeTicket('R-ZZZZ9999')); assert.strictEqual(c.controlerTicket({ code: r.resultats[0].code, pin: '4821' }, false).etat, 'ok'); });
t('par e-mail, nombre de repas et retrait', () => { const c = pret(); c.controlerTicket({ code: c.code, pin: '4821' }, true); const r = c.rechercherTicket({ q: 'a@b.f', pin: '4821' }).resultats[0]; assert.strictEqual(r.repas, 7); assert.match(r.retrait, /^Remis le/); });
t('non payé : absent des résultats', () => { const c = charger(); c.ajouter('R-ABCD2345', 'Paiement en cours'); assert.strictEqual(c.rechercherTicket({ q: 'jean', pin: '4821' }).resultats.length, 0); });
t('moins de 3 caractères : rien', () => { const c = pret(); assert.strictEqual(c.rechercherTicket({ q: 'je', pin: '4821' }).resultats.length, 0); });
t('doGet ?action=recherche branché', () => { const { doGet } = pret(); assert.match(doGet({ parameter: { action: 'recherche', q: 'jean', pin: '4821' } }), /"ref":"R-ABCD2345"/); });

console.log(`\n${ok} tests réussis` + (process.exitCode ? ' — DES TESTS ÉCHOUENT' : ''));
