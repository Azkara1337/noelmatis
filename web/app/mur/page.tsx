import type { Metadata } from 'next';
import Link from 'next/link';
import MurLogos from '@/components/MurLogos';

export const metadata: Metadata = { title: 'Mur des partenaires' };

export default function Mur() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12l4-4 4 2 3-2 7 5-4 4M7 8l-4 8 3 3M11 10l-2 3a1.6 1.6 0 0 0 2.6 1.8L14 12l3.5 3M10 17l1.5 1.5M12.5 15.5l2 2" /></svg></span><div className="pk-t"><h1>Le Mur des Partenaires</h1><p>Merci à toutes les entreprises qui soutiennent et font vivre le Marché de Noël !</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section className="mur2"><div className="wrap">
        <div className="val4 carte">
          <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.4-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.6-7.5 10-7.5 10z" /></svg><span>Des acteurs<br />locaux engagés</span></div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 21s-6.5-6-6.5-11a6.5 6.5 0 0 1 13 0c0 5-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /></svg><span>Des entreprises<br />de la région</span></div>
          <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.5 3 5.2" /></svg><span>Des entreprises<br />de toutes tailles</span></div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 19c0-8 5-13 14-14 0 9-5 14-12 14M5 19l7-7" /></svg><span>Un développement<br />local et durable</span></div>
        </div>
        <MurLogos />
        <p style={{textAlign:'center'}}><Link className="btn plein" href="/partenaire">Votre logo sur ce mur : devenir partenaire</Link></p>
      </div></section>
    </main>
  );
}
