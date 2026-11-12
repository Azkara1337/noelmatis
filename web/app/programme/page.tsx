import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Programme' };

export default function Programme() {
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="2" /><path d="M3.5 10h17M8 3v4M16 3v4M12 12.2l1.1 2.2 2.4.3-1.8 1.7.5 2.4-2.2-1.2-2.2 1.2.5-2.4-1.8-1.7 2.4-.3z" /></svg></span><div className="pk-t"><h1>Programme Magique</h1><p>Spectacles, animations, invités : tout le programme du marché</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section className="prog"><div className="wrap">
        <div className="prog-scene" style={{backgroundImage:'url(/img/d_curtain.webp)'}}>
          <h2 className="prog-h">Un programme exceptionnel vous attend !</h2>
          <div className="ruban"><span>Le programme complet sera dévoilé <b>15 jours</b> avant l'événement !</span></div>
          <p className="prog-list">Spectacles, animations, rencontres, démonstrations, invités surprises, défis, jeux, dégustations, moments d'exception…</p>
          <p className="prog-script">Préparez-vous à vivre 2 jours de magie, de partage et d'émotions !</p>
          <div className="prog-stage">
            <div className="pola-col l"><figure className="pola"><img src="/img/x_prem.jpg" alt="Grillades au brasero" loading="lazy" /></figure><figure className="pola"><img src="/img/resto.jpg" alt="Aligot servi au stand" loading="lazy" /></figure><figure className="pola"><img src="/img/arti.jpg" alt="Stand d'artisanat" loading="lazy" /></figure></div>
            <img className="chest" src="/img/d_chest.webp" alt="Un coffre au trésor qui s'ouvre" />
            <div className="pola-col r"><figure className="pola"><img src="/img/d_santa.webp" alt="Le Père Noël garde le secret" loading="lazy" /></figure><figure className="pola"><img src="/img/salle.jpg" alt="Le château gonflable" loading="lazy" /></figure><figure className="pola"><img src="/img/d_crowd.webp" alt="Ambiance du marché" loading="lazy" /></figure></div>
          </div>
        </div>
        <ul className="prog-ic carte">
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 5c3 1 6 1 9 0v6a4.5 4.5 0 0 1-9 0zM12 9c3 1 6 1 9 0v6a4.5 4.5 0 0 1-9 0" /><path d="M5.5 9h1M8.5 9h1M7 12.5c.8.6 1.6.6 2.4 0M14.5 13h1M17.5 13h1M15 17c.9-.6 1.8-.6 2.6 0" /></svg> Spectacles<br />&amp; shows</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" /></svg> Animations<br />inédites</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="9" cy="8" r="3.2" /><path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5M16 5.2a3 3 0 0 1 0 5.6M18 14.8c1.8.7 3 2.5 3 5.2" /></svg> Invités<br />surprises</li>
          <li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 17h16M6 17a6 6 0 0 1 12 0M12 8v1M10 6.5h4M3 20h18" /></svg> Dégustations<br />gourmandes</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 21V4M5 4h12l-2 4 2 4H5" /><path d="M15 17l3 3 3-3" /></svg> Défis<br />&amp; jeux</li><li><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="8.5" width="17" height="4" rx="1" /><path d="M5 12.5V20h14v-7.5M12 8.5V20M12 8.5c-1.5-3-5-3.5-5-1.2C7 8.5 9.5 8.5 12 8.5zm0 0c1.5-3 5-3.5 5-1.2 0 1.2-2.5 1.2-5 1.2z" /></svg> Et bien d'autres<br />surprises !</li>
        </ul>
        <div className="ruban"><b>Restez connectés !</b><span>Le programme détaillé arrive très bientôt…</span></div>
      </div></section>
    </main>
  );
}
