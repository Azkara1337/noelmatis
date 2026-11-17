import { ICONES } from './icones';
import { CREATEURS, INVITES, VUES_MOIS, type Invite, type Reseau as ReseauT } from '@/lib/config';

// Cartes des invités, utilisées sur la page Invités et sur l'accueil.

// Un réseau ne s'affiche que s'il a un nombre d'abonnés (relevé sur le compte, aucun chiffre inventé).
function Reseau({ k, r }: { k: 'ig' | 'tk' | 'yt'; r?: ReseauT }) {
  if (!r || !r.n) return null;
  return r.url ? <a href={r.url} target="_blank" rel="noopener">{ICONES[k]}<span>{r.n}<small> abonnés</small></span></a> : <span>{ICONES[k]}<span>{r.n}<small> abonnés</small></span></span>;
}

function CarteInvite({ v }: { v: Invite }) {
  const lien = v.ig?.url || v.tk?.url || v.yt?.url || '';
  const reseau = v.ig?.url ? 'Instagram' : v.tk?.url ? 'TikTok' : 'YouTube';
  const icone = v.ig?.url ? ICONES.ig : v.tk?.url ? ICONES.tk : ICONES.yt;
  const reseaux = [v.ig, v.tk, v.yt].some(r => r && r.n);
  return (
    <article className={'inv-c' + (v.roi ? ' roi' : '') + (v.detour ? ' detoure' : '')}>
      {v.detour
        ? <div className="inv-ph"><img className="detoure-img" src={v.detour} alt={v.nom} /></div>
        : <div className="inv-ph">{v.photo ? <img src={v.photo} alt={v.nom} loading="lazy" /> : <div className="vide">{ICONES.user}Photo à venir</div>}</div>}
      <div className="inv-nom"><h3>{v.nom}</h3></div>
      <div className="inv-b"><p>{v.desc}</p>{reseaux && <div className="inv-rs"><Reseau k="ig" r={v.ig} /><Reseau k="tk" r={v.tk} /><Reseau k="yt" r={v.yt} /></div>}{lien && <a className="inv-lien" href={lien} target="_blank" rel="noopener">{icone}Voir sur {reseau}{ICONES.fleche}</a>}</div>
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

/** Grille des invités : la carte « roi » (Bertrand) au centre, les autres autour. */
export default function GrilleInvites({ id }: { id?: string }) {
  // Au-delà de 4 invités autour du centre, une 3e rangée : la carte « +10 créateurs » se place au milieu.
  const autres = INVITES.filter(v => !v.roi).length;
  const roi = INVITES.some(v => v.roi);
  return (
    <div className="inv-scene">
      <div className={'inv-g' + (roi ? ' autour' : '')} id={id}>
        {roi && autres > 4 && <div className="inv-plus"><b>{CREATEURS || INVITES.length}</b><span>créateurs au total</span><small>et d'autres surprises vous attendent sur place !</small></div>}
        {[...INVITES].sort((a, b) => Number(!!b.roi) - Number(!!a.roi)).map(v => <CarteInvite key={v.nom} v={v} />)}
      </div>
    </div>
  );
}

/** Total d'abonnés le plus parlant d'un invité (le plus gros réseau), pour le bandeau de l'accueil. */
function principal(v: Invite) {
  const r = [v.ig && { k: 'ig' as const, ...v.ig }, v.tk && { k: 'tk' as const, ...v.tk }, v.yt && { k: 'yt' as const, ...v.yt }]
    .filter((x): x is { k: 'ig' | 'tk' | 'yt'; n: string; url: string } => !!x && !!x.n);
  const val = (n: string) => parseFloat(n.replace(',', '.')) * (/k/i.test(n) ? 1e3 : /m/i.test(n) ? 1e6 : 1);
  return r.sort((a, b) => val(b.n) - val(a.n))[0];
}

/** Accueil : bandeau compact qui défile (photo ronde, nom, abonnés). Survol = pause. */
export function DefileInvites() {
  const liste = INVITES.filter(v => v.detour || v.photo);
  const pastille = (v: Invite, cle: string, cache?: boolean) => {
    const p = principal(v);
    return (
      <a key={cle} className="dfl-c" href="/invites/" aria-hidden={cache || undefined} tabIndex={cache ? -1 : undefined}>
        <span className={'dfl-ph' + (v.detour ? ' det' : '')}><img src={v.detour || v.photo} alt={cache ? '' : v.nom} loading="lazy" /></span>
        <span className="dfl-t"><b>{v.nom}</b>{p && <small>{ICONES[p.k]}{p.n} abonnés</small>}</span>
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
