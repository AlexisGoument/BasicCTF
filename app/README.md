# 🎯 CTF Security Challenge - Version 2.0

Application web Node.js contenant 7 challenges de sécurité à des fins éducatives.

## 📋 Description

Cette application est un **Capture The Flag (CTF)** conçu pour enseigner les vulnérabilités web courantes aux développeurs débutants. Elle contient **volontairement** 7 types de vulnérabilités différentes à exploiter.

⚠️ **ATTENTION** : Cette application est **intentionnellement non sécurisée**. Ne jamais déployer en production !

## 🎓 Objectifs Pédagogiques

Les 7 challenges couvrent les vulnérabilités suivantes :

1. **IDOR** - Insecure Direct Object Reference
2. **Path Traversal** - Énumération de répertoires cachés
3. **SQL Injection** - Bypass d'authentification
4. **SQL Injection Avancé** - Extraction de données
5. **Broken Authentication** - Faiblesses d'authentification
6. **XSS** - Cross-Site Scripting
7. **Git Secrets** - Sécurité du contrôle de version

## 🚀 Installation

### Prérequis

- Node.js (v14 ou supérieur)
- npm ou yarn
- Git

### Installation des dépendances

```bash
npm install
```

## 🎮 Démarrage

### Mode normal
```bash
npm start
```

L'application sera accessible sur **http://localhost:3000**

## 📊 Structure du Projet

```
/
├── server.js                 # Serveur Express principal
├── package.json             # Dépendances npm
├── database.db              # Base SQLite (auto-générée)
├── views/                   # Templates EJS
│   ├── index.ejs           # Dashboard
│   ├── challenge1.ejs      # Challenge IDOR
│   ├── challenge2.ejs      # Challenge Path Traversal
│   ├── challenge2-admin.ejs # Page admin cachée
│   ├── challenge3.ejs      # Challenge SQL Injection
│   ├── challenge4.ejs      # Challenge SQL Injection Avancé
│   ├── challenge5.ejs      # Challenge Broken Auth
│   ├── challenge6.ejs      # Challenge XSS
│   ├── challenge7.ejs      # Challenge Git Secrets
│   └── partials/           # Composants réutilisables
├── public/                  # Fichiers statiques
│   ├── css/
│   │   └── style.css       # Styles CSS
│   └── js/
│       └── app.js          # JavaScript client (optionnel)
└── README.md               # Documentation
```

## 🏆 Guide des Challenges

### Challenge 1 - IDOR
- **Objectif** : Accéder au document admin
- **Méthode** : Modifier l'ID dans l'URL `/challenge1/doc/:id`
- **Points** : 100

### Challenge 2 - Path Traversal
- **Objectif** : Découvrir le répertoire caché
- **Méthode** : Énumération avec dirb/gobuster ou test manuel
- **Points** : 100

### Challenge 3 - SQL Injection
- **Objectif** : Contourner l'authentification
- **Méthode** : Injection SQL classique
- **Points** : 100

### Challenge 4 - SQL Injection Avancé
- **Objectif** : Extraire le flag de la table `flags_table`
- **Méthode** : UNION SELECT ou sqlmap
- **Points** : 100

### Challenge 5 - Broken Authentication
- **Objectif** : Se connecter avec les bons identifiants
- **Méthode** : Observer les messages d'erreur et utiliser hydra
- **Points** : 100

### Challenge 6 - XSS
- **Objectif** : Récupérer le flag dans les cookies
- **Méthode** : Injection de javascript
- **Points** : 100

### Challenge 7 - Git Secrets
- **Objectif** : Trouver le flag dans l'historique Git
- **Méthode** : `git log`, `gitleaks`
- **Points** : 100

## 🛠️ Outils Recommandés

- **Burp Suite** - Proxy d'interception
- **SQLMap** - Exploitation SQL automatisée
- **dirb / gobuster** - Énumération de répertoires
- **gitleaks / truffleHog** - Détection de secrets Git
- **hydra** - Attaque par dictionnaire

## 🎨 Fonctionnalités

✅ Dashboard avec scoring en temps réel  
✅ 7 challenges de difficulté adaptée aux débutants  
✅ Validation des flags côté serveur  
✅ Interface moderne en dark mode  
✅ Responsive design (desktop, tablette, mobile)  
✅ Flags générés dynamiquement au démarrage  
✅ Base de données SQLite intégrée  

## 🔐 Flags

Les flags sont générés automatiquement au démarrage du serveur avec un UID unique, sauf pour le challenge 7 qui a un flag statique.

Format : `CTF{categorie_UID}` ou `CTF{categorie}`

Les flags s'affichent dans la console au démarrage du serveur.

## 📝 Notes Techniques

### Vulnérabilités Implémentées

- ✅ Pas de validation des entrées utilisateur
- ✅ Requêtes SQL non préparées (concaténation)
- ✅ Pas d'échappement HTML dans les templates
- ✅ Cookies non sécurisés (httpOnly: false)
- ✅ Messages d'erreur révélateurs
- ✅ Pas de contrôle d'accès sur les ressources
- ✅ Secrets exposés dans l'historique Git

### État du Serveur

L'application stocke l'état en mémoire (pas de sessions) :
- Flags trouvés
- Score total
- Statut des challenges

⚠️ Le score est réinitialisé à chaque redémarrage du serveur.

## 🧪 Tests

Pour tester l'application :

1. Démarrer le serveur
2. Accéder à http://localhost:3000
3. Tenter de résoudre chaque challenge
4. Valider les flags sur le dashboard

## 🤝 Contribution

Ce projet est à des fins éducatives. Les contributions sont les bienvenues pour :
- Ajouter de nouveaux challenges
- Améliorer l'interface
- Corriger des bugs non intentionnels
- Améliorer la documentation

## ⚠️ Avertissement de Sécurité

**CETTE APPLICATION CONTIENT DES VULNÉRABILITÉS VOLONTAIRES !**

- ❌ Ne jamais déployer en production
- ❌ Ne jamais exposer sur Internet
- ✅ Utiliser uniquement en environnement local
- ✅ À des fins éducatives uniquement

## 📄 Licence

MIT License - Projet éducatif

## 👨‍💻 Auteur

CTF Security Challenge v2.0 - Formation en sécurité applicative

---

**Bon courage pour les challenges ! 🎯**
