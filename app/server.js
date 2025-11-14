const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = 3000;

// Configuration
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// Génération des flags au runtime
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

// Page d'accueil avec dashboard
app.get('/', (req, res) => {
    res.render('index', {
        foundFlags: serverState.foundFlags,
        totalPoints: serverState.totalPoints,
        challenges: serverState.challenges,
        message: null
    });
});

// Validation des flags
app.post('/validate-flag', (req, res) => {
    const { flag } = req.body;
    let message = { type: 'error', text: 'Flag incorrect !' };

    // Vérifier si le flag correspond à un challenge
    for (let challengeId in CHALLENGE_FLAGS) {
        if (CHALLENGE_FLAGS[challengeId] === flag) {
            // Vérifier si le flag n'a pas déjà été trouvé
            if (!serverState.foundFlags.includes(parseInt(challengeId))) {
                serverState.foundFlags.push(parseInt(challengeId));
                serverState.totalPoints += 100;
                
                // Mettre à jour le statut du challenge
                const challenge = serverState.challenges.find(c => c.id === parseInt(challengeId));
                if (challenge) {
                    challenge.status = 'completed';
                }

                message = { type: 'success', text: `Flag correct ! +100 points - Challenge ${challengeId} complété !` };
            } else {
                message = { type: 'info', text: 'Vous avez déjà validé ce flag !' };
            }
            break;
        }
    }

    res.render('index', {
        foundFlags: serverState.foundFlags,
        totalPoints: serverState.totalPoints,
        challenges: serverState.challenges,
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
    res.render('challenge1', { doc: null });
});

// Route vulnérable IDOR - Pas de vérification d'autorisation
app.get('/challenge1/doc/:id', (req, res) => {
    const docId = parseInt(req.params.id);
    const doc = documents[docId];

    if (doc) {
        res.render('challenge1', { doc: doc });
    } else {
        res.render('challenge1', { doc: { error: 'Document non trouvé' } });
    }
});

// ==================== CHALLENGE 2 - PATH TRAVERSAL ====================

app.get('/challenge2', (req, res) => {
    res.render('challenge2');
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
    res.render('challenge2-admin', { flag: CHALLENGE_FLAGS[2] });
});

// ==================== CHALLENGE 3 - SQL INJECTION ====================

app.get('/challenge3', (req, res) => {
    res.render('challenge3', { message: null, error: null });
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
                error: `Erreur SQL: ${err.message}` 
            });
        } else if (row) {
            // Injection SQL réussie
            res.render('challenge3', { 
                message: { 
                    type: 'success', 
                    text: `Connexion réussie ! Bienvenue ${row.username}. 🏆 FLAG: ${CHALLENGE_FLAGS[3]}` 
                }, 
                error: null 
            });
        } else {
            res.render('challenge3', { 
                message: { type: 'error', text: 'Identifiants incorrects' }, 
                error: null 
            });
        }
    });
});

// ==================== CHALLENGE 4 - SQL INJECTION AVANCÉ ====================

app.get('/challenge4', (req, res) => {
    res.render('challenge4', { results: null, error: null });
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
                error: `Erreur SQL: ${err.message}` 
            });
        } else {
            res.render('challenge4', { 
                results: rows, 
                error: null 
            });
        }
    });
});

// ==================== CHALLENGE 5 - BROKEN AUTHENTICATION ====================

app.get('/challenge5', (req, res) => {
    res.render('challenge5', { message: null });
});

// Route avec faiblesses d'authentification
app.post('/challenge5/login', (req, res) => {
    const { username, password } = req.body;

    // Messages d'erreur révélateurs
    if (username === 'admin') {
        if (password === '0123456789') {
            // Authentification réussie
            res.cookie('auth_token', 'admin_token_12345', { httpOnly: false });
            res.cookie('user_role', 'administrator', { httpOnly: false });
            res.render('challenge5', { 
                message: { 
                    type: 'success', 
                    text: `Connexion réussie ! 🏆 FLAG: ${CHALLENGE_FLAGS[5]}` 
                } 
            });
        } else {
            // Message révélateur : l'utilisateur existe
            res.cookie('debug_info', 'user_exists', { httpOnly: false });
            res.render('challenge5', { 
                message: { 
                    type: 'error', 
                    text: 'L\'utilisateur admin existe mais le mot de passe est incorrect' 
                } 
            });
        }
    } else if (username === 'root' || username === 'test') {
        res.render('challenge5', { 
            message: { 
                type: 'error', 
                text: `L\'utilisateur ${username} n\'a pas les permissions nécessaires` 
            } 
        });
    } else {
        res.render('challenge5', { 
            message: { 
                type: 'error', 
                text: 'Utilisateur inconnu dans le système' 
            } 
        });
    }
});

// ==================== CHALLENGE 6 - XSS ====================

app.get('/challenge6', (req, res) => {
    // Cookie avec le flag accessible via JavaScript
    res.cookie('flag', CHALLENGE_FLAGS[6], { httpOnly: false });
    res.render('challenge6', { comments: comments });
});

// Route vulnérable XSS - Pas de sanitisation
app.post('/challenge6/comment', (req, res) => {
    const { author, text } = req.body;

    // VULNÉRABLE : Stockage direct sans sanitisation
    comments.push({ author: author, text: text });

    res.cookie('flag', CHALLENGE_FLAGS[6], { httpOnly: false });
    res.render('challenge6', { comments: comments });
});

// ==================== CHALLENGE 7 - GIT SECRETS ====================

app.get('/challenge7', (req, res) => {
    res.render('challenge7');
});

// ==================== DÉMARRAGE DU SERVEUR ====================

app.listen(PORT, () => {
    console.log(`\n🚀 CTF Security Challenge démarré sur http://localhost:${PORT}`);
    console.log(`📊 Session UID: ${SESSION_UID}`);
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
