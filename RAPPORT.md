# Rapport de travail effectué | secured workshop

## 1. Activités Obligatoires (8 points)

- **Page de login (Frontend) :** Création de la page `login.html` utilisant l'API `fetch()` pour envoyer les identifiants au format JSON vers le endpoint `/api/auth/login`.
- **Page d’inscription (Frontend) :** Création de la page `register.html` permettant de collecter et d'envoyer les données de création de compte vers `/api/auth/register`.
- **Hachage des mots de passe :** Intégration de la bibliothèque `bcrypt` dans `AuthController.js` pour ne stocker en base de données que l'empreinte cryptographique irréversible des mots de passe.
- **Ajout d'un sel (Salt) :** Géré automatiquement par `bcrypt` lors du hachage, ajoutant une chaîne aléatoire unique pour rendre les attaques par tables de correspondance (_rainbow tables_) inefficaces.
- **Ajout d'un poivre (Pepper) :** Concaténation d'une clé secrète globale (`process.env.PEPPER`), stockée hors de la base de données dans le fichier `.env`, à chaque mot de passe avant son hachage.
- **Prévention de l’injection SQL :** Sécurisation des interactions avec la base de données (notamment dans `AuthController.js`) en remplaçant les variables concaténées par des requêtes préparées et paramétrées via le joker `?`.
- **Implémentation d’un token JWT :** Génération d'un jeton d'accès signé cryptographiquement via `jwt.sign()` lors d'une authentification réussie pour maintenir l'état de session du client de manière décentralisée (_stateless_).
- **Gestion des rôles et protection de l’administration :** Inclusion du rôle (`user` ou `admin`) dans le payload du JWT et mise en place du middleware `authorizeRole('admin')` pour interdire l'accès à la route `/api/admin/users` aux utilisateurs non privilégiés.

## 2. Activités Faciles (6 points)

- **Mise en place du HTTPS :** Modification de `server.js` pour utiliser le module natif `https` de Node.js avec chargement d'un certificat (`cert.pem`) et d'une clé privée (`key.pem`) afin de chiffrer les flux réseaux en transit sur le port 8443.
- **Politique de mot de passe fort :** Implémentation d'une expression régulière (`passwordRegex`) lors de l'inscription pour joker tout mot de passe ne contenant pas au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
- **Limitation de la durée du JWT et Refresh Token :** Configuration d'une expiration courte de l'access token (1h) associée à un système de Refresh Token persistant (7 jours) avec rotation stricte (destruction et recréation du jeton à chaque usage).
- **Audit des dépendances NPM :** Exécution de la commande `npm audit` pour analyser l'arbre des modules tiers installés, confirmant l'absence totale de vulnérabilités connues dans le projet.
- **Vérification avec John The Ripper :** Test d'attaque par force brute et dictionnaire mené sur un export de la base de données, démontrant qu'aucun mot de passe n'a pu être cassé après 20 minutes d'exécution.
- **Gestion des exceptions (Masquage d'erreurs) :** Déploiement d'un middleware d'erreur centralisé à la fin de `server.js` qui intercepte les crashs, les enregistre côté serveur, mais renvoie un message opaque et générique au client pour éviter la fuite d'informations sur l'infrastructure.

## 3. Activités Moyennes (2 points)

- **Limitation des tentatives de login (Rate Limiting) :** Intégration du middleware `express-rate-limit` sur la route de connexion pour brider les requêtes à un maximum de 5 tentatives par minute par adresse IP, bloquant efficacement les attaques automatisées par force brute.
