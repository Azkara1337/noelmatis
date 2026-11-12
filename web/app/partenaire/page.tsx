import type { Metadata } from 'next';
import PagePartenaire from '@/components/PagePartenaire';

export const metadata: Metadata = { title: 'Devenir partenaire' };

export default function Partenaire() {
  return <PagePartenaire />;
}
