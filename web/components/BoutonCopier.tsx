'use client';
import type { CSSProperties, ReactNode } from 'react';
import { useToast } from './Toast';

/** Copie un texte dans le presse-papiers. Si le texte est vide, affiche `vide` à la place. */
export default function BoutonCopier({ texte, ok, vide, className = 'btn', style, children }: { texte: string; ok: string; vide?: string; className?: string; style?: CSSProperties; children: ReactNode }) {
  const { copier, toast } = useToast();
  return <button className={className} type="button" style={style} onClick={() => (texte ? copier(texte, ok) : toast(vide || ''))}>{children}</button>;
}
