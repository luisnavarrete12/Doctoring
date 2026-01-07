// ==========================================
// MIDDLEWARE DE AUTENTICACIÓN JWT
// Verifica que el usuario tenga un token válido
// ==========================================

const jwt = require('jsonwebtoken');

/**
 * Middleware que verifica si el usuario está autenticado
 * Lee el token del header "Authorization: Bearer TOKEN"
 * Si el token es válido, agrega req.user con la info del usuario
 */
const authMiddleware = (req, res, next) => {
    try {
        // 1. Obtener el token del header Authorization
        const authHeader = req.headers.authorization;
        
        // 2. Verificar que exista el header y tenga formato "Bearer TOKEN"
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Token no proporcionado. Debes iniciar sesión.'
            });
        }
        
        // 3. Extraer el token (quitamos "Bearer " del inicio)
        const token = authHeader.substring(7); // "Bearer " tiene 7 caracteres
        
        // 4. Verificar y decodificar el token usando JWT_SECRET
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 5. El token es válido, guardar info del usuario en req.user
        // decoded contiene: { id, email, rol, iat, exp }
        req.user = {
            id: decoded.id,
            email: decoded.email,
            rol: decoded.rol
        };
        
        // 6. Continuar al siguiente middleware o ruta
        next();
        
    } catch (error) {
        // Si el token expiró o es inválido
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expirado. Vuelve a iniciar sesión.'
            });
        }
        
        return res.status(401).json({
            success: false,
            message: 'Token inválido. Acceso denegado.'
        });
    }
};

module.exports = authMiddleware;