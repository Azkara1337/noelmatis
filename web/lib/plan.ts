// Zones cliquables du plan (positions en % de l'image img/plan.jpg).
export type Pos = { left: string; top: string; width: string; height: string };
const p = (left: string, top: string, width: string, height: string): Pos => ({ left, top, width, height });

export const ZONES = [
  { id: 'pn', titre: "Père Noël", texte: "Photos avec le Père Noël, au chaud, dans sa maison.", lien: '/programme', libelle: "Voir les animations", pos: p('71.76%', '5.46%', '18.32%', '16.77%') },
  { id: 'salle', titre: "Salle chauffée", texte: "Château gonflable, jeux pour les enfants et coin pour se réchauffer.", lien: '/programme', libelle: "Voir les animations", pos: p('10.69%', '5.46%', '60.31%', '16.77%') },
  { id: 'wc', titre: "Toilettes", texte: "Toilettes accessibles pendant tout le marché.", lien: '', libelle: "", pos: p('13.44%', '23.01%', '25.95%', '18.33%') },
  { id: 'sapin', titre: "Grand sapin", texte: "La place centrale, le point de rendez-vous du marché.", lien: '', libelle: "", pos: p('54.20%', '30.42%', '20.61%', '16.77%') },
  { id: 'entree', titre: "Entrée", texte: "Arche d'entrée du marché, côté rue.", lien: '/infos', libelle: "Comment venir", pos: p('38.17%', '82.68%', '29.01%', '14.82%') },
  { id: 'pano', titre: "Panneaux partenaires", texte: "Le mur des partenaires : votre logo à l'entrée.", lien: '/partenaire', libelle: "Devenir partenaire", pos: p('68.70%', '95.55%', '30.53%', '3.74%') },
];

export const STANDS = [
  { n: 1, pos: p('18.32%', '80.66%', '14.05%', '5.93%') },
  { n: 2, pos: p('18.02%', '74.73%', '14.05%', '5.93%') },
  { n: 3, pos: p('17.71%', '68.95%', '14.05%', '5.93%') },
  { n: 4, pos: p('17.10%', '63.03%', '14.05%', '5.93%') },
  { n: 5, pos: p('16.49%', '57.41%', '14.05%', '5.93%') },
  { n: 6, pos: p('15.88%', '51.95%', '14.05%', '5.93%') },
  { n: 7, pos: p('15.57%', '45.55%', '14.05%', '5.93%') },
  { n: 8, pos: p('40.61%', '36.51%', '12.82%', '5.93%') },
  { n: 9, pos: p('40.61%', '30.73%', '12.82%', '5.93%') },
  { n: 10, pos: p('40.31%', '24.80%', '12.82%', '5.93%') },
  { n: 11, pos: p('73.89%', '24.49%', '12.82%', '5.93%') },
  { n: 12, pos: p('74.50%', '30.58%', '12.82%', '5.93%') },
  { n: 13, pos: p('74.81%', '36.35%', '12.82%', '5.93%') },
  { n: 14, pos: p('75.11%', '42.28%', '12.82%', '5.93%') },
  { n: 15, pos: p('75.73%', '48.36%', '12.82%', '5.93%') },
  { n: 16, pos: p('76.03%', '54.60%', '12.82%', '5.93%') },
  { n: 17, pos: p('76.03%', '60.53%', '12.82%', '5.93%') },
  { n: 18, pos: p('76.34%', '66.30%', '12.82%', '5.93%') },
  { n: 19, pos: p('76.64%', '72.07%', '12.82%', '5.93%') },
  { n: 20, pos: p('76.64%', '78.00%', '12.82%', '5.93%') },
  { n: 21, pos: p('53.13%', '74.57%', '12.82%', '5.93%') },
  { n: 22, pos: p('53.44%', '68.64%', '12.82%', '5.93%') },
  { n: 23, pos: p('53.44%', '62.87%', '12.82%', '5.93%') },
  { n: 24, pos: p('53.74%', '56.32%', '12.82%', '5.93%') },
  { n: 25, pos: p('53.44%', '50.08%', '12.82%', '5.93%') },
  { n: 26, pos: p('40.92%', '50.08%', '12.82%', '5.93%') },
  { n: 27, pos: p('40.61%', '56.32%', '12.82%', '5.93%') },
  { n: 28, pos: p('40.61%', '62.71%', '12.82%', '5.93%') },
  { n: 29, pos: p('40.92%', '68.64%', '12.82%', '5.93%') },
  { n: 30, pos: p('40.61%', '74.41%', '12.82%', '5.93%') },
];

// Stands déjà dessinés en rouge sur l'image du plan.
export const BAKED = [7, 11, 24, 25, 26, 27];
