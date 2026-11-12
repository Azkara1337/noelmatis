'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { VILLE } from '@/lib/config';

export const TITRES: Record<string, string> = { accueil: 'Accueil', programme: 'Programme', stand: 'Exposants', repas: 'Repas', invites: 'Invités', partenaire: 'Devenir partenaire', mur: 'Mur des partenaires', visite: 'Visite 3D', infos: 'Infos pratiques', 'mentions-legales': 'Mentions légales', confidentialite: 'Données personnelles', cgu: 'Conditions générales' };

// Anciennes adresses en « #page » (site d'une seule page) : on redirige vers la vraie page.
const ANCIENS: Record<string, string> = { programme: '/programme', stand: '/stand', exposants: '/stand', fexpo: '/stand#fexpo', repas: '/repas', invites: '/invites', partenaire: '/partenaire', offres: '/partenaire', contact: '/partenaire#contact', mur: '/mur', visite: '/visite', infos: '/infos', mentions: '/mentions-legales' };

export default function Entete() {
  const chemin = usePathname();
  const router = useRouter();
  const page = chemin.split('/')[1] || 'accueil';
  const [ouvert, setOuvert] = useState(false);

  useEffect(() => { document.body.style.overflow = ouvert ? 'hidden' : ''; }, [ouvert]);
  useEffect(() => {
    const h = location.hash.slice(1);
    if (chemin === '/' && ANCIENS[h]) router.replace(ANCIENS[h]);
  }, [chemin, router]);

  return (
    <>
      <div className="tete">
        <div className="tete-bg" style={{backgroundImage:'url(/img/d_hdr.webp)'}}></div>
        <button className="burger" type="button" aria-label="Ouvrir le menu" onClick={() => setOuvert(true)}><span></span><span></span><span></span></button>
        <Link className="tlogo" href="/"><span className="toit"></span><span className="l1">Marché</span><span className="l2">de <b>Noël</b></span><span className="ed">ÉDITION 2026</span></Link>
        <div className="badge-date"><div className="r1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M8 14h2M14 14h2M8 17h2" /></svg><b>Ven. 18 &amp; sam. 19<br />décembre 2026</b></div><div className="r2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg><span className="ville">{VILLE || 'Lieu dévoilé bientôt'}</span></div></div>
        <div className="neige"></div>
      </div>
      <div className="barre-menu"><div className="in">
        <button className="burger" type="button" aria-label="Ouvrir le menu" onClick={() => setOuvert(true)}><span></span><span></span><span></span></button>
        <span className="titre-p" id="titre-p">{TITRES[page] || ''}</span>
        <nav className="liens" aria-label="Pages du site"><Link href="/" className={page === 'accueil' ? 'on' : undefined}>Accueil</Link><Link href="/programme" className={page === 'programme' ? 'on' : undefined}>Programme</Link><Link href="/stand" className={page === 'stand' ? 'on' : undefined}>Exposants</Link><Link href="/repas" className={page === 'repas' ? 'on' : undefined}>Repas</Link><Link href="/invites" className={page === 'invites' ? 'on' : undefined}>Invités</Link><Link href="/partenaire" className={page === 'partenaire' ? 'on' : undefined}>Devenir partenaire</Link><Link href="/mur" className={page === 'mur' ? 'on' : undefined}>Mur des partenaires</Link><Link href="/visite" className={page === 'visite' ? 'on' : undefined}>Visite 3D</Link><Link href="/infos" className={page === 'infos' ? 'on' : undefined}>Infos pratiques</Link></nav>
        <Link className="cta" href="/repas">Réserver</Link>
      </div></div>
      <div className="tiroir" id="tiroir" hidden={!ouvert} onClick={e => { const t = e.target as HTMLElement; if (t.closest('a') || t.hasAttribute('data-close')) setOuvert(false); }}><nav className="pan" aria-label="Menu"><div className="tt">Marché de Noël</div><Link href="/" className={page === 'accueil' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 11l9-7 9 7M5 9.5V20h14V9.5M10 20v-5h4v5" /></svg>Accueil</Link><Link href="/programme" className={page === 'programme' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M12 12.2l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" /></svg>Programme</Link><Link href="/stand" className={page === 'stand' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9.5L5.5 4h13L20 9.5M4 9.5h16M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0M5.5 12v8h13v-8M10 20v-4.5h4V20" /></svg>Exposants</Link><Link href="/repas" className={page === 'repas' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-2 1.5-3 4-3 7v3h3" /></svg>Repas</Link><Link href="/invites" className={page === 'invites' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.5 3 5.2" /></svg>Invités</Link><Link href="/partenaire" className={page === 'partenaire' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12l4-4 4 2 3-2 7 5-4 4M7 8l-4 8 3 3M11 10l-2 3a1.6 1.6 0 0 0 2.6 1.8L14 12l3.5 3M10 17l1.5 1.5M12.5 15.5l2 2" /></svg>Devenir partenaire</Link><Link href="/mur" className={page === 'mur' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3 10h18M3 14.5h18M9 5v5M15 10v4.5M9 14.5V19" /></svg>Mur des partenaires</Link><Link href="/visite" className={page === 'visite' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></svg>Visite 3D</Link><Link href="/infos" className={page === 'infos' ? 'on' : undefined}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg>Infos pratiques</Link></nav><div className="voile" data-close=""></div></div>
    </>
  );
}
