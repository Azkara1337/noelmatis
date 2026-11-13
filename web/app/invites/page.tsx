import type { Metadata } from 'next';
import GrilleInvites, { StatsInvites } from '@/components/Invites';

export const metadata: Metadata = { title: 'Invités' };

export default function Invites() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.5 3 5.2" /></svg></span><div className="pk-t"><h1>Nos Invités &amp; Créateurs</h1><p>Ils seront présents au Marché de Noël !</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section className="inv2"><div className="wrap">
        <p className="tag-r">Des créateurs de contenu, artisans, passionnés et amoureux du terroir qui quittent les écrans pour venir à votre rencontre !</p>
        <StatsInvites />
        <GrilleInvites id="invg" />
        <div className="ruban"><b>Retrouvez-les en vrai au cœur du Marché de Noël !</b></div>
        <div className="inv-band"><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 20l1.2-4.5L16 4.7a2 2 0 0 1 2.8 2.8L8 18.3z" /><path d="M14 7l3 3" /></svg>Dédicaces</div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8h3l1.5-2.5h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>Photos<br />&amp; souvenirs</div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.5 6.5a3.5 3.5 0 0 0 4.6 4.6L21 13l-8 8-2-2M9.5 17.5L3 11l3-3 6.5 6.5M6 8L4 6" /></svg>Ateliers<br />&amp; démonstrations</div><div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 5h11v8H8l-4 3zM15 9h5v8l-3-2h-6v-2" /></svg>Échanges<br />&amp; rencontres</div></div>
      </div></section>
    </main>
  );
}
