import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: { absolute: 'Marché de Noël · Accueil' } };

export default function Accueil() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg></span><div className="pk-t"><h1>Bienvenue dans la magie de Noël !</h1><p>Vendredi 18 et samedi 19 décembre 2026</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section className="pourtous"><div className="wrap">
        <div className="pt-card">
          <div className="pt-txt">
            <h2>Un Marché de Noël <em>pour tous</em></h2>
            <p>Artisans, producteurs, familles et gourmands réunis deux jours autour du partage et des talents locaux.</p>
          </div>
          <div className="pt-badge"><span>Des valeurs<br />qui nous<br />rassemblent</span></div>
          <ul className="pt-val">
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.5 3 5.2" /></svg><b>Rencontres et échanges</b></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12l4-4 4 2 3-2 7 5-4 4M7 8l-4 8 3 3M11 10l-2 3a1.6 1.6 0 0 0 2.6 1.8L14 12l3.5 3M10 17l1.5 1.5M12.5 15.5l2 2" /></svg><b>Soutien aux artisans locaux</b></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" /></svg><b>Partage et convivialité</b></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-12 14M5 19l7-7" /></svg><b>Produits du terroir</b></li>
            <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="7" cy="6" r="2.3" /><circle cx="17" cy="6" r="2.3" /><circle cx="12" cy="11" r="1.8" /><path d="M3.5 20v-5.5A3.5 3.5 0 0 1 7 11M20.5 20v-5.5A3.5 3.5 0 0 0 17 11M9.5 20v-3.5a2.5 2.5 0 0 1 5 0V20" /></svg><b>Un moment pour toute la famille</b></li>
          </ul>
        </div>

        <div id="animations" className="anim">
          <div className="xrubanw"><div className="xruban"><b>Un événement riche en animations</b></div></div>
          <div className="anim-g">
            <Link className="anim-c" href="/visite"><img src="/img/pn2.jpg" alt="Une enfant sur les genoux du Père Noël" loading="lazy" /><span>Le Père Noël<small>et son univers</small></span></Link>
            <Link className="anim-c" href="/visite"><img src="/img/salle.jpg" alt="Le château gonflable dans la salle chauffée" loading="lazy" /><span>Jeux gonflables<small>et espace enfants</small></span></Link>
            <Link className="anim-c" href="/repas"><img src="/img/resto.jpg" alt="Un cuisinier sert l'aligot à un stand du marché" loading="lazy" /><span>Restauration gourmande<small>aligot, brasero, spécialités…</small></span></Link>
            <Link className="anim-c" href="/stand"><img src="/img/arti.jpg" alt="Un stand d'artisanat du marché" loading="lazy" /><span>Artisans et créateurs<small>déco, cadeaux, idées originales…</small></span></Link>
          </div>
        </div>

        <div className="acc-cta">
          <Link className="cta c1" href="/repas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 8.5V6.5a1 1 0 0 1 1-1h16a1 1 0 0 1 1 1v2a3 3 0 0 0 0 6v2a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-2a3 3 0 0 0 0-6zM14.5 5.5v13" /></svg><span><b>Réserver mes repas</b></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
          <Link className="cta c2" href="/stand"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5L5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-4.5h4V20" /></svg><span><b>Réserver mon stand</b><small>exposant</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
          <Link className="cta c3" href="/partenaire"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12l4-4 4 2 3-2 7 5-4 4M7 8l-4 8 3 3M11 10l-2 3a1.6 1.6 0 0 0 2.6 1.8L14 12l3.5 3M10 17l1.5 1.5M12.5 15.5l2 2" /></svg><span><b>Devenir partenaire</b><small>entreprise</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
          <Link className="cta c4" href="/visite"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" /></svg><span><b>Découvrir le marché</b><small>visite 3D</small></span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
        </div>
        <p className="acc-sig">Le Marché de Noël de tout le monde !</p>
      </div></section>
    </main>
  );
}
