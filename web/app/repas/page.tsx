import type { Metadata } from 'next';
import ReservationRepas from '@/components/ReservationRepas';

export const metadata: Metadata = { title: 'Repas' };

export default function Repas() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 3v7a2 2 0 0 0 2 2v9M11 3v7a2 2 0 0 1-2 2M9 3v6M16.5 21V3c-2 1.5-3 4-3 7v3h3" /></svg></span><div className="pk-t"><h1>Réservez vos repas</h1><p>Ouvert à tous : vous réservez, vous recevez vos tickets, vous mangez au stand de votre choix</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section id="repas" style={{paddingTop:'0'}}><div className="wrap">
        <ReservationRepas />
        <div className="ticket"><span className="tk">1 ticket = 1 portion</span><span className="doux">au choix parmi nos stands</span></div>
        <div className="plats">
          <figure><img src="/img/f_aligot.jpg" alt="Aligot" /><figcaption>Aligot</figcaption></figure>
          <figure><img src="/img/f_cochon.jpg" alt="Cochon de lait" /><figcaption>Cochon de lait</figcaption></figure>
          <figure><img src="/img/f_coeur.jpg" alt="Cœur de canard" /><figcaption>Cœur de canard</figcaption></figure>
          <figure><img src="/img/f_magret.jpg" alt="Magret de canard" /><figcaption>Magret de canard</figcaption></figure>
          <figure className="autres"><b>…</b><figcaption>Et d'autres spécialités sur place</figcaption></figure>
        </div>
      </div></section>
    </main>
  );
}
