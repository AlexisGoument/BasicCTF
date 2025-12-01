const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const progressManager = require('./utils/progressManager');
const { requireUser } = require('./middleware/auth');

const app = express();
const PORT = 3000;

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Initialiser le système de progression
progressManager.initCSV();

// Middleware d'authentification (sauf pour /register)
app.use(requireUser);

// Génération des flags au runtime
const SESSION_UID = crypto.randomBytes(8).toString('hex');

const CHALLENGE_FLAGS = {
    1: `CTF{idor_access_${SESSION_UID}}`,
    2: `CTF{directory_traversal_${SESSION_UID}}`,
    3: `CTF{sql_auth_bypass_${SESSION_UID}}`,
    4: `CTF{sql_data_extract_${SESSION_UID}}`,
    5: `CTF{broken_auth_${SESSION_UID}}`,
    6: `CTF{xss_exploit_${SESSION_UID}}`,
    7: Buffer.from('Q1RGe2dpdF9zZWNyZXRzX2V4cG9zZWRfaW5faGlzdG9yeX0=', 'base64').toString('utf-8'),
    8: `CTF{advanced_enumeration_${SESSION_UID}}`
};

// Commentaires stockés en mémoire pour Challenge 6
let comments = [
    { author: 'Alice', text: 'Super application, merci !' },
    { author: 'Bob', text: 'Très utile pour apprendre' },
    { author: 'Charlie', text: 'J\'ai appris beaucoup' }
];

// Initialisation de la base de données SQLite
const db = new sqlite3.Database('./database.db', (err) => {
    if (err) {
        console.error('Erreur lors de la connexion à la base de données:', err);
    } else {
        console.log('Base de données SQLite connectée');
        initDatabase();
    }
});

