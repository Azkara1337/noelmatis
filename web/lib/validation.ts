// Validation et nettoyage des formulaires (côté navigateur).
// Les mêmes règles sont appliquées dans google-apps-script/Code.gs : ne jamais compter sur le navigateur seul.

/** Téléphone, une fois espaces, points, tirets et parenthèses retirés : 0X XX XX XX XX ou +XXXXXXXX (8 à 15 chiffres). */
export const TEL_RE = /^(?:0[1-9]\d{8}|\+[1-9]\d{7,14})$/;
/** E-mail simple, sans caractères qui pourraient servir à injecter du HTML. */
export const MAIL_RE = /^[^\s@<>"'`]+@[^\s@<>"'`]+\.[a-z]{2,}$/i;
/** Noms (personne, activité, entreprise) : lettres (accents compris), chiffres et ponctuation courante. */
export const NOM_RE = /^[\p{L}\p{M}0-9 '’.,&()\/+-]+$/u;

/** Code promo : lettres, chiffres, tiret et tiret bas, 30 caractères au plus. */
export const CODE_RE = /^[A-Z0-9_-]{1,30}$/;

const LONGUEUR: Record<string, number> = { code_promo: 30, message: 1000, nom: 80, activite: 80, entreprise: 80, email: 120, tel: 20 };
const NOMS = ['nom', 'activite', 'entreprise'];

/** Pendant la saisie du téléphone : ne garde que les chiffres, les espaces et un « + » au début. */
export function filtrerTel(s: string): string {
  const t = s.replace(/[^\d+ ]/g, '');
  return (t.startsWith('+') ? '+' : '') + t.replace(/\+/g, '');
}

/** Retire les caractères de contrôle et les chevrons < > (pas de balise HTML possible), coupe à la longueur maximale. */
export function nettoyer(k: string, s: string): string {
  const multiligne = k === 'message';
  return s
    .replace(multiligne ? /[\u0000-\u0009\u000B-\u001F\u007F]/g : /[\u0000-\u001F\u007F]/g, ' ')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, LONGUEUR[k] ?? 200);
}

/** Vérifie les valeurs nettoyées. Renvoie un message d'erreur, ou null si tout est bon. */
export function verifier(v: Record<string, string>): string | null {
  if (v.tel !== undefined && v.tel) {
    v.tel = v.tel.replace(/[\s.\-()]/g, '');
    if (!TEL_RE.test(v.tel)) return 'Numéro de téléphone invalide : 10 chiffres (06 12 34 56 78) ou format international (+33…).';
  }
  if (v.email && !MAIL_RE.test(v.email)) return 'Adresse e-mail invalide.';
  for (const k of NOMS) {
    if (v[k] && !NOM_RE.test(v[k])) return 'Le nom contient des caractères non autorisés.';
  }
  if (v.salaries && !/^\d{1,4}$/.test(v.salaries)) return 'Le nombre de salariés doit être un nombre.';
  for (const k of ['moyennes', 'grandes', 'offerts']) if (v[k] && !/^\d{1,3}$/.test(v[k])) return 'Nombre de repas invalide.';
  if (v.offert_type && !['Moyenne', 'Grande'].includes(v.offert_type)) return 'Type de repas offert invalide.';
  if (v.code_promo) {
    v.code_promo = v.code_promo.replace(/\s+/g, '').toUpperCase();
    if (!CODE_RE.test(v.code_promo)) return 'Code promo invalide : lettres, chiffres et tirets uniquement.';
  }
  return null;
}
