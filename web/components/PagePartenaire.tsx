'use client';
import { useState } from 'react';
import Faq from './Faq';
import Formulaire from './Formulaire';
import { CREATEURS, PRIX_REPAS, VUES_MOIS } from '@/lib/config';
import { ICONES } from './icones';

const OFFRES = [{ n: 'Étoile de Noël', p: 200, r: 3 }, { n: 'Sapin Gourmand', p: 400, r: 6 }, { n: 'Maison du Père Noël', p: 1200, r: 20 }, { n: 'Partenaire Prestige', p: 2500, r: 40 }];
const fmt = (v: number) => v.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €';

export default function PagePartenaire() {
  const [sal, setSal] = useState(6);
  const [pack, setPack] = useState('Sapin Gourmand');
  // Offre conseillée : la plus petite qui couvre tous les salariés (sinon la plus grande).
  const conseil = OFFRES.find(o => o.r >= sal) || OFFRES[OFFRES.length - 1];
  return (
    <main className="page">
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M3 12l4-4 4 2 3-2 7 5-4 4M7 8l-4 8 3 3M11 10l-2 3a1.6 1.6 0 0 0 2.6 1.8L14 12l3.5 3M10 17l1.5 1.5M12.5 15.5l2 2" /></svg></span><div className="pk-t"><h1>Nos offres Partenaires</h1><p>Associez votre entreprise à un événement festif, convivial et populaire</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section id="offres" className="bande"><div className="wrap">
          {VUES_MOIS && <div className="audience carte">{ICONES.vues}<p><b>+{VUES_MOIS} de vues par mois</b>Nos {CREATEURS} créateurs invités présentent le marché et ses partenaires à leur communauté, avant, pendant et après l'événement.</p></div>}
          <div className="offres-l">
          <article className="ofl">
            <div className="ofl-img"><img src="/img/entree.jpg" alt="" loading="lazy" /></div>
            <div className="ofl-txt"><span className="ofl-k">Offre</span><h3>Étoile de Noël</h3><p className="ofl-acc">Une première visibilité au cœur du marché.</p><ul><li>Logo sur le mur des partenaires, à l'entrée</li><li>Votre entreprise et son logo sur le site du marché</li><li>Une publication de remerciement sur nos réseaux</li><li>5 photos offertes : votre équipe, la grillade, les enfants avec le Père Noël…</li></ul></div>
            <div className="ofl-prix"><span className="pill">200 € <small>HT</small></span><div className="ofl-rep"><b>3</b><span>repas offerts</span></div><a className="btn plein" href="#contact" onClick={() => setPack('Étoile de Noël')}>Choisir</a></div>
          </article>
          <article className="ofl">
            <div className="ofl-img"><img src="/img/sapin.jpg" alt="" loading="lazy" /></div>
            <div className="ofl-txt"><span className="ofl-k">Offre</span><h3>Sapin Gourmand</h3><p className="ofl-acc">Plus de visibilité, plus de contenus, plus de convivialité.</p><ul><li>Tout ce que comprend l'offre Étoile de Noël</li><li>10 photos avec le Père Noël</li><li>Votre entreprise mise en avant dans nos Reels</li><li>1 vidéo dédiée sur nos réseaux : votre entreprise et votre présence au marché</li></ul></div>
            <div className="ofl-prix"><span className="pill">400 € <small>HT</small></span><div className="ofl-rep"><b>6</b><span>repas offerts</span></div><a className="btn plein" href="#contact" onClick={() => setPack('Sapin Gourmand')}>Choisir</a></div>
          </article>
          <article className="ofl">
            <div className="ofl-img"><img src="/img/pn.jpg" alt="" loading="lazy" /></div>
            <div className="ofl-txt"><span className="ofl-k">Offre</span><h3>Maison du Père Noël</h3><p className="ofl-acc">Une expérience premium et une présence renforcée.</p><ul><li>Tout ce que comprend l'offre Sapin Gourmand</li><li>Votre nom et votre logo à l'honneur dans la Maison du Père Noël</li><li>Photos et vidéos professionnelles de votre équipe, remises pour votre communication</li><li>Accès à la soirée privée des partenaires et invités (dégustation, échanges), badge VIP</li></ul></div>
            <div className="ofl-prix"><span className="pill">1 200 € <small>HT</small></span><div className="ofl-rep"><b>20</b><span>repas offerts</span></div><a className="btn plein" href="#contact" onClick={() => setPack('Maison du Père Noël')}>Choisir</a></div>
          </article>
          <article className="ofl top">
            <div className="ofl-img"><img src="/img/prestige.jpg" alt="" loading="lazy" /></div>
            <div className="ofl-txt"><span className="ofl-k">Offre</span><h3>Partenaire Prestige</h3><p className="ofl-acc">L'offre d'exception : visibilité maximale et moment inoubliable.</p><ul><li>Tout ce que comprend l'offre Maison du Père Noël</li><li>Un événement privé sur mesure pour vous et vos invités : repas, animation, ambiance festive</li><li>Votre logo en grand à l'entrée, avec signalétique dédiée</li><li>3 Reels (avant, pendant, après), 1 story et 1 Reel principal sur nos réseaux</li><li>Un film de l'événement de 90 s, remis pour votre communication</li></ul></div>
            <div className="ofl-prix"><span className="pill">2 500 € <small>HT</small></span><div className="ofl-rep"><b>40</b><span>repas offerts</span></div><a className="btn" href="#contact" onClick={() => setPack('Partenaire Prestige')}>Choisir</a></div>
          </article>
        </div>
        <p className="ht doux">Prix hors taxes, pour les 3 jours. 1 repas offert = 1 ticket, valable pendant les 3 jours dans les stands de restauration du marché (valeur {fmt(PRIX_REPAS)} TTC).</p>

        <div className="calc" id="calcul" style={{marginTop:'48px'}}>
          <div>
            <label htmlFor="nb">Combien de salariés voulez-vous inviter ?</label>
            <div className="val" id="nbv">{sal}</div>
            <input id="nb" type="range" min="1" max="60" value={sal} onChange={e => setSal(+e.target.value)} />
            <p className="doux" style={{fontSize:'14px',marginTop:'14px'}}>Un repas par personne, à {fmt(PRIX_REPAS)} TTC l'unité si vous l'achetiez sur place.</p>
          </div>
          <div className="res" aria-live="polite"><span className="k">Offre conseillée</span><span className="p" id="rp">{conseil.n} · {fmt(conseil.p)} HT</span><span className="e" id="re">{conseil.r} repas offerts (valeur {fmt(conseil.r * PRIX_REPAS)} TTC), de quoi inviter {sal > 1 ? `vos ${Math.min(sal, conseil.r)} salariés` : 'votre salarié'}, avec les photos, les vidéos et la visibilité en plus.{sal > 40 ? ' Au-delà de 40 personnes, contactez-nous pour un devis.' : ''}</span></div>
        </div>

        <div className="duo" style={{marginTop:'56px'}}>
          <div>
            <h3 style={{fontSize:'26px',marginBottom:'12px'}}>Questions des entreprises</h3>
            <Faq q="Est-ce déductible pour mon entreprise ?" ouvert>Il s'agit de parrainage : une dépense de publicité avec une contrepartie (logo, vidéo, mise en avant). Ce type de dépense est en principe déductible du résultat de l'entreprise. Faites valider votre cas par votre expert-comptable.</Faq>
            <Faq q="Quand sont faites les vidéos ?">La vidéo dédiée est tournée avant le marché, chez vous, en une heure environ. Les photos et le film sont faits pendant le marché.</Faq>
            <Faq q="Comment fonctionnent les repas ?">Vous recevez un ticket par repas offert, à distribuer à vos salariés. 1 ticket = 1 portion, dans n'importe quel stand de restauration du marché, pendant les 3 jours.</Faq>
            <Faq q="Quand envoyer mon logo ?">Avant le 1er décembre, pour l'impression du mur et des panneaux.</Faq>
          </div>
          <Formulaire
            id="contact" type="partenaire"
            champs={['entreprise', 'nom', 'tel', 'email', 'salaries', 'offre', 'code_promo', 'message']}
            requis={['entreprise', 'tel']}
            erreur="Indiquez au moins le nom de l'entreprise et un téléphone."
            titreMerci="Demande prête"
            recap={v => `Merci ! Demande « ${v.offre} » reçue pour ${v.entreprise}. On vous rappelle sous 48 h au ${v.tel}.`}
            bouton="Envoyer ma demande"
          >
            <h3>Je deviens partenaire du Marché de Noël</h3>
            <p className="doux" style={{fontSize:'14px'}}>On vous rappelle sous 48 h pour valider votre offre.</p>
            <div className="deux"><label>Entreprise<input id="pa-ent" name="entreprise" autoComplete="organization" /></label><label>Nom<input id="pa-nom" name="nom" autoComplete="name" /></label></div>
            <div className="deux"><label>Téléphone<input id="pa-tel" name="tel" type="tel" inputMode="tel" autoComplete="tel" maxLength={20} placeholder="06 12 34 56 78" /></label><label>E-mail<input id="pa-mail" name="email" type="email" autoComplete="email" /></label></div>
            <label>Salariés à inviter<input id="pa-sal" name="salaries" type="number" min="1" inputMode="numeric" /></label>
            <label>Offre<select id="pack" name="offre" value={pack} onChange={e => setPack(e.target.value)}><option value="Sapin Gourmand">Sapin Gourmand · 400 € HT</option><option value="Étoile de Noël">Étoile de Noël · 200 € HT</option><option value="Maison du Père Noël">Maison du Père Noël · 1 200 € HT</option><option value="Partenaire Prestige">Partenaire Prestige · 2 500 € HT</option><option>Je ne sais pas encore</option></select></label>
            <label><span>Code promo <small className="facultatif">(facultatif)</small></span><input name="code_promo" autoComplete="off" autoCapitalize="characters" spellCheck={false} maxLength={30} placeholder="Ex. NOEL2026" /></label>
            <label>Message<textarea id="pa-msg" name="message" placeholder="Votre activité, vos questions…"></textarea></label>
          </Formulaire>
        </div>
      </div></section>
    </main>
  );
}
