# Spécification - Système de sauvegarde de progression utilisateur

**Version:** 1.0  
**Date:** 30 novembre 2025  
**Statut:** Planification validée

---

## 🎯 Vue d'ensemble

Transformer le système actuel (état global en mémoire) vers un système multi-utilisateurs avec persistance en CSV. Chaque utilisateur a sa propre progression sauvegardée et identifiée par un cookie.

---

## 📊 Structure de données

### Format CSV
```csv
username,progress,totalPoints,lastUpdate
Alice,1010000,200,2025-11-30T15:30:00Z
Bob,1111111,700,2025-11-30T16:45:00Z
Charlie,1000000,100,2025-11-30T14:20:00Z
```

### Champs
- **username** : Identifiant unique de l'utilisateur (string)
- **progress** : String de 7 bits représentant les challenges complétés
  - Format : "1010000"
  - Position 0 = Challenge 1, Position 1 = Challenge 2, etc.
  - "1" = complété, "0" = non complété
- **totalPoints** : Points accumulés (integer)
- **lastUpdate** : Timestamp ISO 8601 de dernière modification

### Emplacement du fichier
- **Path:** `/app/data/progress.csv`
- Le dossier `/app/data/` sera créé automatiquement s'il n'existe pas

---

## 🍪 Gestion des cookies

### Configuration du cookie
```javascript
res.cookie('ctf_username', encodedUsername, {
    maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 jours
    httpOnly: false,                   // Vulnérable intentionnellement
    secure: false,                     // Pas de HTTPS requis
    sameSite: 'lax'
});
```

### Encodage du username
- **Format:** Username encodé en base64
- **Encodage:** `Buffer.from(username).toString('base64')`
- **Décodage:** `Buffer.from(encodedUsername, 'base64').toString('utf-8')`

**Exemples:**
- `Alice` → `QWxpY2U=`
- `Bob` → `Qm9i`
- `Charlie` → `Q2hhcmxpZQ==`

### Sécurité volontairement faible
- Cookie accessible via JavaScript (httpOnly: false)
- Pas de signature/chiffrement
- Facilement manipulable pour des fins pédagogiques

---

## 🔐 Validation du username

### Règles de validation
- **Longueur:** 3 à 20 caractères
- **Caractères autorisés:** Lettres (a-z, A-Z), chiffres (0-9), underscore (_), tiret (-)
- **Regex:** `/^[a-zA-Z0-9_-]{3,20}$/`

### Messages d'erreur
- Username trop court/long : "Le nom doit contenir entre 3 et 20 caractères"
- Caractères invalides : "Seuls les lettres, chiffres, _ et - sont autorisés"
- Username déjà pris : "Ce nom d'utilisateur existe déjà, choisissez-en un autre"

---

## 🔄 Flux utilisateur

```
1. Utilisateur arrive sur n'importe quelle page
   ↓
2. Middleware vérifie le cookie 'ctf_username'
   ↓
   ├─ Cookie absent → Redirection vers /register
   │  ↓
   │  Affichage du formulaire de saisie
   │  ↓
   │  Soumission du formulaire
   │  ↓
   │  Validation du format (regex)
   │  ↓
   │  Vérification de l'unicité
   │  ↓
   │  ├─ Nom existe → Erreur "Nom déjà pris"
   │  └─ Nom unique → Création entrée CSV + cookie encodé
   │     ↓
   │     Redirection vers /
   │
   └─ Cookie présent
      ↓
      Décodage du username (base64)
      ↓
      ├─ Décodage échoue → Cookie invalide, redirection /register
      └─ Décodage OK
         ↓
         Vérification existence dans CSV
         ↓
         ├─ N'existe pas → Cookie falsifié, redirection /register
         └─ Existe → Charger progression et continuer
            ↓
3. Afficher dashboard avec progression personnalisée
   ↓
4. Validation d'un flag
   ↓
5. Mise à jour de la progression dans le CSV
   ↓
6. Rechargement de la page avec nouvelle progression
```

### Cas du cookie supprimé
Si l'utilisateur supprime son cookie, il est traité comme un nouvel utilisateur :
- Redirection vers `/register`
- Peut choisir le même nom si disponible
- Ou un nouveau nom

---

## 📝 Architecture technique

### Structure des fichiers

```
/app/
├── data/
│   └── progress.csv              # Fichier de progression (auto-créé)
├── middleware/
│   └── auth.js                   # Middleware d'authentification
├── utils/
│   └── progressManager.js        # Gestion du CSV
├── views/
│   ├── register.ejs              # Page d'inscription (nouveau)
│   ├── index.ejs                 # Dashboard (modifié)
│   └── partials/
│       └── header.ejs            # Header avec username (modifié)
└── server.js                     # Serveur principal (modifié)
```

### Module progressManager.js

**Fonctions à implémenter:**

```javascript
// Initialisation
initCSV()                           // Créer le fichier avec headers si inexistant

// Lecture
loadAllUsers()                      // Retourne array de tous les utilisateurs
getUserProgress(username)           // Retourne l'objet user ou null
userExists(username)                // Retourne boolean

// Écriture
createUser(username)                // Crée nouvelle entrée "0000000", 0 points
updateProgress(username, bitIndex)  // Marque le bit à 1, +100 points
saveToCSV(users)                    // Écrit tout le tableau dans le CSV
```

