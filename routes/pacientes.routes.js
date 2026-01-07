const express = require('express');
const router = express.Router();
const db = require('../database/db');
const authMiddleware = require('../middleware/auth'); // ⭐ NUEVO
const roleCheck = require('../middleware/roleCheck');   // ⭐ NUEVO

// ==========================================
// TODAS LAS RUTAS AHORA REQUIEREN AUTENTICACIÓN
// ==========================================

// 1. OBTENER TODOS LOS PACIENTES
router.get('/pacientes', authMiddleware, async (req, res) => {
    try {
        // Mostrar quién creó cada paciente
        const [rows] = await db.query(`
            SELECT p.*, u.nombre as creado_por_nombre 
            FROM pacientes p
            LEFT JOIN usuarios u ON p.creado_por = u.id
            ORDER BY p.fecha_registro DESC
        `);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener pacientes'
        });
    }
});

// 2. OBTENER UN PACIENTE POR ID
router.get('/pacientes/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        
        const [rows] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Paciente no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener paciente'
        });
    }
});

// 3. CREAR NUEVO PACIENTE
// Solo admins y doctores pueden crear
router.post('/pacientes', 
    authMiddleware, 
    roleCheck(['admin', 'doctor']), // ⭐ NUEVO
    async (req, res) => {
        try {
            const { nombre, apellido, edad, telefono, email, diagnostico } = req.body;
            
            if (!nombre || !apellido || !edad) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, apellido y edad son obligatorios'
                });
            }
            
            // Guardar quién creó el paciente
            const [result] = await db.query(
                'INSERT INTO pacientes (nombre, apellido, edad, telefono, email, diagnostico, creado_por) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [nombre, apellido, edad, telefono, email, diagnostico, req.user.id] // ⭐ req.user.id viene del middleware
            );
            
            res.status(201).json({
                success: true,
                message: 'Paciente creado exitosamente',
                data: {
                    id: result.insertId,
                    nombre,
                    apellido,
                    edad,
                    telefono,
                    email,
                    diagnostico
                }
            });
        } catch (error) {
            console.error('Error al crear paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear paciente'
            });
        }
    }
);

// 4. ACTUALIZAR PACIENTE
// Solo admins y doctores pueden actualizar
router.put('/pacientes/:id', 
    authMiddleware,
    roleCheck(['admin', 'doctor']), // ⭐ NUEVO
    async (req, res) => {
        try {
            const { id } = req.params;
            const { nombre, apellido, edad, telefono, email, diagnostico } = req.body;
            
            const [existing] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);
            
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            await db.query(
                'UPDATE pacientes SET nombre = ?, apellido = ?, edad = ?, telefono = ?, email = ?, diagnostico = ? WHERE id = ?',
                [nombre, apellido, edad, telefono, email, diagnostico, id]
            );
            
            res.json({
                success: true,
                message: 'Paciente actualizado exitosamente',
                data: {
                    id,
                    nombre,
                    apellido,
                    edad,
                    telefono,
                    email,
                    diagnostico
                }
            });
        } catch (error) {
            console.error('Error al actualizar paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar paciente'
            });
        }
    }
);

// 5. ELIMINAR PACIENTE
// Solo admins pueden eliminar
router.delete('/pacientes/:id', 
    authMiddleware,
    roleCheck(['admin']), // ⭐ SOLO ADMINS
    async (req, res) => {
        try {
            const { id } = req.params;
            
            const [existing] = await db.query('SELECT * FROM pacientes WHERE id = ?', [id]);
            
            if (existing.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            await db.query('DELETE FROM pacientes WHERE id = ?', [id]);
            
            res.json({
                success: true,
                message: 'Paciente eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error al eliminar paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar paciente'
            });
        }
    }
);

module.exports = router;