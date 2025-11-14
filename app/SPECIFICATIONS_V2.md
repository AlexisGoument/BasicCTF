# 🎯 SPÉCIFICATIONS CTF NODE.JS - VERSION 2.0

**Framework :** Express.js + EJS (Server-Side Rendering)  
**Public cible :** Développeurs débutants en sécurité  
**Format :** 1 joueur par instance locale  

---

## 📋 ARCHITECTURE GÉNÉRALE

### **Structure des routes**
```
/                    → Page d'accueil avec dashboard
/challenge1         → Insecure Direct Object Reference
/challenge2         → Path Traversal
/challenge3         → SQL Injection (Authentication Bypass)
/challenge4         → SQL Injection Avancé (Data Extraction)
/challenge5         → Broken Authentication
/challenge6         → Cross-Site Scripting
/challenge7         → Git Secrets & Version Control Security
```

### **Base de données SQLite**
- **Table `users`** (id, username, password, email) - Pour les challenges SQL injection 3 et 4
- **Table `flags_table`** (id, flag_value) - Table secrète contenant le flag du challenge 4
- **Pas de système d'authentification global** - Application accessible directement
- **Gestion côté serveur** - foundFlags, totalPoints, challenges status stockés en mémoire serveur

### **Génération des flags au runtime**
```javascript
const crypto = require('crypto');
const SESSION_UID = crypto.randomBytes(8).toString('hex');

const CHALLENGE_FLAGS = {
    1: `CTF{idor_access_${SESSION_UID}}`,
    2: `CTF{directory_traversal_${SESSION_UID}}`,
    3: `CTF{sql_auth_bypass_${SESSION_UID}}`,
    4: `CTF{sql_data_extract_${SESSION_UID}}`,
    5: `CTF{broken_auth_${SESSION_UID}}`,
    6: `CTF{xss_exploit_${SESSION_UID}}`,
    7: 'CTF{git_secrets_exposed_in_history}'
};

// État global du serveur (sans authentification)
let serverState = {
    foundFlags: [],
    totalPoints: 0,
    challenges: [
        { id: 1, name: 'Insecure Direct Object Reference', status: 'pending', points: 100 },
        { id: 2, name: 'Path Traversal', status: 'pending', points: 100 },
        { id: 3, name: 'SQL Injection', status: 'pending', points: 100 },
        { id: 4, name: 'SQL Injection Avancé', status: 'pending', points: 100 },
        { id: 5, name: 'Broken Authentication', status: 'pending', points: 100 },
        { id: 6, name: 'Cross-Site Scripting', status: 'pending', points: 100 },
        { id: 7, name: 'Git Secrets & Version Control Security', status: 'pending', points: 100 }
    ]
};
```

---

## 📊 PAGE D'ACCUEIL AVEC DASHBOARD (`/`)

### **Fonctionnalités principales**
- ✅ Zone de validation des flags intégrée
- ✅ Score en temps réel affiché (géré côté serveur)
- ✅ Liste des 7 challenges avec statut visuel
- ✅ Navigation directe vers chaque challenge
- ✅ Pas d'authentification requise - accès direct
- ❌ Pas d'historique des tentatives
- ❌ Pas d'indices progressifs

### **Données passées au template (gérées côté serveur)**
```javascript
{
    foundFlags: serverState.foundFlags,
    totalPoints: serverState.totalPoints,
    challenges: serverState.challenges,
}
```

