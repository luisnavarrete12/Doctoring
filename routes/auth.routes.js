// ==========================================
// RUTAS DE AUTENTICACIÓN
// Registro, Login, Recuperación de Contraseña
// ==========================================

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const crypto = require('crypto');

const db = require('../database/db');
const { enviarEmailRecuperacion } = require('../utils/emailService');
const authMiddleware = require('../middleware/auth');

// ==========================================
// RATE LIMITING (Prevenir ataques de fuerza bruta)
// ==========================================

// Limitar intentos de login: máximo 5 intentos por IP cada 15 minutos
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5,                    // 5 intentos
    message: {
        success: false,
        message: 'Demasiados intentos de inicio de sesión. Intenta de nuevo en 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// ==========================================
// 1. REGISTRO DE USUARIO
// POST /api/auth/register
// ==========================================

router.post('/register',
    // Validaciones
    [
        body('nombre')
            .trim()
            .notEmpty().withMessage('El nombre es obligatorio')
            .isLength({ min: 3 }).withMessage('El nombre debe tener al menos 3 caracteres'),
        
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Debe ser un email válido')
            .normalizeEmail(),
        
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
            .matches(/\d/).withMessage('La contraseña debe contener al menos un número'),// Revisar que es eso de d
            
        
        body('rol')
            .optional()
            .isIn(['admin', 'doctor', 'recepcionista']).withMessage('Rol inválido')
    ],
    async (req, res) => {
        try {
            // 1. Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const { nombre, email, password, rol = 'recepcionista' } = req.body;
            
            // 2. Verificar si el email ya existe
            const [existingUser] = await db.query(
                'SELECT id FROM usuarios WHERE email = ?',
                [email]
            );
            
            if (existingUser.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Este email ya está registrado'
                });
            }
            
            // 3. Encriptar la contraseña con bcrypt
            // - Genera un "salt" automáticamente
            // - 10 rondas de hashing (más rondas = más seguro pero más lento)
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // 4. Insertar usuario en la base de datos
            const [result] = await db.query(
                'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
                [nombre, email, hashedPassword, rol]
            );
            
            // 5. Generar token JWT para login automático
            const token = jwt.sign(
                {
                    id: result.insertId,
                    email: email,
                    rol: rol
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.status(201).json({
                success: true,
                message: 'Usuario registrado exitosamente',
                data: {
                    token,
                    usuario: {
                        id: result.insertId,
                        nombre,
                        email,
                        rol
                    }
                }
            });
            
        } catch (error) {
            console.error('Error en registro:', error);
            res.status(500).json({
                success: false,
                message: 'Error al registrar usuario'
            });
        }
    }
);

// ==========================================
// 2. LOGIN
// POST /api/auth/login
// ==========================================

router.post('/login',
    loginLimiter, // Aplicar rate limiting
    [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail(),
        
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
    ],
    async (req, res) => {
        try {
            // 1. Verificar errores de validación
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const { email, password } = req.body;
            
            // 2. Buscar usuario por email
            const [users] = await db.query(
                'SELECT id, nombre, email, password, rol, activo FROM usuarios WHERE email = ?',
                [email]
            );
            
            if (users.length === 0) {
                return res.status(401).json({
                    success: false,
                    message: 'Email o contraseña incorrectos'
                });
            }
            
            const user = users[0];
            
            // 3. Verificar si el usuario está activo
            if (!user.activo) {
                return res.status(403).json({
                    success: false,
                    message: 'Tu cuenta ha sido desactivada. Contacta al administrador.'
                });
            }
            
            // 4. Comparar contraseña con bcrypt
            // bcrypt.compare() hace el hash de la contraseña ingresada
            // y la compara con el hash almacenado en la BD
            const passwordMatch = await bcrypt.compare(password, user.password);
            
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Email o contraseña incorrectos'
                });
            }
            
            // 5. Generar token JWT
            const token = jwt.sign(
                {
                    id: user.id,
                    email: user.email,
                    rol: user.rol
                },
                process.env.JWT_SECRET,
                { expiresIn: process.env.JWT_EXPIRES_IN }
            );
            
            res.json({
                success: true,
                message: 'Login exitoso',
                data: {
                    token,
                    usuario: {
                        id: user.id,
                        nombre: user.nombre,
                        email: user.email,
                        rol: user.rol
                    }
                }
            });
            
        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error al iniciar sesión'
            });
        }
    }
);

