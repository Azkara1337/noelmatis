import type { Metadata } from 'next';
import { ICONES } from '@/components/icones';
import { INVITES, type Invite, type Reseau as ReseauT } from '@/lib/config';

export const metadata: Metadata = { title: 'Invités' };

// Un réseau ne s'affiche que s'il a un nombre d'abonnés (aucun chiffre inventé).
function Reseau({ k, r }: { k: 'ig' | 'tk' | 'yt'; r?: ReseauT }) {
  if (!r || !r.n) return null;
  return r.url ? <a href={r.url} target="_blank" rel="noopener">{ICONES[k]}{r.n}</a> : <span>{ICONES[k]}{r.n}</span>;
}

function CarteInvite({ v }: { v: Invite }) {
  const lien = v.ig?.url || v.tk?.url || v.yt?.url || '';
  const reseaux = [v.ig, v.tk, v.yt].some(r => r && r.n);
  return (
    <article className={'inv-c' + (v.roi ? ' roi' : '') + (v.detour ? ' detoure' : '')}>
      {v.detour
        ? <div className="inv-ph"><img className="detoure-img" src={v.detour} alt={v.nom} /></div>
        : <div className="inv-ph">{v.photo ? <img src={v.photo} alt={v.nom} loading="lazy" /> : <div className="vide">{ICONES.user}Photo à venir</div>}</div>}
      <div className="inv-nom"><h3>{v.nom}</h3>{lien && <a href={lien} target="_blank" rel="noopener" aria-label="Voir son compte">{ICONES.play}</a>}</div>
      <div className="inv-b"><p>{v.desc}</p>{reseaux && <div className="inv-rs"><Reseau k="ig" r={v.ig} /><Reseau k="tk" r={v.tk} /><Reseau k="yt" r={v.yt} /></div>}</div>
    </article>
  );
}

export default function Invites() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.5 3 5.2" /></svg></span><div className="pk-t"><h1>Nos Invités &amp; Créateurs</h1><p>Ils seront présents au Marché de Noël !</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section className="inv2"><div className="wrap">
        <p className="tag-r">Des créateurs de contenu, artisans, passionnés et amoureux du terroir qui quittent les écrans pour venir à votre rencontre !</p>
        <div className="st4 carte" id="invstats">
        <div>{ICONES.users}<span><b>{INVITES.length}</b>créateurs présents</span></div>
        <div>{ICONES.handheart}<span>Des rencontres vraies<br />et authentiques !</span></div>
      </div>
        <div className={'inv-g' + (INVITES.some(v => v.roi) ? ' autour' : '')} id="invg">
        {[...INVITES].sort((a, b) => Number(!!b.roi) - Number(!!a.roi)).map(v => <CarteInvite key={v.nom} v={v} />)}
      </div>
        <div className="ruban"><b>Retrouvez-les en vrai au cœur du Marché de Noël !</b></div>
        <div className="inv-band"><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.2-4.5L16 4.7a2 2 0 0 1 2.8 2.8L8 18.3z" /><path d="M14 7l3 3" /></svg>Dédicaces</div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>Photos<br />&amp; souvenirs</div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L21 13l-8 8-2-2M9.5 17.5L3 11l3-3 6.5 6.5M6 8L4 6" /></svg>Ateliers<br />&amp; démonstrations</div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-6v-2" /></svg>Échanges<br />&amp; rencontres</div></div>
      </div></section>
    </main>
  );
}
