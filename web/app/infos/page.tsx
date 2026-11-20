import type { Metadata } from 'next';
import { jsonLd, pageMeta } from '@/lib/seo';
import Link from 'next/link';
import BoutonCopier from '@/components/BoutonCopier';
import Faq from '@/components/Faq';
import { ADRESSE, TELEPHONE, TELEPHONE_LIEN } from '@/lib/config';

export const metadata: Metadata = pageMeta('/infos/', 'Infos pratiques : horaires, adresse, accès', 'Horaires et adresse du Marché de Noël de Pamiers : vendredi 18 décembre 14 h-20 h, samedi 19 10 h-20 h, dimanche 20 10 h-18 h, 10 B rue Jean Rostand, 09100 Pamiers. Questions fréquentes.');

const FAQ: [string, string][] = [
  ['Comment entrer au marché ?', 'Chaque repas réservé comprend une entrée : 1 repas = 1 entrée. Réservez vos repas sur ce site, puis présentez votre QR code à l’accueil.'],
  ['Y a-t-il un endroit au chaud ?', 'Oui : la salle chauffée, avec le château gonflable et le Père Noël.'],
  ['Peut-on manger sur place ?', "Oui : crêpes, churros, aligot, brasero, vin chaud et d'autres stands."],
  ["Exposant : quand s'installer ?", 'Installation le vendredi matin, de 8 h à 11 h. Ouverture au public à 14 h.'],
];
const FAQ_JSONLD = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: FAQ.map(([q, r]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: r } })) };

export default function Infos() {
  return (
    <main className="page">
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(FAQ_JSONLD)} />
      <div className="plank"><div className="plank-b"><span className="pk-ic"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M12 11v6M12 7.5v.5" /></svg></span><div className="pk-t"><h1>Infos pratiques</h1><p>Dates, adresse, contact : tout pour venir</p></div></div><span className="pk-lant" aria-hidden="true"></span></div><section id="infos"><div className="wrap">
          <div className="args trois">
          <div className="arg"><div className="in"><small className="k">Quand</small><h3>Du ven. 18 au dim. 20 déc.</h3><p className="doux">Vendredi de 14 h à 20 h, samedi de 10 h à 20 h, dimanche de 10 h à 18 h.</p><p className="entree-libre">1 repas réservé = 1 entrée au marché</p></div></div>
          <div className="arg"><div className="in"><small className="k">Où</small><h3 className="adr-txt">{ADRESSE || <>Adresse <span className="tbc">à compléter</span></>}</h3><div><BoutonCopier className="btn copier-adr" texte={ADRESSE} ok="Adresse copiée" vide="Adresse pas encore renseignée" style={{padding:'8px 14px',fontSize:'13px'}}>Copier l'adresse</BoutonCopier></div></div></div>
          <div className="arg"><div className="in"><small className="k">Contact</small><h3>{TELEPHONE}</h3><div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}><a className="btn plein" href={TELEPHONE_LIEN} style={{padding:'8px 14px',fontSize:'13px'}}>Appeler</a><BoutonCopier texte={TELEPHONE} ok="Numéro copié" style={{padding:'8px 14px',fontSize:'13px'}}>Copier le numéro</BoutonCopier></div></div></div>
        </div>
        <div style={{maxWidth:'760px',marginTop:'32px'}}>
          {FAQ.map(([q, r]) => <Faq key={q} q={q}>{r}</Faq>)}
        </div>
      </div></section><section style={{paddingTop:'0'}}><div className="wrap">
        <div className="final"><h2>On vous attend du 18 au 20 décembre.</h2><div style={{display:'flex',gap:'10px',flexWrap:'wrap'}}><Link className="btn blanc" href="/stand">Exposer</Link><Link className="btn blanc" href="/partenaire">Je deviens partenaire</Link></div></div>
      </div></section>
    </main>
  );
}
