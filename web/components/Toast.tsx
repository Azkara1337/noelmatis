'use client';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';

type Ctx = { toast: (t: string) => void; copier: (txt: string, ok: string) => void };
const ToastCtx = createContext<Ctx>({ toast: () => {}, copier: () => {} });
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [texte, setTexte] = useState('');
  const [on, setOn] = useState(false);
  const minuteur = useRef<ReturnType<typeof setTimeout>>(undefined);
  const toast = useCallback((t: string) => {
    setTexte(t); setOn(true);
    clearTimeout(minuteur.current);
    minuteur.current = setTimeout(() => setOn(false), 1800);
  }, []);
  const copier = useCallback(async (txt: string, ok: string) => {
    try { await navigator.clipboard.writeText(txt); toast(ok); } catch { toast(txt); }
  }, [toast]);
  return (
    <ToastCtx.Provider value={{ toast, copier }}>
      {children}
      <div className={'toast' + (on ? ' on' : '')} role="status">{texte}</div>
    </ToastCtx.Provider>
  );
}
