# Site du Marché de Noël — contexte pour Claude Code

## Le projet
Site du Marché de Noël des Artisans & Commerçants, **vendredi 18, samedi 19 et dimanche 20 décembre 2026** (vendredi 14 h-20 h, samedi 10 h-20 h, dimanche 10 h-18 h). 30 stands : 6 sont déjà pris, 24 sont à pourvoir.
- Matis (SAVE, vidéaste) gère le site pour l'organisation. Le contact côté organisation est Bertrand.
- Réponds à Matis en français, en le tutoyant, directement, et termine par les actions à faire.

## Fichiers (version Next.js du 12/11, dans `web/`)
- `web/lib/config.ts` : **tous les réglages** (voir ci-dessous). C'est le seul fichier à remplir.
- `web/app/` : une route par page (`/`, `/programme`, `/stand`, `/repas`, `/invites`, `/partenaire`, `/mur`, `/visite`, `/infos`). `layout.tsx` = en-tête, menu, pied de page et mentions légales. `globals.css` = le CSS d'origine, inchangé.
- `web/components/` : les parties interactives (`PageStand` = plan cliquable + formulaire exposant, `PagePartenaire`, `ReservationRepas`, `Formulaire` = envoi vers le Sheet, `Entete` = menu, `Visite3D`).
- `web/lib/plan.ts` : positions des 30 stands et des zones sur `plan.jpg`.
- `web/public/img/` : les photos (`invites/` pour les invités). `web/public/visite3d/index.html` : la visite 3D (three.js), chargée en iframe sur `/visite`.
- `google-apps-script/Code.gs` : à coller dans Apps Script, dans le Google Sheet des réservations. Il reçoit les formulaires (doPost), sert le statut des stands (doGet ?action=plan) et envoie les e-mails.
- `assets/` : photos originales en pleine qualité (le site utilise les copies de `web/public/img/`). `maquettes/` : maquettes JPG du client, référence de style. Aucun des deux n'est utilisé par le build.
- `MISE_EN_LIGNE.md` : la procédure complète. Lis-la avant d'agir.

## Réglages (`web/lib/config.ts`)
```ts
ADRESSE = ''          // adresse du marché, copiable par le bouton
VILLE = ''            // ville du badge des dates
PRIX_REPAS = 20       // € TTC le repas
TELEPHONE = '05 34 03 24 40'
DEJA = {...}          // stands déjà pris (secours si le Sheet ne répond pas)
ENDPOINT = ''         // URL /exec de l'Apps Script. Vide = les formulaires affichent une erreur (plus de mode maquette)
ORGANISATEUR = ''     // mentions légales : nom, statut, adresse de l'organisateur
CONTACT_MAIL = ''     // e-mail pour les données personnelles
PAIEMENT = '...'      // texte sous le bouton de réservation des repas
SITE_URL = 'https://ADRESSE-DU-SITE'   // pour og:image, à remplacer après la mise en ligne
PARTENAIRES = []      // secours seulement : les vrais partenaires se gèrent dans l'onglet « Logos » du Google Sheet (doGet ?action=partenaires)
INVITES = [...]       // n = abonnés affichés, url = lien du compte ; n vide = rien n'est affiché
```
Les étiquettes `<span className="tbc">…</span>` signalent les infos à confirmer. Avant la mise en ligne :
- remplace chaque étiquette par l'info confirmée ;
- ou retire l'élément qui la porte, quand Matis le demande.

## Règles à respecter
- **Aucune marque d'entreprise sur l'événement :** jamais « RC IMMO » ni « BATICLICK » (c'est « l'événement de tout le monde »). Seule exception : RC IMMO apparaît dans les pages légales (`/mentions-legales`, `/confidentialite`, `/cgu`) parce que c'est l'organisateur, et la loi impose de le nommer.
- **Paiements :** le site ne gère aucun paiement. Chaque demande arrive dans le Google Sheet, avec une notification par e-mail, et la secrétaire envoie la facture (paiement par virement). Pas de Stripe.
- **Dates :** du 18 au 20 décembre 2026 (dimanche ajouté par l'organisation le 12/11). Ne les change pas sans un message explicite de Matis.
- **Stands :** l'exposant indique un stand souhaité, et l'organisation le confirme par téléphone. Le texte ne doit jamais dire que le stand est réservé dès l'envoi du formulaire.
- **Chiffres :** n'invente aucun chiffre (audience, fréquentation). S'il n'a pas de source, retire-le. Sources actuelles : abonnés relevés sur les profils publics le 12/11/2026 (`INVITES`) ; « +25 millions de vues par mois » donné par l'organisation (`VUES_MOIS`).
- **Formulaires :**
  - le champ caché `.hp` est un anti-spam, ne le supprime pas ;
  - l'envoi se fait en `fetch(ENDPOINT, {mode:'no-cors', body: JSON})`, sans en-tête personnalisé : c'est voulu, pour qu'Apps Script accepte la requête.
- **Mobile :** à 390 px de large, la page ne doit pas défiler horizontalement.

## Déploiement (Vercel, via GitHub). Jamais Netlify.
- Le dépôt GitHub contient tout le dossier du projet. Sur Vercel, **Root Directory = `web`**, et Vercel détecte Next.js tout seul.
- Chaque push sur `main` met le site en ligne, et chaque autre branche donne un aperçu.
- Le site reste statique (`output: 'export'`) : pas de serveur ni de variables d'environnement.
- Le nom de domaine se branche dans Vercel : Project > Settings > Domains.
- Après la mise en ligne, remplace `SITE_URL` dans `web/lib/config.ts` par le vrai domaine, puis pousse.
- Ne lance jamais `npm run build` pendant que `npm run dev` tourne : ça casse le serveur de dev (erreur `Cannot find module`). Pour vérifier les types, utilise plutôt `npx tsc --noEmit`.

**Pièges connus :**
- Vercel publie les fichiers `.html` de `public/` sans l'extension (`/x.html` répond 404, `/x/` répond). Range une page HTML dans un dossier (`public/x/index.html`) et appelle `/x/index.html`.
- TypeScript doit rester en version 5 (Next 15 ne lit pas TypeScript 7 et ignore alors les alias `@/`).
- Le cache npm de la machine a des fichiers appartenant à root : lance npm avec `npm_config_cache=$TMPDIR/npm-cache`.

## Tests à faire après chaque modification
1. **Plan :** ouvre `/stand`, clique sur un stand libre, puis sur « Réserver ce stand ».
   - Ça a marché si le formulaire exposant s'affiche avec ce stand déjà choisi.
2. **Statut des stands :** `curl -sL "$ENDPOINT?action=plan"`.
   - Ça a marché si la réponse est du JSON qui contient `"pris"`.
3. **Envoi d'un formulaire :**
   ```bash
   curl -sL -H 'Content-Type: text/plain;charset=utf-8' -d '{"type":"stand","nom":"TEST CLAUDE","tel":"0600000000","email":"","stand":"","categorie":"Test","message":"à supprimer"}' "$ENDPOINT"
   ```
   - Ça a marché si la réponse contient `{"ok":true}` et que la ligne apparaît dans l'onglet Stands.
   - Ensuite, demande à Matis de supprimer cette ligne de test.

## Site en plusieurs pages
- Une route Next.js par page. Les anciennes adresses en `#xxx` (ex. `/#repas`) redirigent vers la bonne page (`components/Entete.tsx`).
- Le style reprend les maquettes du client : bannières en bois, rubans rouges, cartes crème. Ne change pas ce style sans demande.
- N'ajoute jamais de logo de marque ni de chiffre d'audience que Matis n'a pas confirmé.
