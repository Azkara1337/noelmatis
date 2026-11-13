'use client';
import Link from 'next/link';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Formulaire from './Formulaire';
import { useToast } from './Toast';
import { DEJA, ENDPOINT } from '@/lib/config';
import { BAKED, STANDS, ZONES } from '@/lib/plan';

type Pop = { stand: number } | { zone: string };

export default function PageStand() {
  const { toast } = useToast();
  // Statut des 30 stands : DEJA, puis l'onglet Plan du Google Sheet s'il est branché.
  const [pris, setPris] = useState<Record<string, string>>(() => ({ ...DEJA }));
  const [actif, setActif] = useState<number | null>(null);
  const [pop, setPop] = useState<Pop | null>(null);
  const [stand, setStand] = useState('');
  const [cat, setCat] = useState('Artisanat, créations');
  const [grand, setGrand] = useState(false);
  const pmap = useRef<HTMLDivElement>(null);
  const popRef = useRef<HTMLDivElement>(null);
  const ancre = useRef<HTMLElement | null>(null);

  const libres = STANDS.map(s => s.n).filter(n => !(n in pris));
  const standOk = libres.includes(+stand) ? stand : '';

  useEffect(() => {
    if (!ENDPOINT) return;
    fetch(ENDPOINT + '?action=plan').then(r => r.json()).then(d => { if (d && d.pris) setPris(d.pris); }).catch(() => {});
  }, []);

  // Un clic ailleurs ferme la bulle. (React écoute aussi sur document : on ignore donc les clics sur le plan et la bulle.)
  useEffect(() => {
    const fermer = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.ps, .pz, #pop, #plangrand')) return;
      setPop(null); setActif(null);
    };
    document.addEventListener('click', fermer);
    return () => document.removeEventListener('click', fermer);
  }, []);

  // Place la bulle au-dessus du bouton cliqué (ou en dessous s'il est en haut du plan).
  useLayoutEffect(() => {
    const el = popRef.current, b = ancre.current, m = pmap.current;
    if (!pop || !el || !b || !m) return;
    const r = b.getBoundingClientRect(), c = m.getBoundingClientRect();
    const cx = r.left - c.left + r.width / 2, dessous = r.top - c.top < c.height * 0.35;
    el.style.left = Math.max(8, Math.min(c.width - el.offsetWidth - 8, cx - el.offsetWidth / 2)) + 'px';
    el.style.top = (dessous ? r.bottom - c.top + 8 : r.top - c.top - el.offsetHeight - 8) + 'px';
  }, [pop]);

  function ouvrirPop(b: HTMLElement, p: Pop) {
    ancre.current = b;
    setActif('stand' in p ? p.stand : null);
    setPop(p);
  }
  function fermerPop() { setPop(null); setActif(null); }
  function choisirStand(n: number) {
    setStand(String(n)); setActif(n); setPop(null);
    document.getElementById('fexpo')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTimeout(() => document.getElementById('ex-nom')?.focus({ preventScroll: true }), 600);
    toast('Stand ' + n + ' sélectionné');
  }

  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5L5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-4.5h4V20" /></svg></span><div className="pk-t"><h1>Réserver mon stand</h1><p>Exposez vos produits, créations ou spécialités au cœur du Marché de Noël !</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section id="exposants" style={{paddingTop:'0'}}><div className="wrap">
        <div className="xplan">
          <figure className="xmap"><div className="pmap" id="pmap" ref={pmap}><img className="mapimg" id="carteimg" src="/img/plan.jpg" alt="Plan du marché : 30 emplacements, salle chauffée, Père Noël, grand sapin" />
            {ZONES.map(z => <button key={z.id} type="button" className="pz" data-z={z.id} style={z.pos} aria-label={z.titre} onClick={e => { e.stopPropagation(); ouvrirPop(e.currentTarget, { zone: z.id }); }}></button>)}
            {STANDS.map(({ n, pos }) => {
              const p = n in pris;
              const cls = ['ps', p ? 'res' : 'libre', p && !BAKED.includes(n) ? 'neuf' : '', actif === n ? 'on' : ''].filter(Boolean).join(' ');
              return <button key={n} type="button" className={cls} data-n={n} style={pos} aria-label={'Stand ' + n + (p ? ', réservé : ' + pris[n] : ', à pourvoir')} onClick={e => { e.stopPropagation(); ouvrirPop(e.currentTarget, { stand: n }); }}></button>;
            })}
            <div className="pop" id="pop" ref={popRef} hidden={!pop} onClick={e => e.stopPropagation()}>{pop && <>
              <button type="button" className="x" aria-label="Fermer" onClick={fermerPop}>×</button>
              {'stand' in pop ? (pop.stand in pris
                ? <><small className="k">Stand {pop.stand}</small><b>{pris[pop.stand]}</b><span className="st res">Déjà réservé</span></>
                : <><small className="k">Stand {pop.stand}</small><b>Emplacement libre</b><span className="st ok">À pourvoir · 3 × 3 m</span><button type="button" className="btn plein go" onClick={() => choisirStand(pop.stand)}>Réserver ce stand</button></>)
                : (() => { const z = ZONES.find(x => x.id === pop.zone)!; return <><b>{z.titre}</b><p>{z.texte}</p>{z.lien && <Link className="btn go" href={z.lien}>{z.libelle}</Link>}</>; })()}
            </>}</div>
          </div><figcaption><b>Cliquez sur un stand</b> pour voir s'il est libre et le réserver. <button type="button" className="lien" id="plangrand" onClick={e => { e.stopPropagation(); setGrand(true); }}>Voir le plan en grand</button></figcaption></figure>
          <div className="xside">
            <div className="xbox"><h3 className="xrib">Emplacements disponibles</h3>
              <ul className="xdispo">
                <li className="ok"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.6" /></svg><span><b><span id="nlib">{libres.length}</span> emplacements à pourvoir</b></span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="8" width="18" height="8" rx="1.5" /><path d="M7 8v3M11 8v4M15 8v3M19 8v4" /></svg><span><b>Dimensions :</b> 3 × 3 m, tonnelle à décorer par vos soins</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 3v5M15 3v5M6.5 8h11v3a5.5 5.5 0 0 1-11 0zM12 16.5V21" /></svg><span><b>Électricité</b> sur demande</span></li>
                <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M15.5 8.6A4.2 4.2 0 0 0 9 12a4.2 4.2 0 0 0 6.5 3.4M7.5 10.6h5M7.5 13.4h5" /></svg><span><b>Tarif :</b> à partir de 120 € HT pour les 3 jours</span></li>
              </ul>
              <p className="xdeja">Déjà là</p><div className="chips" id="chips">{Object.values(pris).map((n, i) => <span key={i} className="chip">{n}</span>)}</div>
            </div>
          </div>
        </div>


        <div className="xrubanw"><div className="xruban"><b>Nos emplacements et tarifs</b><span>Location de stand pour les 3 jours (18, 19 et 20 décembre)</span></div></div>
        <div className="xcards">
            <article className="xc">
              <div className="xc-img"><img src="/img/x_art.jpg" alt="" loading="lazy" /><span className="xc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5c-1.5-3-5-3.5-5-1.2C7 8.5 9.5 8.5 12 8.5zm0 0c1.5-3 5-3.5 5-1.2 0 1.2-2.5 1.2-5 1.2z" /></svg></span></div>
              <div className="xc-b"><h3>Artisan & Créateur</h3><p>Créations artisanales, bijoux, déco, cadeaux, fait main…</p><p className="xc-surprise">🎁 Le plus beau stand de Noël aura une surprise !</p><div className="xc-prix"><b>120 €</b><small>HT</small><span>les 3 jours</span></div>
              <ul><li>Emplacement 3 × 3 m</li><li>Accès au site sécurisé</li><li>Visibilité sur nos réseaux</li></ul>
              <a className="btn" href="#fexpo" onClick={() => setCat("Artisanat, créations")}>Réserver</a></div>
            </article>
            <article className="xc">
              <div className="xc-img"><img src="/img/x_prod.jpg" alt="" loading="lazy" /><span className="xc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3.5 10h17l-1.6 9.2a1 1 0 0 1-1 .8H6.1a1 1 0 0 1-1-.8zM8 10l3-6M16 10l-3-6M9 13.5v3.5M12 13.5v3.5M15 13.5v3.5" /></svg></span></div>
              <div className="xc-b"><h3>Producteur & Terroir</h3><p>Produits locaux, fromages, charcuterie, miel, confitures…</p><div className="xc-prix"><b>180 €</b><small>HT</small><span>les 3 jours</span></div>
              <ul><li>Emplacement 3 × 3 m</li><li>Accès au site sécurisé</li><li>Visibilité renforcée (photos et stories)</li></ul>
              <a className="btn" href="#fexpo" onClick={() => setCat("Producteur, terroir")}>Réserver</a></div>
            </article>
            <article className="xc">
              <div className="xc-img"><img src="/img/x_snack.jpg" alt="" loading="lazy" /><span className="xc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4.5 10h12v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4zM16.5 11.5h1.5a2 2 0 0 1 0 4h-1.7M8 3.5c-.8 1 .8 2 0 3M11.5 3.5c-.8 1 .8 2 0 3" /></svg></span></div>
              <div className="xc-b"><h3>Snacking & Gourmandises</h3><p>Crêpes, gaufres, churros, boissons chaudes, confiseries…</p><div className="xc-prix"><b>280 €</b><small>HT</small><span>les 3 jours</span></div>
              <ul><li>Emplacement 3 × 3 m</li><li>Accès électrique</li><li>Visibilité renforcée sur nos réseaux</li></ul>
              <a className="btn" href="#fexpo" onClick={() => setCat("Snacking, gourmandises")}>Réserver</a></div>
            </article>
            <article className="xc">
              <div className="xc-img"><img src="/img/x_resto.jpg" alt="" loading="lazy" /><span className="xc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-2 1.5-3 4-3 7v3h3" /></svg></span></div>
              <div className="xc-b"><h3>Restauration & Spécialités</h3><p>Aligot, raclette, grillades, cochon de lait, plats régionaux…</p><div className="xc-prix"><b>420 €</b><small>HT</small><span>les 3 jours</span></div>
              <ul><li>Emplacement 3 × 3 m</li><li>Accès électrique renforcé</li><li>Mis en avant dans le programme</li><li>Visibilité sur nos réseaux</li></ul>
              <a className="btn" href="#fexpo" onClick={() => setCat("Restauration, spécialités")}>Réserver</a></div>
            </article>
            <article className="xc">
              <div className="xc-img"><img src="/img/x_prem.jpg" alt="" loading="lazy" /><span className="xc-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21c-3.6 0-6-2.4-6-5.6 0-3.4 2.6-5 3.6-8.4 1.9 1.3 2.6 3 2.6 4.6 1-.6 1.6-1.6 1.8-2.8 1.9 1.6 4 3.8 4 6.6 0 3.2-2.4 5.6-6 5.6z" /></svg></span></div>
              <div className="xc-b"><h3>Stand Premium & Brasero</h3><p>Concept gourmand, bar, grande restauration, animations…</p><div className="xc-prix"><b>590 €</b><small>HT</small><span>les 3 jours</span></div>
              <ul><li>Emplacement 3 × 3 m</li><li>Accès électrique renforcé</li><li>Intégration dans un Reel dédié, avec les invités</li><li>Mise en avant prioritaire</li></ul>
              <a className="btn" href="#fexpo" onClick={() => setCat("Stand Premium, brasero")}>Réserver</a></div>
            </article>
        </div>

        <div className="xsecu">
          <div className="xsecu-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="2" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" /></svg></div>
          <h3>Un espace sécurisé et privé</h3>
          <ul><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.6" /></svg>Site entièrement fermé</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.6" /></svg>Surveillance vidéo</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.6" /></svg>Accès contrôlé</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.6" /></svg>Sécurité pendant tout l'événement</li></ul>
        </div>

        <Formulaire
          id="fexpo" className="xform" type="stand"
          champs={['nom', 'activite', 'tel', 'email', 'stand', 'categorie', 'message']}
          requis={['nom', 'tel']}
          erreur="Indiquez votre nom et votre téléphone."
          titreMerci="C'est noté"
          recap={v => `Merci ${v.nom} ! Demande reçue${v.stand ? ' pour le stand ' + v.stand : ''} (${v.categorie}). L’organisation vous rappelle au ${v.tel} pour confirmer votre emplacement, puis vous envoie la facture.`}
          bouton="Envoyer ma demande de stand"
          boutonClass="btn plein xcta"
        >
          <h3>Je réserve mon stand</h3>
          <p className="doux" style={{fontSize:'14px'}}>Choisissez votre stand sur le plan ou ici. L'organisation vous rappelle pour confirmer votre emplacement.</p>
          <div className="deux"><label>Nom et prénom<input id="ex-nom" name="nom" autoComplete="name" /></label><label>Nom de votre activité<input id="ex-ent" name="activite" autoComplete="organization" /></label></div>
          <div className="deux"><label>Téléphone<input id="ex-tel" name="tel" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="06 12 34 56 78" /></label><label>E-mail<input id="ex-mail" name="email" type="email" autoComplete="email" /></label></div>
          <label>Stand souhaité<select id="ex-stand" name="stand" value={standOk} onChange={e => setStand(e.target.value)}><option value="">Pas de préférence</option>{libres.map(n => <option key={n} value={String(n)}>Stand {n}</option>)}</select></label>
          <label>Catégorie<select id="ex-cat" name="categorie" value={cat} onChange={e => setCat(e.target.value)}><option value="Artisanat, créations">Artisanat, créations · 120 € HT</option><option value="Producteur, terroir">Producteur, terroir · 180 € HT</option><option value="Snacking, gourmandises">Snacking, gourmandises · 280 € HT</option><option value="Restauration, spécialités">Restauration, spécialités · 420 € HT</option><option value="Stand Premium, brasero">Stand Premium, brasero · 590 € HT</option><option>Je ne sais pas encore</option></select></label>
          <label>En une phrase<textarea id="ex-msg" name="message" placeholder="Bougies, couronnes, confitures…"></textarea></label>
        </Formulaire>
        <div className="lb" id="lb" hidden={!grand} onClick={() => setGrand(false)}><img id="lbi" src="/img/plan.jpg" alt="Plan du marché en grand" /></div>
      </div></section>
    </main>
  );
}
