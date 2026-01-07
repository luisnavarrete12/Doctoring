// ==========================================
// CONFIGURACIÓN
// ==========================================

const API_URL = 'http://localhost:3000/api';

// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

/**
 * Muestra un mensaje de alerta
 */
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    
    // Ocultar después de 5 segundos
    setTimeout(() => {
        alert.className = 'alert';
    }, 5000);
}

/**
 * Muestra error en un campo específico
 */
function showFieldError(fieldId, message) {
    const input = document.getElementById(fieldId);
    const error = document.getElementById(`${fieldId}-error`);
    
    input.classList.add('error');
    error.textContent = message;
    error.classList.add('show');
}

/**
 * Limpia todos los errores de campos
 */
function clearFieldErrors() {
    document.querySelectorAll('.error-message').forEach(error => {
        error.classList.remove('show');
    });
    document.querySelectorAll('input').forEach(input => {
        input.classList.remove('error');
    });
}

/**
 * Valida email con regex
 */
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

/**
 * Guarda el token en localStorage
 */
function saveToken(token) {
    localStorage.setItem('token', token);
}

/**
 * Obtiene el token de localStorage
 */
function getToken() {
    return localStorage.getItem('token');
}

/**
 * Elimina el token (logout)
 */
function removeToken() {
    localStorage.removeItem('token');
}

/**
 * Verifica si el usuario está autenticado
 */
function isAuthenticated() {
    return !!getToken();
}

// ==========================================
// MANEJO DE LOGIN
// ==========================================

async function handleLogin() {
    try {
        clearFieldErrors();
        
        // 1. Obtener valores
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // 2. Validaciones frontend
        let hasError = false;
        
        if (!email) {
            showFieldError('email', 'El email es obligatorio');
            hasError = true;
        } else if (!validateEmail(email)) {
            showFieldError('email', 'Email inválido');
            hasError = true;
        }
        
        if (!password) {
            showFieldError('password', 'La contraseña es obligatoria');
            hasError = true;
        }
        
        if (hasError) return;
        
        // 3. Mostrar loading
        const btn = document.getElementById('login-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        // 4. Hacer petición al backend
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        // 5. Quitar loading
        btn.classList.remove('loading');
        btn.disabled = false;
        
        // 6. Manejar respuesta
        if (data.success) {
            // Guardar token
            saveToken(data.data.token);
            
            // Guardar info del usuario
            localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
            
            showAlert('¡Bienvenido! Redirigiendo...', 'success');
            
            // Redirigir al dashboard después de 1 segundo
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            showAlert(data.message || 'Error al iniciar sesión', 'error');
        }
        
    } catch (error) {
        console.error('Error en login:', error);
        showAlert('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
        
        const btn = document.getElementById('login-btn');
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ==========================================
// MANEJO DE REGISTRO
// ==========================================

async function handleRegister() {
    try {
        clearFieldErrors();
        
        // 1. Obtener valores
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rol = document.getElementById('rol').value;
        
        // 2. Validaciones frontend
        let hasError = false;
        
        if (!nombre || nombre.length < 3) {
            showFieldError('nombre', 'El nombre debe tener al menos 3 caracteres');
            hasError = true;
        }
        
        if (!email) {
            showFieldError('email', 'El email es obligatorio');
            hasError = true;
        } else if (!validateEmail(email)) {
            showFieldError('email', 'Email inválido');
            hasError = true;
        }
        
        if (!password || password.length < 6) {
            showFieldError('password', 'La contraseña debe tener al menos 6 caracteres');
            hasError = true;
        } else if (!/\d/.test(password)) {
            showFieldError('password', 'La contraseña debe contener al menos un número');
            hasError = true;
        }
        
        if (hasError) return;
        
        // 3. Mostrar loading
        const btn = document.getElementById('register-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        // 4. Hacer petición al backend
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password, rol })
        });
        
        const data = await response.json();
        
        // 5. Quitar loading
        btn.classList.remove('loading');
        btn.disabled = false;
        
        // 6. Manejar respuesta
        if (data.success) {
            // Guardar token (login automático)
            saveToken(data.data.token);
            localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
            
            showAlert('¡Cuenta creada! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            if (data.errors) {
                // Mostrar errores de validación del backend
                data.errors.forEach(err => {
                    const fieldId = err.param || err.path;
                    if (fieldId) {
                        showFieldError(fieldId, err.msg);
                    }
                });
            } else {
                showAlert(data.message || 'Error al crear cuenta', 'error');
            }
        }
        
    } catch (error) {
        console.error('Error en registro:', error);
        showAlert('Error de conexión. Verifica que el servidor esté corriendo.', 'error');
        
        const btn = document.getElementById('register-btn');
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ==========================================
// MANEJO DE RECUPERACIÓN DE CONTRASEÑA
// ==========================================

async function handleForgotPassword() {
    try {
        clearFieldErrors();
        
        // 1. Obtener email
        const email = document.getElementById('email').value.trim();
        
        // 2. Validar
        if (!email) {
            showFieldError('email', 'El email es obligatorio');
            return;
        }
        
        if (!validateEmail(email)) {
            showFieldError('email', 'Email inválido');
            return;
        }
        
        // 3. Mostrar loading
        const btn = document.getElementById('forgot-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        // 4. Hacer petición
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        // 5. Quitar loading
        btn.classList.remove('loading');
        btn.disabled = false;
        
        // 6. Mostrar mensaje
        if (data.success) {
            showAlert('Revisa tu email. Te hemos enviado instrucciones para recuperar tu contraseña.', 'success');
            
            // Limpiar formulario
            document.getElementById('email').value = '';
        } else {
            showAlert(data.message || 'Error al enviar email', 'error');
        }
        
    } catch (error) {
        console.error('Error en forgot password:', error);
        showAlert('Error de conexión', 'error');
        
        const btn = document.getElementById('forgot-btn');
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}

// ==========================================
// LOGOUT
// ==========================================

function logout() {
    removeToken();
    localStorage.removeItem('usuario');
    window.location.href = 'login.html';
}

// ==========================================
// PROTEGER PÁGINAS (index.html)
// ==========================================

function protectPage() {
    if (!isAuthenticated()) {
        window.location.href = 'login.html';
    }
}

// ==========================================
// OBTENER INFO DEL USUARIO
// ==========================================

function getCurrentUser() {
    const userStr = localStorage.getItem('usuario');
    return userStr ? JSON.parse(userStr) : null;
}

// Añadir esto al final de auth.js
document.addEventListener('DOMContentLoaded', () => {
    const registerBtn = document.getElementById('register-btn');
    if (registerBtn) {
        registerBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Evita que la página se recargue
            handleRegister();
        });
    }
});