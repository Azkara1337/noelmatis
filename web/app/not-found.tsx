import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Page introuvable', robots: { index: false, follow: true } };

// Page 404, aux couleurs du site.
export default function PageIntrouvable() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.4 6.8 19.1l1-5.8-4.3-4.1 5.9-.9z" /></svg></span><div className="pk-t"><h1>Page introuvable</h1><p>Cette page s’est perdue dans la neige…</p></div></div><span className="pk-lant" aria-hidden="true"></span></div>
      <section id="introuvable"><div className="wrap">
        <div className="paie-carte carte p404">
          <span className="p404-n" aria-hidden="true">4<span>❄</span>4</span>
          <h2>Oups, cette page n’existe pas</h2>
          <p>Le lien est peut-être incomplet, ou la page a changé d’adresse. Tout le reste du marché vous attend !</p>
          <div className="paie-btns">
            <Link className="btn plein" href="/">Retour à l’accueil</Link>
            <Link className="btn" href="/repas/">Réserver mes repas</Link>
            <Link className="btn" href="/stand/">Réserver un stand</Link>
            <Link className="btn" href="/programme/">Voir le programme</Link>
          </div>
        </div>
      </div></section>
    </main>
  );
}