**Gestion des erreurs:**
- Créer `/app/data/` si n'existe pas
- Créer le CSV avec headers si vide/manquant
- Gérer les erreurs de lecture/écriture avec try/catch
- Logger les erreurs dans la console

### Middleware auth.js

```javascript
function requireUser(req, res, next) {
    // Exclure certaines routes
    const publicPaths = ['/register', '/css', '/js', '/images'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    
    const encodedUsername = req.cookies.ctf_username;
    
    if (!encodedUsername) {
        return res.redirect('/register');
    }
    
    // Décoder le username
    let username;
    try {
        username = Buffer.from(encodedUsername, 'base64').toString('utf-8');
    } catch (err) {
        res.clearCookie('ctf_username');
        return res.redirect('/register');
    }
    
    // Vérifier existence
    if (!userExists(username)) {
        res.clearCookie('ctf_username');
        return res.redirect('/register');
    }
    
    // Charger progression
    req.userProgress = getUserProgress(username);
    req.username = username;
    next();
}

module.exports = { requireUser };
```

---

## 🛠️ Modifications du code existant

### server.js

**À supprimer:**
```javascript
let serverState = {
    foundFlags: [],
    totalPoints: 0,
    challenges: [...]
};
```

**À ajouter:**
```javascript
const progressManager = require('./utils/progressManager');
const { requireUser } = require('./middleware/auth');

// Au démarrage
progressManager.initCSV();

// Appliquer le middleware
app.use(requireUser);
```

**Route GET / à modifier:**
```javascript
app.get('/', (req, res) => {
    const progress = req.userProgress;
    
    // Convertir "1010000" en tableau [1, 3]
    const foundFlags = [];
    for (let i = 0; i < progress.progress.length; i++) {
        if (progress.progress[i] === '1') {
            foundFlags.push(i + 1);
        }
    }
    
    // Mettre à jour les statuts
    const challenges = [
        { id: 1, name: 'Insecure Direct Object Reference', status: 'pending', points: 100 },
        { id: 2, name: 'Path Traversal', status: 'pending', points: 100 },
        // ... autres challenges
    ];
    
    challenges.forEach(c => {
        c.status = foundFlags.includes(c.id) ? 'completed' : 'pending';
    });
    
    res.render('index', {
        username: req.username,
        foundFlags: foundFlags,
        totalPoints: progress.totalPoints,
        challenges: challenges,
        message: null
    });
});
```

**Route POST /validate-flag à modifier:**
```javascript
app.post('/validate-flag', (req, res) => {
    const { flag } = req.body;
    const username = req.username;
    let message = { type: 'error', text: 'Flag incorrect !' };
    
    // Identifier le challenge
    let challengeId = null;
    for (let id in CHALLENGE_FLAGS) {
        if (CHALLENGE_FLAGS[id] === flag) {
            challengeId = parseInt(id);
            break;
        }
    }
    
    if (!challengeId) {
        // Afficher avec progression actuelle
        const progress = getUserProgress(username);
        return res.render('index', { ..., message });
    }
    
    // Vérifier si déjà validé
    const progress = getUserProgress(username);
    const bitIndex = challengeId - 1;
    
    if (progress.progress[bitIndex] === '1') {
        message = { type: 'info', text: 'Vous avez déjà validé ce flag !' };
    } else {
        // Marquer comme complété
        progressManager.updateProgress(username, bitIndex);
        message = { type: 'success', text: `Flag correct ! +100 points - Challenge ${challengeId} complété !` };
    }
    
    // Recharger et afficher
    const newProgress = getUserProgress(username);
    // ... render avec nouvelle progression
});
```

### Nouvelles routes

```javascript
// Page d'inscription
app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

// Traitement de l'inscription
app.post('/register', (req, res) => {
    const { username } = req.body;
    
    // Validation du format
    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(username)) {
        return res.render('register', {
            error: 'Le nom doit contenir entre 3 et 20 caractères (lettres, chiffres, _ et - uniquement)'
        });
    }
    
    // Vérifier l'unicité
    if (userExists(username)) {
        return res.render('register', {
            error: 'Ce nom d\'utilisateur existe déjà, choisissez-en un autre'
        });
    }
    
    // Créer l'utilisateur
    createUser(username);
    
    // Créer le cookie encodé
    const encodedUsername = Buffer.from(username).toString('base64');
    res.cookie('ctf_username', encodedUsername, {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
    });
    
    // Rediriger vers l'accueil
    res.redirect('/');
});
```

---

## 🎨 Interface utilisateur

### Page register.ejs

**Éléments requis:**
- Titre : "Bienvenue sur le CTF Security Challenge"
- Sous-titre : "Choisissez votre nom d'utilisateur pour commencer"
- Formulaire avec :
  - Input text pour le username
  - Placeholder : "Votre nom d'utilisateur"
  - Bouton "Commencer"
- Affichage des erreurs si présentes
- Règles de validation affichées
- Design cohérent avec le reste du site (thème sombre "hacker")

