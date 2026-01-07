// ==========================================
// SERVICIO PARA ENVIAR EMAILS
// Usado para recuperación de contraseña
// ==========================================

const nodemailer = require('nodemailer');

/**
 * Configuración del transporter de nodemailer
 * Usa las credenciales del .env
 */
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,     // smtp.gmail.com
    port: process.env.EMAIL_PORT,     // 587
    secure: false,                     // true para puerto 465, false para otros
    auth: {
        user: process.env.EMAIL_USER,      // tu email
        pass: process.env.EMAIL_PASSWORD   // tu app password
    }
});

/**
 * Envía un email de recuperación de contraseña
 * @param {string} email - Email del destinatario
 * @param {string} token - Token de recuperación
 */
const enviarEmailRecuperacion = async (email, token) => {
    try {
        // URL completa para resetear contraseña
        const resetURL = `http://localhost:3000/reset-password.html?token=${token}`;
        
        // Configuración del email
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Recuperación de Contraseña - Clínica San José',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #3b82f6;">Recuperación de Contraseña</h2>
                    <p>Has solicitado restablecer tu contraseña.</p>
                    <p>Haz clic en el siguiente botón para crear una nueva contraseña:</p>
                    <a href="${resetURL}" 
                       style="display: inline-block; padding: 12px 24px; background: #3b82f6; 
                              color: white; text-decoration: none; border-radius: 8px; 
                              margin: 20px 0;">
                        Restablecer Contraseña
                    </a>
                    <p style="color: #666; font-size: 14px;">
                        Este enlace es válido por <strong>1 hora</strong>.
                    </p>
                    <p style="color: #666; font-size: 14px;">
                        Si no solicitaste esto, puedes ignorar este email.
                    </p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="color: #999; font-size: 12px;">
                        Clínica San José - Sistema de Gestión de Pacientes
                    </p>
                </div>
            `
        };
        
        // Enviar el email
        const info = await transporter.sendMail(mailOptions);
        console.log('Email enviado:', info.messageId);
        return true;
        
    } catch (error) {
        console.error('Error al enviar email:', error);
        throw new Error('No se pudo enviar el email de recuperación');
    }
};

module.exports = { enviarEmailRecuperacion };