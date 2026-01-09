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
    if (!alert) return;
    
    alert.textContent = message;
    alert.className = `alert alert-${type} show`;
    
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
    
    if (input) input.classList.add('error');
    if (error) {
        error.textContent = message;
        error.classList.add('show');
    }
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
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
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
        
        const btn = document.getElementById('login-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        btn.classList.remove('loading');
        btn.disabled = false;
        
        if (data.success) {
            saveToken(data.data.token);
            localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
            
            showAlert('¡Bienvenido! Redirigiendo...', 'success');
            
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
        
        const nombre = document.getElementById('nombre').value.trim();
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const rol = document.getElementById('rol').value;
        
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
        
        const btn = document.getElementById('register-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ nombre, email, password, rol })
        });
        
        const data = await response.json();
        
        btn.classList.remove('loading');
        btn.disabled = false;
        
        if (data.success) {
            saveToken(data.data.token);
            localStorage.setItem('usuario', JSON.stringify(data.data.usuario));
            
            showAlert('¡Cuenta creada! Redirigiendo...', 'success');
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } else {
            if (data.errors) {
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
        
        const email = document.getElementById('email').value.trim();
        
        if (!email) {
            showFieldError('email', 'El email es obligatorio');
            return;
        }
        
        if (!validateEmail(email)) {
            showFieldError('email', 'Email inválido');
            return;
        }
        
        const btn = document.getElementById('forgot-btn');
        btn.classList.add('loading');
        btn.disabled = true;
        
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        btn.classList.remove('loading');
        btn.disabled = false;
        
        if (data.success) {
            showAlert('Revisa tu email. Te hemos enviado instrucciones para recuperar tu contraseña.', 'success');
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