### Modification header.ejs

Ajouter l'affichage du username :
```html
<div class="user-info">
    👤 Connecté en tant que: <strong><%= username %></strong>
</div>
```

---

## 🧪 Scénarios de test

### Tests fonctionnels

1. **Premier accès**
   - Accéder à `/` sans cookie → Redirection vers `/register`
   - Accéder à `/challenge1` sans cookie → Redirection vers `/register`

2. **Inscription valide**
   - Saisir "Alice" → Cookie créé, redirection vers `/`
   - Vérifier le cookie : `ctf_username=QWxpY2U=`
   - Vérifier le CSV : nouvelle ligne avec "Alice,0000000,0,timestamp"

3. **Inscription avec nom existant**
   - Saisir "Alice" alors qu'Alice existe → Erreur affichée
   - Pas de création de cookie
   - Reste sur `/register`

4. **Validation du format**
   - Username "AB" → Erreur (trop court)
   - Username "A" * 21 → Erreur (trop long)
   - Username "Alice@123" → Erreur (caractère invalide)
   - Username "Alice_123-X" → OK

5. **Navigation avec cookie valide**
   - Accéder à n'importe quelle page → Accès autorisé
   - Progression chargée depuis le CSV

6. **Validation de flags**
   - Valider challenge 1 → Progress passe à "1000000", points = 100
   - Valider challenge 3 → Progress passe à "1010000", points = 200
   - Revalider challenge 1 → Message "déjà validé", pas de changement

7. **Cookie supprimé**
   - Supprimer le cookie manuellement
   - Recharger la page → Redirection vers `/register`
   - Peut recréer "Alice" ou choisir un nouveau nom

8. **Cookie manipulé**
   - Modifier le cookie en base64 invalide → Redirection `/register`
   - Encoder un username inexistant → Redirection `/register`
   - Encoder un username existant ("Bob") → Voir la progression de Bob

9. **Multi-utilisateurs**
   - Alice valide challenges 1, 3, 5
   - Bob valide challenges 1, 2, 3, 4, 5, 6, 7
   - Charlie valide challenge 1
   - Vérifier que les progressions sont séparées

10. **Persistance**
    - Redémarrer le serveur
    - Les progressions sont conservées
    - Les utilisateurs peuvent continuer

---

## 📦 Ordre d'implémentation

1. ✅ Créer le dossier `/app/data/`
2. ✅ Créer `/app/utils/progressManager.js`
3. ✅ Tester progressManager en isolation
4. ✅ Créer `/app/middleware/auth.js`
5. ✅ Créer `/app/views/register.ejs`
6. ✅ Ajouter les routes `/register` (GET/POST) dans server.js
7. ✅ Intégrer le middleware dans server.js
8. ✅ Modifier `GET /` pour utiliser la progression utilisateur
9. ✅ Modifier `POST /validate-flag` pour sauvegarder par user
10. ✅ Modifier `/app/views/partials/header.ejs`
11. ✅ Tests manuels complets
12. ✅ Ajustements et corrections

---

## 🔍 Points d'attention

### Gestion des erreurs
- Fichier CSV corrompu : Recréer avec headers
- Problème de permissions : Logger l'erreur
- Base64 invalide : Supprimer le cookie et rediriger

### Performance
- Lecture du CSV à chaque requête : Acceptable pour un CTF local
- Si nécessaire : Implémenter un cache en mémoire avec invalidation

### Sécurité intentionnelle (vulnérabilités)
- ✅ Cookie non-httpOnly → Accessible en JavaScript
- ✅ Username en base64 → Facilement décodable
- ✅ Pas de signature → Falsifiable
- ✅ Messages d'erreur explicites → Information leakage

**Ces vulnérabilités sont intentionnelles pour l'aspect pédagogique du CTF.**

---

## ✅ Critères de validation

L'implémentation sera considérée comme réussie si :

- ✅ Un utilisateur sans cookie est redirigé vers `/register`
- ✅ Un utilisateur peut s'inscrire avec un nom valide
- ✅ Le cookie est créé avec le username en base64
- ✅ La progression est sauvegardée dans `/app/data/progress.csv`
- ✅ Chaque utilisateur a sa propre progression indépendante
- ✅ La validation des flags met à jour le CSV correctement
- ✅ Un redémarrage du serveur conserve les données
- ✅ Les cookies manipulés sont détectés et rejetés
- ✅ Le design est cohérent avec le reste de l'application
- ✅ Tous les scénarios de test passent

---

## 📌 Notes supplémentaires

### Aspect pédagogique

Cette fonctionnalité enseigne aux participants :
- La manipulation des cookies
- L'encodage base64 (différence avec le chiffrement)
- L'importance de la validation côté serveur
- Les risques de faire confiance aux données client
- La persistance des données dans un fichier

### Évolutions futures possibles

- Leaderboard (classement des utilisateurs)
- Export de progression en JSON
- Stats globales (taux de réussite par challenge)
- Challenge bonus sur la manipulation de cookies
- Migration vers SQLite pour plus de robustesse

---

**Fin de la spécification**
