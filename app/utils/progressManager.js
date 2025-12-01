const fs = require('fs');
const path = require('path');

const CSV_FILE = path.join(__dirname, '../data/progress.csv');
const CSV_HEADERS = 'username,progress,totalPoints,lastUpdate\n';

/**
 * Initialise le fichier CSV avec les headers si nécessaire
 */
function initCSV() {
    const dataDir = path.dirname(CSV_FILE);
    
    // Créer le dossier data s'il n'existe pas
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log('📁 Dossier /data créé');
    }
    
    // Créer le fichier CSV avec headers s'il n'existe pas
    if (!fs.existsSync(CSV_FILE)) {
        fs.writeFileSync(CSV_FILE, CSV_HEADERS, 'utf-8');
        console.log('📄 Fichier progress.csv créé');
    }
}

/**
 * Charge tous les utilisateurs depuis le CSV
 * @returns {Array} Tableau d'objets utilisateurs
 */
function loadAllUsers() {
    try {
        if (!fs.existsSync(CSV_FILE)) {
            throw new Error(`Fichier CSV introuvable: ${CSV_FILE}`);
        }
        
        const content = fs.readFileSync(CSV_FILE, 'utf-8');
        const lines = content.trim().split('\n');
        
        // Ignorer la ligne d'en-tête
        if (lines.length <= 1) {
            return [];
        }
        
        const users = [];
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;
            
            const [username, progress, totalPoints, lastUpdate] = line.split(',');
            users.push({
                username,
                progress,
                totalPoints: parseInt(totalPoints) || 0,
                lastUpdate
            });
        }
        
        return users;
    } catch (err) {
        console.error('❌ Erreur lors du chargement du CSV:', err.message);
        return [];
    }
}

/**
 * Récupère la progression d'un utilisateur spécifique
 * @param {string} username 
 * @returns {Object|null} Objet utilisateur ou null
 */
function getUserProgress(username) {
    const users = loadAllUsers();
    return users.find(u => u.username === username) || null;
}

/**
 * Vérifie si un utilisateur existe
 * @param {string} username 
 * @returns {boolean}
 */
function userExists(username) {
    return getUserProgress(username) !== null;
}

/**
 * Crée un nouvel utilisateur
 * @param {string} username 
 * @returns {boolean} True si création réussie
 */
function createUser(username) {
    try {
        const users = loadAllUsers();
        
        // Vérifier que l'utilisateur n'existe pas déjà
        if (users.some(u => u.username === username)) {
            console.log('⚠️ Utilisateur déjà existant:', username);
            return false;
        }
        
        // Ajouter le nouvel utilisateur
        const newUser = {
            username,
            progress: '0000000000',  // 10 challenges non complétés
            totalPoints: 0,
            lastUpdate: new Date().toISOString()
        };
        
        users.push(newUser);
        saveToCSV(users);
        
        console.log('✅ Utilisateur créé:', username);
        return true;
    } catch (err) {
        console.error('❌ Erreur lors de la création de l\'utilisateur:', err.message);
        return false;
    }
}

/**
 * Met à jour la progression d'un utilisateur (marque un challenge comme complété)
 * @param {string} username 
 * @param {number} bitIndex Index du bit (0-9 pour challenges 1-10)
 * @returns {boolean} True si mise à jour réussie
 */
function updateProgress(username, bitIndex) {
    try {
        const users = loadAllUsers();
        const userIndex = users.findIndex(u => u.username === username);
        
        if (userIndex === -1) {
            console.log('⚠️ Utilisateur non trouvé:', username);
            return false;
        }
        
        const user = users[userIndex];
        
        // Convertir le string en tableau de caractères
        const progressArray = user.progress.split('');
        
        // Vérifier si le challenge n'est pas déjà complété
        if (progressArray[bitIndex] === '1') {
            console.log('ℹ️ Challenge déjà complété pour', username);
            return true; // Pas une erreur, juste déjà fait
        }
        
        // Marquer le challenge comme complété
        progressArray[bitIndex] = '1';
        user.progress = progressArray.join('');
        
        // Ajouter 100 points
        user.totalPoints += 100;
        
        // Mettre à jour le timestamp
        user.lastUpdate = new Date().toISOString();
        
        // Sauvegarder
        saveToCSV(users);
        
        console.log(`✅ Challenge ${bitIndex + 1} complété pour ${username} - Total: ${user.totalPoints} points`);
        return true;
    } catch (err) {
        console.error('❌ Erreur lors de la mise à jour:', err.message);
        return false;
    }
}

/**
 * Sauvegarde tous les utilisateurs dans le CSV
 * @param {Array} users Tableau d'objets utilisateurs
 */
function saveToCSV(users) {
    try {
        let content = CSV_HEADERS;
        
        users.forEach(user => {
            content += `${user.username},${user.progress},${user.totalPoints},${user.lastUpdate}\n`;
        });
        
        fs.writeFileSync(CSV_FILE, content, 'utf-8');
    } catch (err) {
        console.error('❌ Erreur lors de la sauvegarde du CSV:', err.message);
        throw err;
    }
}

module.exports = {
    initCSV,
    loadAllUsers,
    getUserProgress,
    userExists,
    createUser,
    updateProgress,
    saveToCSV
};
