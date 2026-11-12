import type { Metadata } from 'next';
import Visite3D from '@/components/Visite3D';

export const metadata: Metadata = { title: 'Visite 3D' };

export default function Visite() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /></svg></span><div className="pk-t"><h1>Visite 3D</h1><p>Faites le tour du marché avant de venir</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section id="visite"><div className="wrap">
          <div className="fenetre" style={{transform:'none'}}>
          <div className="barre"><i></i><i></i><i></i><span style={{marginLeft:'8px'}}>Visite 3D</span><em>En direct</em></div>
          <Visite3D />
        </div>
      </div></section>
    </main>
  );
}
