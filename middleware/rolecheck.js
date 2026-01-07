// ==========================================
// MIDDLEWARE DE VERIFICACIÓN DE ROLES
// Verifica que el usuario tenga el rol necesario
// ==========================================

/**
 * Middleware que verifica si el usuario tiene uno de los roles permitidos
 * @param {Array} rolesPermitidos - Array de roles que pueden acceder
 * @example roleCheck(['admin', 'doctor'])
 */
const roleCheck = (rolesPermitidos) => {
    return (req, res, next) => {
        // 1. Verificar que req.user existe (debe pasar por authMiddleware primero)
        if (!req.user || !req.user.rol) {
            return res.status(403).json({
                success: false,
                message: 'No se pudo verificar tu rol de usuario.'
            });
        }
        
        // 2. Verificar si el rol del usuario está en la lista de roles permitidos
        if (!rolesPermitidos.includes(req.user.rol)) {
            return res.status(403).json({
                success: false,
                message: `Acceso denegado. Requiere rol: ${rolesPermitidos.join(' o ')}`
            });
        }
        
        // 3. El usuario tiene el rol correcto, continuar
        next();
    };
};

module.exports = roleCheck;