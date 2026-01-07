// Importar mysql2 y dotenv
const mysql = require('mysql2');
require('dotenv').config();

// Crear el pool de conexiones
// Un "pool" es un conjunto de conexiones reutilizables (más eficiente)
const pool = mysql.createPool({
    host: process.env.DB_HOST,       // localhost
    user: process.env.DB_USER,       // root
    password: process.env.DB_PASSWORD, // tu contraseña
    database: process.env.DB_NAME,   // clinica_db
    port: process.env.DB_PORT,       // 3306
    waitForConnections: true,        // Espera si todas las conexiones están ocupadas
    connectionLimit: 10,             // Máximo 10 conexiones simultáneas
    queueLimit: 0                    // Sin límite de cola
});

// Convertir el pool a promesas (para usar async/await)
const promisePool = pool.promise();

// Verificar conexión al iniciar
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Error conectando a MySQL:', err.message);
        return;
    }
    console.log('✅ Conectado a MySQL correctamente');
    connection.release(); // Liberar la conexión de vuelta al pool
});

// Exportar el pool para usarlo en otros archivos
module.exports = promisePool;