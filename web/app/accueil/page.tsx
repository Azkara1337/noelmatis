import type { Metadata } from 'next';
import ScannerAccueil from '@/components/ScannerAccueil';

// Page réservée à l'accueil du marché (pas dans le menu, pas indexée) : scan des tickets repas.
export const metadata: Metadata = { title: 'Accueil · contrôle des tickets', robots: { index: false, follow: false } };

export default function Accueil() {
  return (
    <main className="page">
      <section id="accueil-scan"><div className="wrap"><ScannerAccueil /></div></section>
    </main>
  );
}
