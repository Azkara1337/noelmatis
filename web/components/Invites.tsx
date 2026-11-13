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
      <div className="inv-nom"><h3>{v.nom}</h3>{lien && <a href={lien} target="_blank" rel="noopener" aria-label={'Voir sur ' + reseau}>{ICONES.play}</a>}</div>
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
