import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import PageStand from '@/components/PageStand';

export const metadata: Metadata = pageMeta('/stand/', 'Exposants : réserver un stand', "Artisans, producteurs, restaurateurs : exposez au Marché de Noël de Pamiers du 18 au 20 décembre 2026. Choisissez votre stand sur le plan, l'organisation vous rappelle pour confirmer l'emplacement.");

export default function Stand() {
  return <PageStand />;
}
