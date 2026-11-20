import type { Metadata } from 'next';
import { PagePaiement } from '@/components/Paiement';

// Retour de Stripe après un paiement (repas, stand, partenaire) : vérification et suite.
export const metadata: Metadata = { title: 'Paiement', robots: { index: false, follow: false } };

export default function Paiement() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="2" /><path d="M3 10h18M7 15h4" /></svg></span><div className="pk-t"><h1>Paiement</h1><p>Paiement sécurisé par Stripe</p></div></div><span className="pk-lant" aria-hidden="true"></span></div>
      <section id="paiement"><div className="wrap"><PagePaiement /></div></section>
    </main>
  );
}
