'use client';
import { useEffect, useRef, useState } from 'react';

/** La visite 3D (public/visite3d/index.html, 1,3 Mo) ne se charge que quand le cadre arrive à l'écran, ou au clic. */
export default function Visite3D() {
  const box = useRef<HTMLDivElement>(null);
  const [charge, setCharge] = useState(false);
  useEffect(() => {
    if (charge || !box.current) return;
    const o = new IntersectionObserver(e => { if (e[0].isIntersecting) { setCharge(true); o.disconnect(); } }, { rootMargin: '200px' });
    o.observe(box.current);
    return () => o.disconnect();
  }, [charge]);
  return (
    <div className="v3d" id="v3d" ref={box}>
      {charge
        ? <iframe title="Maquette 3D du marché" src="/visite3d/index.html" allowFullScreen />
        : <><img src="/img/poster.jpg" alt="Aperçu de la maquette 3D du marché" /><button className="go" id="go3d" type="button" onClick={() => setCharge(true)}><span>Lancer la visite 3D</span></button></>}
    </div>
  );
}