function initDatabase() {
    // Créer la table users
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        email TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erreur création table users:', err);
        } else {
            // Insérer des données de test
            db.run(`DELETE FROM users`);
            const users = [
                ['admin', 'admin123', 'admin@example.com'],
                ['john', 'password123', 'john@example.com'],
                ['jane', 'secret456', 'jane@example.com'],
                ['bob', 'bob2023', 'bob@example.com']
            ];
            users.forEach(user => {
                db.run(`INSERT INTO users (username, password, email) VALUES (?, ?, ?)`, user);
            });
        }
    });

    // Créer la table flags_table
    db.run(`CREATE TABLE IF NOT EXISTS flags_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        flag_value TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Erreur création table flags_table:', err);
        } else {
            // Insérer le flag du challenge 4
            db.run(`DELETE FROM flags_table`);
            db.run(`INSERT INTO flags_table (flag_value) VALUES (?)`, [CHALLENGE_FLAGS[4]]);
        }
    });
}

// ==================== ROUTES ====================

// ==================== INSCRIPTION ====================

app.get('/register', (req, res) => {
    res.render('register', { error: null });
});

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
    if (progressManager.userExists(username)) {
        return res.render('register', {
            error: 'Ce nom d\'utilisateur existe déjà, choisissez-en un autre'
        });
    }
    
    // Créer l'utilisateur
    progressManager.createUser(username);
    
    // Créer le cookie encodé en base64
    const encodedUsername = Buffer.from(username).toString('base64');
    res.cookie('ctf_username', encodedUsername, {
        maxAge: 7 * 24 * 60 * 60 * 1000,  // 7 jours
        httpOnly: false,                   // Volontairement vulnérable
        secure: false,                     // Pas de HTTPS requis
        sameSite: 'lax'
    });
    
    // Rediriger vers l'accueil
    res.redirect('/');
});

// ==================== DASHBOARD ====================

// Page d'accueil avec dashboard
app.get('/', (req, res) => {
    const progress = req.userProgress;
    
    // Charger tous les utilisateurs pour le leaderboard
    const allUsers = progressManager.loadAllUsers();
    
    // Calculer le nombre de challenges complétés pour chaque utilisateur
    const leaderboard = allUsers.map(user => {
        const completedCount = user.progress.split('').filter(c => c === '1').length;
        return {
            username: user.username,
            totalPoints: user.totalPoints,
            completedCount: completedCount,
            isCurrentUser: user.username === req.username
        };
    });
    
    // Trier par points décroissants, puis par nombre de challenges
    leaderboard.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        return b.completedCount - a.completedCount;
    });
    
    // Convertir "1010000" en tableau [1, 3]
    const foundFlags = [];
    for (let i = 0; i < progress.progress.length; i++) {
        if (progress.progress[i] === '1') {
            foundFlags.push(i + 1);
        }
    }
    
    // Liste des challenges
    const challenges = [
        { id: 1, name: 'Insecure Direct Object Reference', status: 'pending', points: 100 },
        { id: 2, name: 'Path Traversal', status: 'pending', points: 100 },
        { id: 3, name: 'SQL Injection', status: 'pending', points: 100 },
        { id: 4, name: 'SQL Injection Avancé', status: 'pending', points: 100 },
        { id: 5, name: 'Broken Authentication', status: 'pending', points: 100 },
        { id: 6, name: 'Cross-Site Scripting', status: 'pending', points: 100 },
        { id: 7, name: 'Git Secrets & Version Control Security', status: 'pending', points: 100 },
        { id: 8, name: 'Advanced Path Enumeration', status: 'pending', points: 100 }
    ];
    
    // Mettre à jour les statuts des challenges
    challenges.forEach(c => {
        c.status = foundFlags.includes(c.id) ? 'completed' : 'pending';
    });
    
    res.render('index', {
        username: req.username,
        foundFlags: foundFlags,
        totalPoints: progress.totalPoints,
        challenges: challenges,
        leaderboard: leaderboard,
        message: null
    });
});

// Validation des flags
app.post('/validate-flag', (req, res) => {
    const { flag } = req.body;
    const username = req.username;
    let message = { type: 'error', text: 'Flag incorrect !' };

    // Vérifier si le flag correspond à un challenge
    let challengeId = null;
    for (let id in CHALLENGE_FLAGS) {
        if (CHALLENGE_FLAGS[id] === flag) {
            challengeId = parseInt(id);
            break;
        }
    }
    
    if (challengeId) {
        // Vérifier si le flag n'a pas déjà été trouvé
        const progress = progressManager.getUserProgress(username);
        const bitIndex = challengeId - 1;
        
        if (progress.progress[bitIndex] === '1') {
            message = { type: 'info', text: 'Vous avez déjà validé ce flag !' };
        } else {
            // Marquer comme complété
            progressManager.updateProgress(username, bitIndex);
            message = { type: 'success', text: `Flag correct ! +100 points - Challenge ${challengeId} complété !` };
        }
    }
    
    // Recharger la progression
    const newProgress = progressManager.getUserProgress(username);
    
    // Convertir "1010000" en tableau [1, 3]
    const foundFlags = [];
    for (let i = 0; i < newProgress.progress.length; i++) {
        if (newProgress.progress[i] === '1') {
            foundFlags.push(i + 1);
        }
    }
    
    // Liste des challenges
    const challenges = [
        { id: 1, name: 'Insecure Direct Object Reference', status: 'pending', points: 100 },
        { id: 2, name: 'Path Traversal', status: 'pending', points: 100 },
        { id: 3, name: 'SQL Injection', status: 'pending', points: 100 },
        { id: 4, name: 'SQL Injection Avancé', status: 'pending', points: 100 },
        { id: 5, name: 'Broken Authentication', status: 'pending', points: 100 },
        { id: 6, name: 'Cross-Site Scripting', status: 'pending', points: 100 },
        { id: 7, name: 'Git Secrets & Version Control Security', status: 'pending', points: 100 },
        { id: 8, name: 'Advanced Path Enumeration', status: 'pending', points: 100 }
    ];
    
    // Mettre à jour les statuts
    challenges.forEach(c => {
        c.status = foundFlags.includes(c.id) ? 'completed' : 'pending';
    });
    
    // Charger tous les utilisateurs pour le leaderboard
    const allUsers = progressManager.loadAllUsers();
    
    // Calculer le nombre de challenges complétés pour chaque utilisateur
    const leaderboard = allUsers.map(user => {
        const completedCount = user.progress.split('').filter(c => c === '1').length;
        return {
            username: user.username,
            totalPoints: user.totalPoints,
            completedCount: completedCount,
            isCurrentUser: user.username === req.username
        };
    });
    
    // Trier par points décroissants, puis par nombre de challenges
    leaderboard.sort((a, b) => {
        if (b.totalPoints !== a.totalPoints) {
            return b.totalPoints - a.totalPoints;
        }
        return b.completedCount - a.completedCount;
    });

    res.render('index', {
        username: req.username,
        foundFlags: foundFlags,
        totalPoints: newProgress.totalPoints,
        challenges: challenges,
        leaderboard: leaderboard,
        message: message
    });
});

// ==================== CHALLENGE 1 - IDOR ====================

// Documents hardcodés
const documents = {
    0: { 
        id: 0, 
        title: 'Document Administrateur CONFIDENTIEL', 
        content: `Ce document est strictement réservé aux administrateurs.\n\n🏆 FLAG: ${CHALLENGE_FLAGS[1]}\n\nAccès non autorisé détecté. Cette ressource ne devrait pas être accessible sans contrôle d'accès approprié.`,
        confidential: true
    },
    1: { 
        id: 1, 
        title: 'Document public', 
        content: 'Ceci est un document public accessible à tous les utilisateurs.',
        confidential: false
    },
    2: { 
        id: 2, 
        title: 'Guide utilisateur', 
        content: 'Guide d\'utilisation de l\'application pour les utilisateurs standards.',
        confidential: false
    },
    3: { 
        id: 3, 
        title: 'FAQ générale', 
        content: 'Questions fréquemment posées et leurs réponses.',
        confidential: false
    },
    4: { 
        id: 4, 
        title: 'Données confidentielles', 
        content: 'Informations sensibles de l\'entreprise - Accès restreint aux managers.',
        confidential: true
    }
};

