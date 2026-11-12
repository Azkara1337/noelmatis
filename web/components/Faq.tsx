'use client';
import { useState, type ReactNode } from 'react';

/** Une question de FAQ qui s'ouvre et se ferme. */
export default function Faq({ q, ouvert = false, children }: { q: string; ouvert?: boolean; children: ReactNode }) {
  const [on, setOn] = useState(ouvert);
  return (
    <div className={'q' + (on ? ' ouvert' : '')}>
      <button type="button" aria-expanded={on} onClick={() => setOn(!on)}>{q}<span>+</span></button>
      <p hidden={!on}>{children}</p>
    </div>
  );
}
