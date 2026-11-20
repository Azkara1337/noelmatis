import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

export const dynamic = 'force-static';

/** /robots.txt : tout est indexable sauf le scanner de l'accueil et la page de retour de paiement. */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/accueil/', '/paiement/'] }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL };
}
