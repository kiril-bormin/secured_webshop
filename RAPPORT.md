# Rapport de Projet : Sécurité d'une Application Web Multi-tiers

**Étudiant :** Kiril Bormin  
**Classe :** CID2B  
**Nom du Projet :** P_183 : Sécurité des applications

---

## Introduction

Ce projet consiste à développer et sécuriser une application web de bout en bout. L'objectif principal est de mettre en place des protections efficaces contre les failles de sécurité les plus courantes (le Top 10 de l'OWASP). Ces protections s'appliquent sur la partie visible par l'utilisateur (Frontend), sur le serveur (Backend Node.js) et sur la base de données.

---

## 1. Activités Obligatoires (8 points)

- **Page de connexion (Frontend) :** Création de la page `login.html`. Elle utilise la fonction `fetch()` pour envoyer les identifiants au format JSON vers l'adresse `/api/auth/login`.
- **Page d’inscription (Frontend) :** Création de la page `register.html` pour récupérer les données de création de compte et les envoyer vers `/api/auth/register`.
- **Hachage des mots de passe :** Utilisation de la bibliothèque `bcrypt` dans le fichier `AuthController.js`. Cela permet de ne pas stocker les mots de passe en clair, mais uniquement leur empreinte de sécurité (impossible à inverser).
- **Ajout d'un sel (Salt) :** Cette option est gérée automatiquement par `bcrypt` pendant le hachage. Elle ajoute une chaîne de caractères aléatoire unique à chaque mot de passe, ce qui rend les attaques par dictionnaires de mots de passe (_rainbow tables_) inefficaces.
- **Ajout d'un poivre (Pepper) :** Liaison d'une clé secrète globale (`process.env.PEPPER`) à chaque mot de passe avant de le hacher. Cette clé est stockée de manière sécurisée dans le fichier `.env`, en dehors de la base de données.
  - **Difficulté :** Au début, les connexions échouaient car le système ne trouvait pas la clé (`undefined`).
  - **Solution :** J'ai déplacé la ligne `dotenv.config()` tout au début du fichier `server.js` pour charger les variables d'environnement avant d'appeler les contrôleurs.
- **Prévention de l’injection SQL :** Sécurisation des accès à la base de données dans `AuthController.js`. J'ai remplacé les variables collées directement dans le texte par des requêtes préparées avec le symbole `?`.
- **Implémentation d’un token JWT :** Génération d'un jeton d'accès sécurisé avec `jwt.sign()` après une bonne connexion. Ce jeton permet de garder l'utilisateur connecté sans surcharger le serveur (_stateless_).
- **Gestion des rôles et protection de l’administration :** Ajout du rôle (`user` ou `admin`) dans le jeton JWT. J'ai ensuite créé une sécurité (`authorizeRole('admin')`) pour bloquer l'accès à la route `/api/admin/users` aux utilisateurs simples.

---

## 2. Activités Faciles (6 points)

- **Mise en place du HTTPS :** Modification de `server.js` pour utiliser le module `https` de Node.js. J'ai chargé un certificat (`cert.pem`) et une clé privée (`key.pem`) pour chiffrer les données qui passent sur le réseau via le port 8443.
  - **Difficulté :** Le navigateur bloquait les requêtes du Frontend vers le Backend à cause du certificat fait maison (auto-signé).
  - **Solution :** J'ai ajouté une exception de sécurité permanente dans mon navigateur pour `localhost:8443` afin de pouvoir travailler tranquillement en local.
- **Politique de mot de passe fort :** Utilisation d'une règle de validation (`passwordRegex`) lors de l'inscription. Elle vérifie que le mot de passe contient au moins 8 caractères, une majuscule, une minuscule, un chiffre et un caractère spécial.
- **Limitation de la durée du JWT et Refresh Token :** Le jeton d'accès classique expire vite (1 heure), mais il est lié à un jeton de rafraîchissement (_Refresh Token_) qui dure 7 jours. Ce dernier change à chaque utilisation pour plus de sécurité (rotation stricte).
  - **Difficulté :** Le changement automatique du jeton provoquait des déconnexions si le Frontend envoyait deux requêtes en même temps (la première annulait le jeton, ce qui rendait la deuxième suspecte).
  - **Solution :** J'ai bloqué les requêtes de rafraîchissement simultanées sur le Frontend et j'ai ajouté un court délai de tolérance sur le Backend avant de supprimer définitivement l'ancien jeton.
- **Audit des dépendances NPM :** Utilisation de la commande `npm audit` pour vérifier tous les outils externes installés. Le résultat confirme qu'il n'y a aucune faille de sécurité connue dans le projet.
- **Vérification avec John The Ripper :** Test d'attaque par force brute sur une copie de la base de données. Après 20 minutes de test, aucun mot de passe n'a pu être découvert ou cassé.
- **Gestion des erreurs (Masquage) :** Mise en place d'un système de gestion des erreurs à la fin de `server.js`. Il enregistre les pannes en détail sur le serveur pour le développeur, mais affiche un message simple et flou à l'utilisateur pour ne pas donner d'indices aux pirates.

---

## 3. Activités Moyennes (2 points)

- **Limitation des tentatives de connexion (Rate Limiting) :** Ajout de l'outil `express-rate-limit` sur la page de connexion. Il bloque les utilisateurs (par leur adresse IP) s'ils font plus de 5 essais par minute, ce qui arrête les robots de piratage.
