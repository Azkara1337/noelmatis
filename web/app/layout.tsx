import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import Entete from '@/components/Entete';
import { ToastProvider } from '@/components/Toast';
import Link from 'next/link';
import { ADRESSE, SITE_URL, TELEPHONE } from '@/lib/config';

export const metadata: Metadata = {
  title: { default: 'Marché de Noël des Artisans & Commerçants', template: 'Marché de Noël · %s' },
  description: "Marché de Noël du 18 au 20 décembre 2026 : 30 stands d'artisans, producteurs et restauration, le Père Noël, château gonflable, salle chauffée. Réservez vos repas, votre stand ou devenez partenaire.",
  openGraph: {
    type: 'website',
    title: 'Marché de Noël des Artisans & Commerçants · du 18 au 20 décembre 2026',
    description: '30 stands, le Père Noël, des jeux pour les enfants et de quoi se régaler. Réservez vos repas ou votre stand.',
    images: [`${SITE_URL}/img/poster.jpg`],
  },
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='14' fill='%23d63f2b'/%3E%3Cpath d='M32 10l5 15h16l-13 9 5 16-13-10-13 10 5-16-13-9h16z' fill='%23fff'/%3E%3C/svg%3E",
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#b3231b',
};

const aCompleter = <span className="tbc">à compléter</span>;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600;700&family=Barlow+Condensed:ital,wght@0,600;0,700;0,800;1,600&family=Kaushan+Script&family=Lobster&family=Playfair+Display:ital,wght@1,700&family=Montserrat:wght@500;600;700;800;900&display=swap" rel="stylesheet" />
      </head>
      <body>
        <ToastProvider>
          <Entete />
          {children}
          <div className="pied-deco" aria-hidden="true"><div className="neige2"></div><span className="cad g"></span><span className="cad d"></span></div>
          <footer>
            <div className="wrap"><span>Marché de Noël · du 18 au 20 décembre 2026</span><span className="adr-txt">{ADRESSE || <>Adresse {aCompleter}</>}</span><span>{TELEPHONE}</span></div>
            <nav className="wrap liens-legaux" aria-label="Informations légales"><Link href="/mentions-legales/">Mentions légales</Link><Link href="/confidentialite/">Données personnelles</Link><Link href="/cgu/">Conditions générales</Link></nav>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