// ==========================================
// 3. SOLICITAR RECUPERACIÓN DE CONTRASEÑA
// POST /api/auth/forgot-password
// ==========================================

router.post('/forgot-password',
    [
        body('email')
            .trim()
            .notEmpty().withMessage('El email es obligatorio')
            .isEmail().withMessage('Email inválido')
            .normalizeEmail()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const { email } = req.body;
            
            // 1. Buscar usuario por email
            const [users] = await db.query(
                'SELECT id, nombre FROM usuarios WHERE email = ?',
                [email]
            );
            
            // Por seguridad, siempre responder lo mismo aunque el email no exista
            // Esto previene que atacantes sepan qué emails están registrados
            if (users.length === 0) {
                return res.json({
                    success: true,
                    message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
                });
            }
            
            const user = users[0];
            
            // 2. Generar token único de recuperación
            // crypto.randomBytes genera bytes aleatorios
            // .toString('hex') los convierte a string hexadecimal
            const resetToken = crypto.randomBytes(32).toString('hex');
            
            // 3. Calcular fecha de expiración (1 hora desde ahora)
            const expiraEn = new Date(Date.now() + 60 * 60 * 1000); // +1 hora
            
            // 4. Guardar token en la base de datos
            await db.query(
                'INSERT INTO password_resets (usuario_id, token, expira_en) VALUES (?, ?, ?)',
                [user.id, resetToken, expiraEn]
            );
            
            // 5. Enviar email con el token
            await enviarEmailRecuperacion(email, resetToken);
            
            res.json({
                success: true,
                message: 'Si el email existe, recibirás instrucciones para recuperar tu contraseña'
            });
            
        } catch (error) {
            console.error('Error en forgot-password:', error);
            res.status(500).json({
                success: false,
                message: 'Error al procesar la solicitud'
            });
        }
    }
);

// ==========================================
// 4. RESTABLECER CONTRASEÑA
// POST /api/auth/reset-password
// ==========================================

router.post('/reset-password',
    [
        body('token')
            .notEmpty().withMessage('Token es obligatorio'),
        
        body('password')
            .notEmpty().withMessage('La contraseña es obligatoria')
            .isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres')
            .matches(/\d/).withMessage('La contraseña debe contener al menos un número')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    errors: errors.array()
                });
            }
            
            const { token, password } = req.body;
            
            // 1. Buscar el token en la base de datos
            const [resets] = await db.query(
                'SELECT * FROM password_resets WHERE token = ? AND usado = FALSE AND expira_en > NOW()',
                [token]
            );
            
            if (resets.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Token inválido o expirado'
                });
            }
            
            const reset = resets[0];
            
            // 2. Encriptar la nueva contraseña
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // 3. Actualizar la contraseña del usuario
            await db.query(
                'UPDATE usuarios SET password = ? WHERE id = ?',
                [hashedPassword, reset.usuario_id]
            );
            
            // 4. Marcar el token como usado
            await db.query(
                'UPDATE password_resets SET usado = TRUE WHERE id = ?',
                [reset.id]
            );
            
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
            
        } catch (error) {
            console.error('Error en reset-password:', error);
            res.status(500).json({
                success: false,
                message: 'Error al restablecer contraseña'
            });
        }
    }
);

// ==========================================
// 5. OBTENER PERFIL DEL USUARIO ACTUAL
// GET /api/auth/me
// (Requiere autenticación)
// ==========================================

router.get('/me', authMiddleware, async (req, res) => {
    try {
        // req.user viene del authMiddleware
        const [users] = await db.query(
            'SELECT id, nombre, email, rol, fecha_creacion FROM usuarios WHERE id = ?',
            [req.user.id]
        );
        
        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: users[0]
        });
        
    } catch (error) {
        console.error('Error al obtener perfil:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener perfil'
        });
    }
});

module.exports = router;