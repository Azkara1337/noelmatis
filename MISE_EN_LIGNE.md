# Mise en ligne du site du Marché de Noël (vendredi 13 novembre)

Le site est un projet Next.js (`web/`) exporté en statique dans `web/out`. Pas de serveur, pas de base de données.
- **Hébergement :** Vercel, gratuit, branché sur GitHub (chaque push met le site en ligne), avec le nom de domaine relié dans Vercel.
- **Formulaires :** les 3 formulaires (stand, repas, partenaire) arrivent dans un **Google Sheet**.
  - Un e-mail part vers l'organisation à chaque demande.
  - Un e-mail de confirmation part vers la personne qui a rempli le formulaire.
- **Plan :** il lit l'onglet « Plan » du Sheet. Tu passes un stand en « réservé » dans le Sheet et il devient rouge sur le site, sans toucher au code.

---

## Mardi : le Google Sheet (10 min, à faire toi-même dans le navigateur)

Fais-le avec le compte Google de l'organisation, si possible. Sinon fais-le avec le tien, puis partage le Sheet avec Bertrand.

1. Crée un Google Sheet vide nommé « Marché de Noël · réservations ».
2. Ouvre **Extensions > Apps Script**, efface tout et colle le contenu de `google-apps-script/Code.gs`.
3. Ligne `const NOTIFIER = ''` : mets les adresses qui doivent recevoir les demandes, séparées par une virgule.
4. Enregistre (icône disquette).
5. Lance la fonction **installer** : choisis-la dans la liste du haut, puis clique sur **Exécuter**.
6. Google demande d'autoriser l'accès : Autoriser > Paramètres avancés > Accéder au projet.
   - ✅ **Ça a marché si** les onglets Stands, Repas, Partenaires et Plan apparaissent. Plan doit compter 30 lignes, avec 7, 11, 24, 25, 26 et 27 en « réservé ».
7. Ouvre **Déployer > Nouveau déploiement**, puis la roue dentée > **Application Web**.
   - « Exécuter en tant que » : **Moi**.
   - « Qui a accès » : **Tout le monde**.
   - Clique sur Déployer et copie l'URL qui finit par `/exec`.
   - ✅ **Ça a marché si** l'adresse `TON_URL/exec?action=plan`, ouverte dans le navigateur, affiche `{"pris":{"7":"Crêpes",...}}`.

## Mercredi : remplir les infos du site (Claude Code s'en charge)

Ouvre Claude Code dans ce dossier et donne-lui les infos ci-dessous (les réglages sont dans `web/lib/config.ts`). Il :
- règle ENDPOINT, ADRESSE, ORGANISATEUR, CONTACT_MAIL et PAIEMENT ;
- retire les étiquettes « à confirmer » ;
- teste l'envoi d'un formulaire vers le Sheet ;
- pousse le code sur GitHub : Vercel met le site en ligne.

**Infos à obtenir de Bertrand avant mercredi soir :**

| Info | Où elle s'affiche | Si tu ne l'as pas vendredi |
|---|---|---|
| Adresse exacte du marché | accueil, infos, pied de page | bloquant |
| Horaires du vendredi et du samedi | infos pratiques | mettre « 17 h - 22 h » seulement s'il te le confirme, sinon retirer la ligne |
| Nom, statut et adresse de l'organisateur + e-mail de contact | mentions légales (obligatoires) | bloquant |
| Paiement des repas : sur place, ou lien de paiement ? | sous le bouton des repas | garder « règlement au retrait des tickets » si Bertrand est d'accord |
| Chiffres d'audience (6 influenceurs, 12 M de vues, 400 000 abonnés) | bandeau exposants | **retirer le bandeau** plutôt que publier des chiffres non sourcés |
| Surveillance vidéo : oui ou non | bandeau sécurité | retirer la ligne |
| Créneaux de montage des exposants | FAQ infos | « on vous envoie les horaires d'installation par e-mail » |

## Jeudi : en ligne en privé, puis test

1. Vercel publie le site sur ton domaine (ou sur l’adresse `xxx.vercel.app` en attendant).
2. Sur ton téléphone, fais une vraie demande de stand en cliquant sur un stand libre du plan.
   - ✅ **Ça a marché si :**
     - la ligne apparaît dans l'onglet Stands ;
     - l'e-mail de notification arrive ;
     - l'e-mail de confirmation arrive dans ta boîte (pense à regarder les spams).
3. Dans l'onglet Plan, passe le stand 12 en « réservé » avec un nom, puis recharge le site.
   - ✅ **Ça a marché si** le stand 12 devient rouge, affiche « Réservé » et disparaît de la liste des stands.
4. Remets le stand 12 en « libre » et supprime ta ligne de test.

## Vendredi : sortie

1. Envoie le lien à Bertrand pour un dernier OK.
2. Publie-le en story, en bio et dans les groupes exposants.

**Nom de domaine (optionnel) :** `marchedenoel-xxx.fr` coûte environ 7 à 12 € par an chez OVH ou Gandi. Achète-le avant mercredi : le branchement dans Vercel prend jusqu’à 24 h. En attendant, l’adresse en `vercel.app` suffit.

## Au quotidien, pendant les ventes

- **Nouvelle demande de stand :**
  1. Rappelle l'exposant.
  2. Dans l'onglet Stands, mets « Suivi » à « Confirmé ».
  3. Dans l'onglet Plan, passe son stand en « réservé » avec son nom.
- **Modifier un texte ou un prix :** demande-le à Claude Code dans ce dossier (« change le prix du stand Producteur à 200 € et redéploie »).
- **Limite Gmail :** environ 100 e-mails envoyés par jour avec un compte gratuit. Au-delà, les demandes arrivent quand même dans le Sheet, mais les e-mails ne partent plus.
