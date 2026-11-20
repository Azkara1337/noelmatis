import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-static';

/** Plan du site pour Google (/sitemap.xml). Les pages /accueil et /paiement en sont exclues (noindex). */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: [string, number][] = [['', 1], ['repas/', 0.9], ['stand/', 0.9], ['programme/', 0.8], ['infos/', 0.8], ['partenaire/', 0.7], ['invites/', 0.7], ['visite/', 0.6], ['mur/', 0.5], ['mentions-legales/', 0.1], ['confidentialite/', 0.1], ['cgu/', 0.1]];
  return pages.map(([p, priority]) => ({ url: `${SITE_URL}/${p}`, lastModified: new Date(), changeFrequency: 'weekly', priority }));
}
