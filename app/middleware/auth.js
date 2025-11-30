const progressManager = require('../utils/progressManager');

/**
 * Middleware pour vérifier qu'un utilisateur est connecté
 * Vérifie la présence et la validité du cookie ctf_username
 */
function requireUser(req, res, next) {
    // Routes publiques (pas besoin de cookie)
    const publicPaths = ['/register', '/css', '/js', '/images'];
    if (publicPaths.some(path => req.path.startsWith(path))) {
        return next();
    }
    
    const encodedUsername = req.cookies.ctf_username;
    
    // Pas de cookie : rediriger vers l'inscription
    if (!encodedUsername) {
        return res.redirect('/register');
    }
    
    // Décoder le username depuis base64
    let username;
    try {
        username = Buffer.from(encodedUsername, 'base64').toString('utf-8');
    } catch (err) {
        // Cookie corrompu ou invalide
        console.log(`⚠️ Cookie invalide (décodage base64 échoué): encodedUsername=${encodedUsername}`);
        res.clearCookie('ctf_username');
        return res.redirect('/register');
    }
    
    // Vérifier que l'utilisateur existe dans le CSV
    if (!progressManager.userExists(username)) {
        console.log('⚠️ Utilisateur inexistant dans le CSV:', username);
        res.clearCookie('ctf_username');
        return res.redirect('/register');
    }
    
    // Charger la progression de l'utilisateur
    const userProgress = progressManager.getUserProgress(username);
    
    // Attacher les infos de l'utilisateur à la requête
    req.username = username;
    req.userProgress = userProgress;
    
    next();
}

module.exports = { requireUser };