### **Structure visuelle**
```
┌─────────────────────────────────────────────────────┐
│ 🏆 CTF Security Challenge                          │
│ Score: XXX points | X/7 challenges terminés        │
├─────────────────────────────────────────────────────┤
│ 🔑 VALIDATION DES FLAGS                             │
│ ┌─────────────────────────────┐ ┌─────────────────┐ │
│ │ CTF{...}                    │ │ [Valider Flag]  │ │
│ └─────────────────────────────┘ └─────────────────┘ │
│ ✅ Flag correct ! +100 points                       │
├─────────────────────────────────────────────────────┤
│ 📋 CHALLENGES (difficulté: facile pour tous)        │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ✅ Challenge 1 - Insecure Direct Object Reference [100pt]│ │
│ │ ✅ Challenge 2 - Path Traversal         [100pt]│ │
│ │ ⏳ Challenge 3 - SQL Injection           [100pt]│ │
│ │ ❌ Challenge 4 - SQL Injection Avancé    [100pt]│ │
│ │ ❌ Challenge 5 - Broken Authentication   [100pt]│ │
│ │ ❌ Challenge 6 - XSS                     [100pt]│ │
│ │ ❌ Challenge 7 - Git Secrets             [100pt]│ │
│ └─────────────────────────────────────────────────┘ │
│ ┌─────────────────┐ ┌─────────────────┐            │
│ │ [Challenge suivant]   │ │ [Tous les       │            │
│ │                 │ │  challenges]    │            │
│ └─────────────────┘ └─────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### **Routes**
- `GET /` - Page d'accueil avec dashboard intégré
- `POST /validate-flag` - Validation d'un flag (géré côté serveur)

---

## 🎯 CHALLENGE 1 - INSECURE DIRECT OBJECT REFERENCE (`/challenge1`)

### **Objectif pédagogique**
Insecure Direct Object References - Accès aux ressources sans contrôle

### **Vulnérabilités à implémenter**
1. **Pas de vérification d'autorisation** → Aucun contrôle d'accès
2. **IDs prévisibles** → Incrémentation simple (1, 2, 3...)
3. **Accès direct aux ressources** → URLs manipulables

### **Flag généré au runtime**
`CTF{idor_access_${SESSION_UID}}`

### **Structure de la page**
```
┌─────────────────────────────────────────────────────┐
│ 🎯 Challenge 1 - Insecure Direct Object Reference  │
│ Accédez aux ressources non autorisées              │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Cette application utilise des références directes   │
│ non sécurisées. Modifiez les URLs pour accéder aux  │
│ ressources protégées.                              │
├─────────────────────────────────────────────────────┤
│ � Documents publics accessibles:                   │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • Document public    [Voir: /challenge1/doc/1] │ │
│ │ • Guide utilisateur  [Voir: /challenge1/doc/2] │ │
│ │ • FAQ générale       [Voir: /challenge1/doc/3] │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Testez différents IDs                             │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge1` - Page du challenge  
- `GET /challenge1/doc/:id` - Documents avec IDOR (flag dans doc ID 0)

### **Données de test (hardcodées, pas en DB)**
- Doc ID 0 → Document admin avec flag
- Doc ID 4 → Données confidentielles  
- Doc ID 1,2,3 → Documents publics visibles sur la page

### **Points attribués**
100 points fixes

---

## 🔍 CHALLENGE 2 - PATH TRAVERSAL (`/challenge2`)

### **Objectif pédagogique**
Enseigner la découverte de répertoires cachés et l'énumération

### **Vulnérabilité à implémenter**
1. **Répertoire admin caché** → `/challenge2/admin` non référencé
2. **Pas de contrôle d'accès** → Répertoire accessible directement
3. **Énumération possible** → Découvrable avec dirb/gobuster

### **Flag généré au runtime**
`CTF{directory_traversal_${SESSION_UID}}`

### **Structure de la page principale**
```
┌─────────────────────────────────────────────────────┐
│ 🔍 Challenge 2 - Path Traversal                    │
│ Découvrez les répertoires cachés                   │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Cette application contient des répertoires cachés  │
│ non référencés. Utilisez des outils d'énumération  │
│ pour les découvrir.                                │
├─────────────────────────────────────────────────────┤
│ � Répertoires publics connus:                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • /challenge2/public                            │ │
│ │ • /challenge2/docs                              │ │
│ │ • /challenge2/help                              │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 🛠️ Outils suggérés:                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • dirb http://localhost:3000/challenge2/        │ │
│ │ • gobuster dir -u http://localhost:3000/...     │ │
│ │ • Énumération manuelle des répertoires          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Cherchez des répertoires administratifs          │
│ • Testez des noms communs (admin, config, etc.)    │
│ • Utilisez une wordlist pour l'énumération         │
└─────────────────────────────────────────────────────┘
```

### **Structure de la page cachée `/challenge2/admin`**
```
┌─────────────────────────────────────────────────────┐
│ 🔐 Administration Panel                             │
│ ⚠️ ACCÈS NON AUTORISÉ DÉTECTÉ                       │
├─────────────────────────────────────────────────────┤
│ Vous avez découvert le panneau d'administration    │
│ caché. Félicitations !                             │
│                                                     │
│ 🏆 FLAG: CTF{directory_traversal_xxxxx}             │
├─────────────────────────────────────────────────────┤
│ Cette page était supposée être cachée et           │
│ inaccessible aux utilisateurs normaux.             │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge2` - Page principale du challenge
- `GET /challenge2/public` - Répertoire public (leurre)
- `GET /challenge2/docs` - Répertoire docs (leurre)  
- `GET /challenge2/help` - Répertoire help (leurre)
- `GET /challenge2/admin` - Répertoire caché avec le flag

### **Fichiers pour dirb/gobuster**
Le répertoire `/challenge2/admin` doit être découvrable avec des wordlists communes.

### **Points attribués**
100 points fixes

---

## � CHALLENGE 3 - SQL INJECTION (`/challenge3`)

### **Objectif pédagogique**
Bypass d'authentification via injection SQL classique

### **Vulnérabilités à implémenter**
1. **Requête SQL non préparée** → Concaténation directe dans WHERE clause
2. **Formulaire de login vulnérable** → Injection via username/password
3. **Pas de validation des entrées** → Aucun filtrage des caractères spéciaux
4. **Authentication bypass** → `' OR '1'='1` permet de contourner l'auth

### **Flag généré au runtime**
`CTF{sql_auth_bypass_${SESSION_UID}}`

### **Structure de la page**
```
┌─────────────────────────────────────────────────────┐
│ � Challenge 3 - SQL Injection                     │
│ Contournez l'authentification via injection SQL    │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Ce formulaire de connexion est vulnérable aux       │
│ injections SQL. Exploitez cette faille pour vous   │
│ connecter sans connaître le mot de passe.          │
├─────────────────────────────────────────────────────┤
│ 🔑 Formulaire de connexion:                         │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Username: ┌─────────────────┐                   │ │
│ │           │ [___________]   │                   │ │
│ │           └─────────────────┘                   │ │
│ │ Password: ┌─────────────────┐                   │ │
│ │           │ [___________]   │                   │ │
│ │           └─────────────────┘                   │ │
│ │ ┌─────────────────┐                            │ │
│ │ │ [Se connecter]  │                            │ │
│ │ └─────────────────┘                            │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Testez avec des caractères spéciaux (' " ; --)   │
│ • Essayez des payloads d'auth bypass classiques    │
│ • La requête SQL est probablement SELECT * FROM... │
│ • Observez les messages d'erreur SQL               │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge3` - Page du challenge avec formulaire de login
- `POST /challenge3/login` - Endpoint de login vulnérable à l'injection SQL

### **Mécanisme**
- Requête SQL vulnérable : `SELECT * FROM users WHERE username='${username}' AND password='${password}'`
- Si l'injection réussit et qu'un utilisateur est trouvé, affichage du flag
- Payload exemple : username: `admin' --` ou `' OR '1'='1' --`

### **Points attribués**
100 points fixes

---

## 💉 CHALLENGE 4 - SQL INJECTION AVANCÉ (`/challenge4`)

### **Objectif pédagogique**
Extraction de données sensibles via injection SQL avec outils automatisés (sqlmap)

### **Vulnérabilités à implémenter**
1. **Requête SQL non préparée** → Concaténation directe des paramètres
2. **Messages d'erreur SQL exposés** → Erreurs SQLite affichées
3. **Union-based injection** → Possibilité d'extraire des données
4. **Compatible sqlmap** → Endpoint optimisé pour l'exploitation automatisée

### **Flag généré au runtime**
`CTF{sql_data_extract_${SESSION_UID}}` (stocké dans la table `flags_table`)

### **Structure de la page**
```
┌─────────────────────────────────────────────────────┐
│ 💉 Challenge 4 - SQL Injection Avancé              │
│ Exploitez la recherche d'utilisateurs              │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Cette fonction de recherche est vulnérable aux      │
│ injections SQL. Utilisez des techniques avancées    │
│ pour extraire des données de la base.              │
├─────────────────────────────────────────────────────┤
│ 🔍 Rechercher un utilisateur:                       │ ┌─────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────┐ │
│ │ ┌─────────────────┐ ┌─────────────────┐        │ │
│ │ │ [___________]   │ │ [Rechercher]    │        │ │
│ │ └─────────────────┘ └─────────────────┘        │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 📊 Résultats de recherche:                          │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • John Doe (john@example.com)                   │ │
│ │ • Jane Smith (jane@example.com)                 │ │
│ │ • Admin User (admin@example.com)                │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 🛠️ Outils suggérés:                                 │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • sqlmap -u "http://localhost:3000/challenge4"  │ │
│ │ • sqlmap --forms --dump --batch                 │ │
│ │ • Techniques UNION SELECT manuelles             │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Le flag est dans une table séparée               │
│ • Utilisez UNION SELECT pour extraire des données  │
│ • sqlmap peut automatiser l'exploitation           │
│ • Explorez toutes les tables de la base           │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge4` - Page du challenge
- `POST /challenge4/search` - Endpoint de recherche vulnérable (compatible sqlmap)

### **Base de données**
- Table `users` avec données de test
- Table `flags_table` avec le flag du challenge 4
- Structure optimisée pour sqlmap et techniques manuelles

### **Payload exemple pour récupérer le flag**
```sql
' UNION SELECT flag_value, 'admin', 'admin@hack.com' FROM flags_table WHERE '1'='1
```

### **Points attribués**
100 points fixes

---

## 🔐 CHALLENGE 5 - BROKEN AUTHENTICATION (`/challenge5`)

### **Objectif pédagogique**
Exploitation des faiblesses d'authentification (simulation sans vraie auth)

### **Vulnérabilités à implémenter**
1. **Formulaire de connexion factice** → Toujours refuser mais révéler des infos
2. **Messages d'erreur révélateurs** → "Utilisateur admin existe" vs "Utilisateur inconnu"
3. **Cookies/headers mal configurés** → Informations exposées
4. **Bypass de validation côté client** → JavaScript facilement contournable

### **Flag généré au runtime**
`CTF{broken_auth_${SESSION_UID}}`

### **Structure de la page**
```
┌─────────────────────────────────────────────────────┐
│ 🔐 Challenge 5 - Broken Authentication             │
│ Contournez les faiblesses de ce système            │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Ce système d'authentification révèle des           │
│ informations sensibles. Exploitez ces faiblesses.  │
├─────────────────────────────────────────────────────┤
│ 🔑 Formulaire de connexion (toujours refusé):       │
│ ┌─────────────────────────────────────────────────┐ │
│ │ Username: ┌─────────────────┐                   │ │
│ │           │ [___________]   │                   │ │
│ │           └─────────────────┘                   │ │
│ │ Password: ┌─────────────────┐                   │ │
│ │           │ [___________]   │                   │ │
│ │           └─────────────────┘                   │ │
│ │ ┌─────────────────┐                            │ │
│ │ │ [Se connecter]  │                            │ │
│ │ └─────────────────┘                            │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Testez différents usernames (admin, root, test)  │
│ • Observez les messages d'erreur différents        │
│ • Inspectez les cookies et headers de réponse      │
│ • Regardez le code source et JavaScript           │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge5` - Page du challenge
- `POST /challenge5/login` - Endpoint qui révèle des infos selon le username

### **Mécanisme**
- Solution: `hydra -l admin -P /usr/share/wordlists/rockyou.txt localhost http-post-form "/challenge5/login:username=^USER^&password=^PASS^:incorrect" -s 3000`
- Le flag est révélé quand l'utilisateur tente de se connecter avec le bon identifiant/mot de passe : admin/0123456789
- Pas de vraie authentification, juste simulation des faiblesses

### **Points attribués**
100 points fixes

---

## 🚨 CHALLENGE 6 - CROSS-SITE SCRIPTING (`/challenge6`)

### **Objectif pédagogique**
XSS réfléchi et stocké (persistant)

### **Vulnérabilités à implémenter**
1. **Pas de sanitisation des entrées** → Aucun échappement HTML
2. **Stockage direct en base** → Commentaires stockés tels quels
3. **Affichage sans échappement** → Template EJS avec `<%-` au lieu `<%=`
4. **Cookie accessible via JS** → httpOnly: false

### **Flag généré au runtime**
`CTF{xss_exploit_${SESSION_UID}}` (stocké dans un cookie ou variable JS)

### **Structure de la page**
```
┌─────────────────────────────────────────────────────┐
│ 🚨 Challenge 6 - Cross-Site Scripting (XSS)        │
│ Injectez du JavaScript malveillant                 │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Cette zone de commentaires ne filtre pas les        │
│ entrées utilisateurs. Exploitez cette faille pour   │
│ exécuter du JavaScript.                            │
├─────────────────────────────────────────────────────┤
│ 💬 Poster un commentaire:                           │
│ ┌─────────────────────────────────────────────────┐ │
│ │ ┌─────────────────────────────────────────────┐ │ │
│ │ │ [_________________________________]        │ │ │
│ │ │ [_________________________________]        │ │ │
│ │ │ [_________________________________]        │ │ │
│ │ └─────────────────────────────────────────────┘ │ │
│ │ ┌─────────────────┐                            │ │
│ │ │ [Publier]       │                            │ │
│ │ └─────────────────┘                            │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💭 Commentaires récents:                            │
│ ┌─────────────────────────────────────────────────┐ │
│ │ 👤 Alice: "Super application, merci !"          │ │
│ │ 👤 Bob: "Très utile pour apprendre"            │ │
│ │ 👤 Charlie: "J'ai appris beaucoup"             │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Testez avec des balises HTML (<b>, <i>)          │
│ • Essayez d'injecter du JavaScript (<script>)      │
│ • Le flag peut être accessible via document.cookie │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge6` - Page du challenge
- `POST /challenge6/comment` - Endpoint d'ajout de commentaire vulnérable

### **Flag accessible via**
- Cookie: `flag=CTF{xss_exploit_${SESSION_UID}}`

### **Payload exemple**
```html
<script>alert(document.cookie)</script>
```

### **Points attribués**
100 points fixes

---

## 🔐 CHALLENGE 7 - GIT SECRETS & VERSION CONTROL SECURITY (`/challenge7`)

### **Objectif pédagogique**
Sensibiliser aux risques liés aux secrets exposés dans l'historique Git

### **Vulnérabilités à implémenter**
1. **Secrets dans l'historique Git** → Flag committé puis supprimé du code actuel
2. **Mauvaises pratiques de versioning** → Informations sensibles dans les commits précédents
3. **Analyse de l'historique** → Découverte via gitleaks ou inspection manuelle
4. **Sécurité du contrôle de version** → Sensibilisation aux bonnes pratiques Git

### **Flag à découvrir**
`CTF{git_secrets_exposed_in_history}` (flag statique, non généré au runtime)

### **Structure de la page**
```
┌─────────────────────────────────────────────────────┐
│ 🔐 Challenge 7 - Git Secrets & Version Control     │
│ Explorez l'historique du contrôle de version       │
├─────────────────────────────────────────────────────┤
│ 📚 Description:                                     │
│ Les développeurs commettent parfois des erreurs et  │
│ exposent des informations sensibles dans            │
│ l'historique Git. Votre mission est de découvrir    │
│ ces secrets cachés.                                │
├─────────────────────────────────────────────────────┤
│ 🛠️ Outils suggérés pour l'analyse:                  │
│ ┌─────────────────────────────────────────────────┐ │
│ │ • gitleaks detect --source .                   │ │
│ │ • git log --oneline --all                      │ │
│ │ • git show <commit-hash>                       │ │
│ │ • truffleHog (alternative à gitleaks)          │ │
│ └─────────────────────────────────────────────────┘ │
├─────────────────────────────────────────────────────┤
│ 💡 Indices:                                         │
│ • Les secrets ne sont pas toujours dans le code    │
│   actuel mais peuvent être dans l'historique       │
│ • Inspectez les commits précédents                 │
│ • Utilisez des outils de détection de secrets      │
│ • Vérifiez les fichiers de configuration          │
└─────────────────────────────────────────────────────┘
```

### **Routes nécessaires**
- `GET /challenge7` - Page d'information du challenge (aucun input nécessaire)

### **Implémentation de la vulnérabilité**
1. **Préparation du repository Git** :
   - Créer un commit initial avec un fichier `.env` ou `config.js` contenant le flag
   - Faire un second commit supprimant ce fichier du code actuel
   - Le flag reste visible dans l'historique Git

2. **Exemple de structure de commits** :
   ```bash
   # Commit 1: Initial setup avec secrets
   # Fichier: config/database.js
   module.exports = {
       database: 'ctf_db',
       password: 'super_secret_password',
       flag: 'CTF{git_secrets_exposed_in_history}',
       api_key: 'sk-1234567890abcdef'
   };
   
   # Commit 2: Remove sensitive data (mais garde l'historique)
   module.exports = {
       database: process.env.DB_NAME,
       password: process.env.DB_PASSWORD,
       // Removed hardcoded secrets
   };
   ```

### **Méthodes de découverte**
1. **Via gitleaks** :
   ```bash
   gitleaks detect --source . --verbose
   ```

2. **Via inspection manuelle** :
   ```bash
   git log --oneline --all
   git show <commit-hash>
   git log -p --all | grep -i "CTF{"
   ```

3. **Via truffleHog** (alternative) :
   ```bash
   truffleHog --regex --entropy=false .
   ```

### **Points attribués**
100 points fixes

---

## 🎨 DESIGN ET UX

### **Thème visuel**
- **Couleurs** : Thème sombre (dark mode) style "hacker"
- **Polices** : Monospace pour le code, sans-serif pour le texte
- **Style** : Interface moderne, cartes avec ombres, gradients discrets

### **Responsive Design**
- ✅ Compatible desktop (1920x1080)
- ✅ Compatible tablette (768px)
- ✅ Compatible mobile (320px)
- Navigation adaptative avec menu burger

### **Feedback utilisateur**
- ✅ Messages de succès en vert
- ✅ Messages d'erreur en rouge  
- ✅ Indicateurs de progression visuels
- ✅ Animations subtiles (transitions CSS)

### **Navigation**
- Menu fixe en haut avec liens vers tous les challenges
- Breadcrumb sur chaque page
- Bouton "Retour au dashboard" sur chaque challenge

---

## 🔧 IMPLÉMENTATION TECHNIQUE

### **Structure des fichiers**
```
/
├── server.js                 # Serveur Express principal
├── package.json             # Dépendances npm
├── database.db              # Base SQLite (uniquement pour challenge 3)
├── views/                   # Templates EJS
│   ├── index.ejs           # Page d'accueil avec dashboard
│   ├── challenge1.ejs      # Challenge 1 (Insecure Direct Object Reference)
│   ├── challenge2.ejs      # Challenge 2 (Path Traversal)
│   ├── challenge2-admin.ejs # Page admin cachée challenge 2
│   ├── challenge3.ejs      # Challenge 3 (SQL Injection)
│   ├── challenge4.ejs      # Challenge 4 (SQL Injection Avancé)
│   ├── challenge5.ejs      # Challenge 5 (Broken Authentication)
│   ├── challenge6.ejs      # Challenge 6 (Cross-Site Scripting)
│   ├── challenge7.ejs      # Challenge 7 (Git Secrets & Version Control Security)
│   └── error.ejs           # Page d'erreur
├── public/                  # Fichiers statiques
│   ├── css/
│   │   └── style.css       # Styles CSS
│   └── js/
│       └── app.js          # JavaScript client
└── README.md               # Documentation
```

### **Dépendances npm**
```json
{
  "dependencies": {
    "express": "^4.18.2",
    "ejs": "^3.1.9",
    "sqlite3": "^5.1.6",
    "body-parser": "^1.20.2",
    "cookie-parser": "^1.4.6"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### **Configuration de sécurité volontairement faible**
```javascript
// Pas de sessions - État global du serveur
let serverState = {
    foundFlags: [],
    totalPoints: 0,
    challenges: [...] // État des challenges
};
```

## ✅ CRITÈRES DE VALIDATION

### **Système de scoring**
- ✅ Points fixes par challenge (100 pts chacun)
- ✅ Total maximum : 700 points (7 challenges)
- ❌ Pas de points dégressifs dans le temps
- ❌ Pas de bonus vitesse
- ❌ Pas de pénalités pour mauvaises tentatives

### **Validation des flags**
- ✅ Format : `CTF{category_${uid}}` avec UID généré au runtime
- ✅ Validation case-sensitive
- ✅ Un flag par challenge
- ✅ Impossible de trouver les flags dans le code source
- ✅ Stockage en session côté serveur

### **Fonctionnalités exclues**
- ❌ Pas de système d'authentification (login/logout)
- ❌ Pas de gestion d'utilisateurs/sessions
- ❌ Pas de système d'indices payants
- ❌ Pas de tableau administrateur
- ❌ Pas d'export des résultats
- ❌ Pas de système multi-joueurs
- ❌ Pas d'historique des tentatives
- ❌ Pas de limitation dans le temps

---

## 🚀 PROCHAINES ÉTAPES

1. **Review des spécifications** ✅ (vous êtes ici)
2. **Validation du design** ⏳ 
3. **Création de la structure projet** ⏳
4. **Implémentation du serveur Express** ⏳
5. **Création des templates EJS** ⏳
6. **Implémentation des vulnérabilités** ⏳
7. **Tests et validation** ⏳
8. **Documentation finale** ⏳

---

**📝 NOTES POUR LA REVIEW**
- Toutes les fonctionnalités correspondent aux réponses données
- Architecture simple et pédagogique pour débutants
- 7 challenges couvrant les principales vulnérabilités web et sécurité DevSecOps
- Système de flags sécurisé (non lisible dans le code actuel)
- Interface moderne mais simple à comprendre
- Pas de complexité inutile (authentification simple, pas de features avancées)
- Challenge Git unique : sensibilisation à la sécurité du contrôle de version