app.get('/challenge1', (req, res) => {
    res.render('challenge1', { doc: null, username: req.username });
});

// Route vulnérable IDOR - Pas de vérification d'autorisation
app.get('/challenge1/doc/:id', (req, res) => {
    const docId = parseInt(req.params.id);
    const doc = documents[docId];

    if (doc) {
        res.render('challenge1', { doc: doc, username: req.username });
    } else {
        res.render('challenge1', { doc: { error: 'Document non trouvé' }, username: req.username });
    }
});

// ==================== CHALLENGE 2 - PATH TRAVERSAL ====================

app.get('/challenge2', (req, res) => {
    res.render('challenge2', { username: req.username });
});

app.get('/challenge2/public', (req, res) => {
    res.send('<h1>Répertoire Public</h1><p>Contenu du répertoire public...</p>');
});

app.get('/challenge2/docs', (req, res) => {
    res.send('<h1>Répertoire Docs</h1><p>Documentation générale...</p>');
});

app.get('/challenge2/help', (req, res) => {
    res.send('<h1>Répertoire Help</h1><p>Aide et support...</p>');
});

// Route cachée - Découvrable via énumération
app.get('/challenge2/admin', (req, res) => {
    res.render('challenge2-admin', { flag: CHALLENGE_FLAGS[2], username: req.username });
});

// ==================== CHALLENGE 3 - SQL INJECTION ====================

app.get('/challenge3', (req, res) => {
    res.render('challenge3', { message: null, error: null, username: req.username });
});

