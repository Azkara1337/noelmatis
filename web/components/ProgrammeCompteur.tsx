'use client';
import { useEffect, useState } from 'react';
import { PROGRAMME, PROGRAMME_REVELE } from '@/lib/config';

const CIBLE = Date.parse(PROGRAMME_REVELE);
const deux = (n: number) => String(n).padStart(2, '0');

/** Avant la date : compte à rebours. Après : le programme jour par jour (ou un message d'attente s'il n'est pas encore rempli). */
export default function ProgrammeCompteur() {
  // null tant que la page n'est pas chargée dans le navigateur (pas d'écart entre serveur et navigateur)
  const [reste, setReste] = useState<number | null>(null);
  useEffect(() => {
    const maj = () => setReste(Math.max(0, CIBLE - Date.now()));
    maj();
    const t = setInterval(maj, 1000);
    return () => clearInterval(t);
  }, []);

  if (reste === null) return <div className="prog-cpt carte" aria-hidden="true" style={{ minHeight: 150 }} />;

  if (reste > 0) {
    const s = Math.floor(reste / 1000);
    const cases: [number, string][] = [[Math.floor(s / 86400), 'jours'], [Math.floor(s / 3600) % 24, 'heures'], [Math.floor(s / 60) % 60, 'minutes'], [s % 60, 'secondes']];
    const date = new Date(CIBLE).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    return (
      <div className="prog-cpt carte" role="timer" aria-live="off">
        <p className="prog-cpt-k">Programme complet dévoilé le {date}</p>
        <div className="prog-cpt-g">{cases.map(([n, l]) => <div key={l}><b>{deux(n)}</b><span>{l}</span></div>)}</div>
      </div>
    );
  }

  if (!PROGRAMME.length) {
    return <div className="prog-cpt carte"><p className="prog-cpt-k">Le programme arrive dans quelques instants… revenez très vite !</p></div>;
  }

  return (
    <div className="prog-jours">
      {PROGRAMME.map(j => (
        <section key={j.jour} className="prog-jour carte">
          <h3>{j.jour}</h3>
          <ol>{j.moments.map((m, i) => <li key={i} className={m.heure ? '' : 'sans-h'}>{m.heure && <b>{m.heure}</b>}<span>{m.titre}{m.lieu && <small>{m.lieu}</small>}</span></li>)}</ol>
        </section>
      ))}
    </div>
  );
}
