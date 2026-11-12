import type { Metadata } from 'next';
import { ICONES } from '@/components/icones';
import { INVITES, type Invite, type Reseau as ReseauT } from '@/lib/config';

export const metadata: Metadata = { title: 'Invités' };

// Un réseau ne s'affiche que s'il a un nombre d'abonnés (aucun chiffre inventé).
function Reseau({ k, r }: { k: 'ig' | 'tk' | 'yt'; r?: ReseauT }) {
  if (!r || !r.n) return null;
  return r.url ? <a href={r.url} target="_blank" rel="noopener">{ICONES[k]}{r.n}</a> : <span>{ICONES[k]}{r.n}</span>;
}

// Neige de la carte du Roi : positions fixes (pas d'aléatoire, pour un rendu identique serveur et navigateur).
const FLOCONS = Array.from({ length: 22 }, (_, i) => ({
  left: (i * 37 + 7) % 100,
  taille: 4 + (i * 5) % 6,
  duree: 6 + (i * 7) % 6,
  delai: -((i * 13) % 11),
  derive: ((i % 5) - 2) * 9,
}));

// Boules de Noël suspendues en haut de la carte : position, longueur du fil, couleur.
const BOULES = [
  { x: 9, fil: 26, c: '#c8221b' }, { x: 24, fil: 52, c: '#e9b949' }, { x: 41, fil: 18, c: '#2e5e2a' },
  { x: 59, fil: 44, c: '#c8221b' }, { x: 76, fil: 22, c: '#e9b949' }, { x: 91, fil: 38, c: '#2e5e2a' },
];

function DecorRoi() {
  return (
    <>
      <div className="roi-neige" aria-hidden="true">
        {FLOCONS.map((f, i) => (
          <span key={i} style={{ left: f.left + '%', width: f.taille, height: f.taille, animationDuration: f.duree + 's', animationDelay: f.delai + 's', ['--derive' as string]: f.derive + 'px' }} />
        ))}
      </div>
      <div className="roi-boules" aria-hidden="true">
        {BOULES.map((b, i) => (
          <span key={i} style={{ left: b.x + '%', animationDelay: -(i * 0.7) + 's' }}>
            <svg viewBox={`0 0 30 ${b.fil + 34}`} width="30" height={b.fil + 34}>
              <line x1="15" y1="0" x2="15" y2={b.fil} stroke="#e9b949" strokeWidth="1.5" />
              <rect x="11" y={b.fil} width="8" height="5" rx="1" fill="#b8862a" />
              <circle cx="15" cy={b.fil + 18} r="13" fill={b.c} stroke="#fff3" strokeWidth="1" />
              <ellipse cx="10.5" cy={b.fil + 13} rx="3.5" ry="5" fill="#fff" opacity=".45" transform={`rotate(30 10.5 ${b.fil + 13})`} />
            </svg>
          </span>
        ))}
      </div>
    </>
  );
}

function CarteInvite({ v }: { v: Invite }) {
  const lien = v.ig?.url || v.tk?.url || v.yt?.url || '';
  const reseaux = [v.ig, v.tk, v.yt].some(r => r && r.n);
  return (
    <article className={'inv-c' + (v.roi ? ' roi' : '')}>
      <div className="inv-ph">{v.photo ? <img src={v.photo} alt={v.nom} loading={v.roi ? undefined : 'lazy'} /> : <div className="vide">{ICONES.user}Photo à venir</div>}{v.roi && <DecorRoi />}</div>
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
