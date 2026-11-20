import { ICONES } from './icones';
import { CREATEURS, INVITES, VUES_MOIS, type Invite, type Reseau as ReseauT } from '@/lib/config';

// Invités : bandeau de chiffres, carte de l'hôte, grille compacte (page Invités) et bandeau qui défile (accueil).

type Cle = 'ig' | 'tk' | 'yt';
const NOMS: Record<Cle, string> = { ig: 'Instagram', tk: 'TikTok', yt: 'YouTube' };

/** Réseaux renseignés d'un invité (un réseau sans nombre d'abonnés n'est pas affiché). */
function reseaux(v: Invite) {
  return (['ig', 'tk', 'yt'] as Cle[]).flatMap(k => { const r = v[k] as ReseauT | undefined; return r && r.n ? [{ k, ...r }] : []; });
}

/** Image ronde : photo de profil, sinon photo détourée, sinon photo. */
const avatar = (v: Invite) => v.avatar || v.detour || v.photo;

function Abonnes({ v }: { v: Invite }) {
  const rs = reseaux(v);
  if (!rs.length) return null;
  return (
    <ul className="cr-rs">
      {rs.map(r => <li key={r.k}><a href={r.url} target="_blank" rel="noopener" aria-label={`${r.n} abonnés sur ${NOMS[r.k]}`}>{ICONES[r.k]}<b>{r.n}</b></a></li>)}
    </ul>
  );
}

function Lien({ v }: { v: Invite }) {
  const r = reseaux(v)[0];
  if (!r) return null;
  return <a className="cr-lien" href={r.url} target="_blank" rel="noopener">Voir sur {NOMS[r.k]}{ICONES.fleche}</a>;
}

/** Carte compacte d'un créateur. */
function Carte({ v }: { v: Invite }) {
  const img = avatar(v);
  return (
    <article className="cr">
      <div className={'cr-ph' + (!v.avatar && v.detour ? ' det' : '')}>{img ? <img src={img} alt={v.nom} loading="lazy" /> : ICONES.user}</div>
      <h3>{v.nom}</h3>
      <p className="cr-univ">{v.desc}</p>
      <Abonnes v={v} />
      <Lien v={v} />
    </article>
  );
}

/** Carte de l'hôte (Bertrand) : horizontale sur grand écran, compacte sur mobile. */
function Hote({ v }: { v: Invite }) {
  return (
    <article className="hote">
      <div className="hote-ph"><img src={v.detour || v.photo} alt={v.nom} /></div>
      <div className="hote-t">
        <h3>{v.nom}</h3>
        <p>{v.desc}</p>
        <Abonnes v={v} />
        <Lien v={v} />
      </div>
    </article>
  );
}

/** Bandeau de chiffres : créateurs présents, vues par mois, rencontres. */
export function StatsInvites() {
  return (
    <div className="st4 carte" id="invstats">
      <div>{ICONES.users}<span><b>{CREATEURS || INVITES.length}</b>créateurs présents</span></div>
      {VUES_MOIS && <div>{ICONES.vues}<span><b>+{VUES_MOIS}</b>de vues par mois, à eux tous</span></div>}
      <div>{ICONES.handheart}<span>Des rencontres vraies<br />et authentiques !</span></div>
    </div>
  );
}

/** Page Invités : l'hôte en tête, puis tous les créateurs en grille compacte. */
export default function GrilleInvites({ id }: { id?: string }) {
  const hote = INVITES.find(v => v.roi);
  const autres = INVITES.filter(v => !v.roi);
  return (
    <div className="inv-scene" id={id}>
      {hote && <Hote v={hote} />}
      <div className="cr-g">{autres.map(v => <Carte key={v.nom} v={v} />)}</div>
    </div>
  );
}

/** Réseaux d'un invité, du plus suivi au moins suivi, pour le bandeau de l'accueil (mêmes chiffres que la page Invités). */
function parAudience(v: Invite) {
  const val = (n: string) => parseFloat(n.replace(',', '.')) * (/k/i.test(n) ? 1e3 : /m/i.test(n) ? 1e6 : 1);
  return [...reseaux(v)].sort((a, b) => val(b.n) - val(a.n));
}

/** Accueil : bandeau compact qui défile (photo ronde, nom, abonnés). Survol = pause. */
export function DefileInvites() {
  const liste = INVITES.filter(v => avatar(v));
  const pastille = (v: Invite, cle: string, cache?: boolean) => {
    const rs = parAudience(v);
    return (
      <a key={cle} className="dfl-c" href="/invites/" aria-hidden={cache || undefined} tabIndex={cache ? -1 : undefined}>
        <span className={'dfl-ph' + (!v.avatar && v.detour ? ' det' : '')}><img src={avatar(v)} alt={cache ? '' : v.nom} loading="lazy" /></span>
        <b>{v.nom}</b>{rs.length > 0 && <span className="dfl-rs">{rs.map(r => <small key={r.k} aria-label={`${r.n} abonnés sur ${NOMS[r.k]}`}>{ICONES[r.k]}{r.n}</small>)}</span>}
      </a>
    );
  };
  return (
    <div className="dfl" role="region" aria-label="Nos créateurs invités">
      <div className="dfl-piste">
        {liste.map(v => pastille(v, v.nom))}
        {liste.map(v => pastille(v, v.nom + '-bis', true))}
      </div>
    </div>
  );
}
