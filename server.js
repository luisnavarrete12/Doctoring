const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const pacientesRoutes = require('./routes/pacientes.routes');
const authRoutes = require('./routes/auth.routes'); // ⭐ NUEVO

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Rutas
app.use('/api/auth', authRoutes); // ⭐ NUEVO - Rutas de autenticación
app.use('/api', pacientesRoutes);

// Ruta raíz redirige al login
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta no encontrada'
    });
});

app.listen(PORT, () => {
    console.log(`
    ╔════════════════════════════════════════╗
    ║   🏥 Servidor corriendo en:           ║
    ║   http://localhost:${PORT}                ║
    ║                                        ║
    ║   🔐 Login:                            ║
    ║   http://localhost:${PORT}/login.html     ║
    ║                                        ║
    ║   📊 Dashboard:                        ║
    ║   http://localhost:${PORT}/index.html     ║
    ╚════════════════════════════════════════╝
    `);
});