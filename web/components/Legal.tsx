import Link from 'next/link';
import type { ReactNode } from 'react';
import { MAJ_LEGAL } from '@/lib/config';

/** Valeur issue de config.ts, ou étiquette « à compléter » si elle est vide. */
export function Champ({ v, label = 'à compléter' }: { v?: string; label?: string }) {
  return v ? <>{v}</> : <span className="tbc">{label}</span>;
}

/** Gabarit commun des pages Mentions légales, Confidentialité et CGU. */
export default function PageLegale({ titre, sous, children }: { titre: string; sous: string; children: ReactNode }) {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><div className="pk-t"><h1>{titre}</h1><p>{sous}</p></div></div><span className="pk-lant" aria-hidden="true"></span></div>
      <section className="legal" style={{ paddingTop: 0 }}><div className="wrap">
        <article className="legal-c carte">
          {children}
          <p className="legal-maj">Dernière mise à jour : {MAJ_LEGAL}.</p>
        </article>
        <nav className="legal-nav" aria-label="Pages légales">
          <Link href="/mentions-legales/">Mentions légales</Link>
          <Link href="/confidentialite/">Données personnelles</Link>
          <Link href="/cgu/">Conditions générales</Link>
        </nav>
      </div></section>
    </main>
  );
}