// Route vulnérable SQL Injection - Concaténation directe
app.post('/challenge3/login', (req, res) => {
    const { username, password } = req.body;

    // VULNÉRABLE : Concaténation directe des paramètres
    const query = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`;

    db.get(query, [], (err, row) => {
        if (err) {
            // Exposer les erreurs SQL (vulnérabilité)
            res.render('challenge3', { 
                message: null, 
                error: `Erreur SQL: ${err.message}`,
                username: req.username
            });
        } else if (row) {
            // Injection SQL réussie
            res.render('challenge3', { 
                message: { 
                    type: 'success', 
                    text: `Connexion réussie ! Bienvenue ${row.username}. 🏆 FLAG: ${CHALLENGE_FLAGS[3]}` 
                }, 
                error: null,
                username: req.username
            });
        } else {
            res.render('challenge3', { 
                message: { type: 'error', text: 'Identifiants incorrects' }, 
                error: null,
                username: req.username
            });
        }
    });
});

// ==================== CHALLENGE 4 - SQL INJECTION AVANCÉ ====================

app.get('/challenge4', (req, res) => {
    res.render('challenge4', { results: null, error: null, username: req.username });
});

// Route vulnérable SQL Injection Avancé - Compatible sqlmap
app.post('/challenge4/search', (req, res) => {
    const { search } = req.body;

    // VULNÉRABLE : Concaténation directe des paramètres
    const query = `SELECT username, email FROM users WHERE username LIKE '%${search}%'`;

    db.all(query, [], (err, rows) => {
        if (err) {
            // Exposer les erreurs SQL (vulnérabilité)
            res.render('challenge4', { 
                results: null, 
                error: `Erreur SQL: ${err.message}`,
                username: req.username
            });
        } else {
            res.render('challenge4', { 
                results: rows, 
                error: null,
                username: req.username
            });
        }
    });
});

// ==================== CHALLENGE 5 - BROKEN AUTHENTICATION ====================

app.get('/challenge5', (req, res) => {
    res.render('challenge5', { message: null, username: req.username });
});

// Route avec faiblesses d'authentification
app.post('/challenge5/login', (req, res) => {
    const { username, password } = req.body;

    // Messages d'erreur révélateurs
    if (username === 'admin') {
        if (password === '0123456789') {
            // Authentification réussie
            res.render('challenge5', { 
                message: { 
                    type: 'success', 
                    text: `Connexion réussie ! 🏆 FLAG: ${CHALLENGE_FLAGS[5]}` 
                },
                username: req.username
            });
        } else {
            // Message révélateur : l'utilisateur existe
            res.render('challenge5', { 
                message: { 
                    type: 'error', 
                    text: 'L\'utilisateur admin existe mais le mot de passe est incorrect' 
                },
                username: req.username
            });
        }
    } else if (username === 'root' || username === 'test') {
        res.render('challenge5', { 
            message: { 
                type: 'error', 
                text: `L\'utilisateur ${username} n\'a pas les permissions nécessaires` 
            },
            username: req.username
        });
    } else {
        res.render('challenge5', { 
            message: { 
                type: 'error', 
                text: 'Utilisateur inconnu dans le système' 
            },
            username: req.username
        });
    }
});

// ==================== CHALLENGE 6 - XSS ====================

app.get('/challenge6', (req, res) => {
    // Cookie avec le flag accessible via JavaScript
    res.cookie('flag', CHALLENGE_FLAGS[6], { httpOnly: false });
    res.render('challenge6', { comments: comments, username: req.username });
});

// Route vulnérable XSS - Pas de sanitisation
app.post('/challenge6/comment', (req, res) => {
    const { author, text } = req.body;

    // VULNÉRABLE : Stockage direct sans sanitisation
    comments.push({ author: author, text: text });

    res.cookie('flag', CHALLENGE_FLAGS[6], { httpOnly: false });
    res.render('challenge6', { comments: comments, username: req.username });
});

// ==================== CHALLENGE 7 - GIT SECRETS ====================

app.get('/challenge7', (req, res) => {
    res.render('challenge7', { username: req.username });
});

// ==================== CHALLENGE 8 - ADVANCED PATH ENUMERATION ====================

app.get('/challenge8', (req, res) => {
    res.render('challenge8', { username: req.username });
});

app.get('/challenge8/api', (req, res) => {
    res.send('<h1>API Endpoint</h1><p>API documentation...</p>');
});

app.get('/challenge8/assets', (req, res) => {
    res.send('<h1>Assets Directory</h1><p>Static assets...</p>');
});

app.get('/challenge8/files', (req, res) => {
    res.send('<h1>Files Directory</h1><p>File storage...</p>');
});

// Route cachée - Découvrable via énumération avancée
app.get('/challenge8/3rdparty', (req, res) => {
    res.render('challenge8-3rdparty', { flag: CHALLENGE_FLAGS[8], username: req.username });
});

// ==================== DÉMARRAGE DU SERVEUR ====================

app.listen(PORT, () => {
    console.log(`\n🚀 CTF Security Challenge démarré sur http://localhost:${PORT}`);
    console.log(`\n🏆 Flags générés pour cette session:`);
    console.log(`\n✅ Base de données initialisée`);
    console.log(`\n🎯 Bon courage pour les challenges !\n`);
});

// Gestion de la fermeture propre
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('\n👋 Base de données fermée.');
        process.exit(0);
    });
});
