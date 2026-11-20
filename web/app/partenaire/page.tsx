import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import PagePartenaire from '@/components/PagePartenaire';

export const metadata: Metadata = pageMeta('/partenaire/', 'Devenir partenaire', "Entreprises d'Ariège : soutenez le Marché de Noël de Pamiers (18-20 décembre 2026). Votre logo sur le mur des partenaires et sur le site, publications, photos et repas offerts.");

export default function Partenaire() {
  return <PagePartenaire />;
}
