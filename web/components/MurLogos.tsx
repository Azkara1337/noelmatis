'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ICONES } from './icones';
import { ENDPOINT, PARTENAIRES, type Partenaire } from '@/lib/config';

/**
 * Mur des partenaires : la liste vient de l'onglet « Logos » du Google Sheet (?action=partenaires).
 * Liste de base : PARTENAIRES de config.ts, complétée par l'onglet « Logos » du Sheet.
 */
export default function MurLogos() {
  const [liste, setListe] = useState<Partenaire[]>(PARTENAIRES);

  useEffect(() => {
    if (!ENDPOINT) return;
    fetch(ENDPOINT + '?action=partenaires')
      .then(r => r.json())
      .then(d => {
        if (!d || !Array.isArray(d.partenaires)) return;
        // Ceux du Sheet s'ajoutent à la liste de config.ts (sans doublon de nom).
        const noms = new Set(PARTENAIRES.map(p => p.nom.toLowerCase()));
        setListe([...PARTENAIRES, ...d.partenaires.filter((p: Partenaire) => !noms.has(p.nom.toLowerCase()))]);
      })
      .catch(() => {});
  }, []);

  // Au moins 12 cases, par lignes de 6, et toujours au moins une case libre.
  const cases = Math.max(12, Math.ceil((liste.length + 1) / 6) * 6);

  return (
    <>
      <div className="logos-g" id="logos">
        {liste.map(p => {
          const contenu = <>{p.logo ? <img src={p.logo} alt={p.nom} loading="lazy" /> : <><b>{p.nom}</b>{p.activite && <i>{p.activite}</i>}</>}{p.ville && <small>{p.ville}</small>}</>;
          return p.site
            ? <a key={p.nom} className="lg-c" href={p.site} target="_blank" rel="noopener">{contenu}</a>
            : <div key={p.nom} className="lg-c">{contenu}</div>;
        })}
        {Array.from({ length: cases - liste.length }, (_, i) => (
          <Link key={'vide' + i} className="lg-c vide" href="/partenaire">{ICONES.plus}<b>Votre logo ici</b><small>Devenir partenaire</small></Link>
        ))}
      </div>
      <div className="ruban"><b id="mur-merci">{liste.length >= 3 ? <>Merci à nos <em>{liste.length}</em> partenaires !</> : 'Merci à nos partenaires !'}</b><span>Leur engagement rend ce Marché de Noël possible et fait vivre notre territoire.</span></div>
    </>
  );
}
