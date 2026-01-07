// ==========================================
// IMPORTAR FUNCIONES DE AUTENTICACIÓN
// ==========================================

// Cargar el script de auth
if (typeof getToken === 'undefined') {
    const script = document.createElement('script');
    script.src = 'js/auth.js';
    document.head.appendChild(script);
}

// ==========================================
// PROTEGER LA PÁGINA
// ==========================================

// Verificar que el usuario esté autenticado
if (!localStorage.getItem('token')) {
    window.location.href = 'login.html';
}

// ==========================================
// FUNCIÓN PARA HACER PETICIONES CON TOKEN
// ==========================================

/**
 * Hace una petición fetch con el token JWT
 */
async function fetchWithAuth(url, options = {}) {
    const token = localStorage.getItem('token');
    
    // Agregar el token al header Authorization
    const authOptions = {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    };
    
    try {
        const response = await fetch(url, authOptions);
        
        // Si el token expiró (401), redirigir al login
        if (response.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            alert('Tu sesión ha expirado. Vuelve a iniciar sesión.');
            window.location.href = 'login.html';
            return null;
        }
        
        return response;
        
    } catch (error) {
        console.error('Error en petición:', error);
        throw error;
    }
}

// ==========================================
// ACTUALIZAR TODAS LAS FUNCIONES PARA USAR fetchWithAuth
// ==========================================


// ==========================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ==========================================

// URL base de la API
const API_URL = 'http://localhost:3000/api';

// Variable para saber si estamos editando
let isEditing = false;
let editingId = null;

// ==========================================
// ELEMENTOS DEL DOM
// ==========================================

// Formulario
const form = document.getElementById('paciente-form');
const formTitle = document.getElementById('form-title');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-btn');

// Inputs del formulario
const idInput = document.getElementById('paciente-id');
const nombreInput = document.getElementById('nombre');
const apellidoInput = document.getElementById('apellido');
const edadInput = document.getElementById('edad');
const telefonoInput = document.getElementById('telefono');
const emailInput = document.getElementById('email');
const diagnosticoInput = document.getElementById('diagnostico');

// Tabla
const tbody = document.getElementById('pacientes-tbody');
const loading = document.getElementById('loading');
const emptyMessage = document.getElementById('empty-message');
const searchInput = document.getElementById('search');

// Toast
const toast = document.getElementById('toast');

// ==========================================
// FUNCIONES DE UI (NOTIFICACIONES)
// ==========================================

/**
 * Muestra una notificación toast
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error)
 */
function showToast(message, type = 'success') {
    toast.textContent = message;
    toast.className = `toast show ${type}`;
    
    // Ocultar después de 3 segundos
    setTimeout(() => {
        toast.className = 'toast';
    }, 3000);
}

// ==========================================
// FUNCIONES DE LA API (CRUD)
// ==========================================

/**
 * Obtiene todos los pacientes desde la API
 */
async function getPacientes() {
    try {
        // Mostrar loading
        loading.style.display = 'block';
        emptyMessage.style.display = 'none';
        tbody.innerHTML = '';
        
        // Hacer petición GET a la API
        const response = await fetchWithAuth(`${API_URL}/pacientes`);
        const data = await response.json();
        
        // Ocultar loading
        loading.style.display = 'none';
        
        // Si hay pacientes, renderizarlos
        if (data.success && data.data.length > 0) {
            renderPacientes(data.data);
        } else {
            // Si no hay pacientes, mostrar mensaje
            emptyMessage.style.display = 'block';
        }
    } catch (error) {
        console.error('Error al obtener pacientes:', error);
        loading.style.display = 'none';
        showToast('Error al cargar pacientes', 'error');
    }
}

/**
 * Crea un nuevo paciente
 * @param {object} paciente - Datos del paciente
 */
async function createPaciente(paciente) {
    try {
        // Hacer petición POST a la API
        const response = await fetchWithAuth(`${API_URL}/pacientes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paciente) // Convertir objeto a JSON
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Paciente agregado exitosamente', 'success');
            getPacientes(); // Recargar la lista
            resetForm();    // Limpiar el formulario
        } else {
            showToast(data.message || 'Error al agregar paciente', 'error');
        }
    } catch (error) {
        console.error('Error al crear paciente:', error);
        showToast('Error al agregar paciente', 'error');
    }
}

/**
 * Actualiza un paciente existente
 * @param {number} id - ID del paciente
 * @param {object} paciente - Datos actualizados
 */
async function updatePaciente(id, paciente) {
    try {
        // Hacer petición PUT a la API
        const response = await fetchWithAuth(`${API_URL}/pacientes/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paciente)
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Paciente actualizado exitosamente', 'success');
            getPacientes(); // Recargar la lista
            resetForm();    // Limpiar el formulario
        } else {
            showToast(data.message || 'Error al actualizar paciente', 'error');
        }
    } catch (error) {
        console.error('Error al actualizar paciente:', error);
        showToast('Error al actualizar paciente', 'error');
    }
}

/**
 * Elimina un paciente
 * @param {number} id - ID del paciente
 */
async function deletePaciente(id) {
    // Confirmar antes de eliminar
    if (!confirm('¿Estás seguro de eliminar este paciente?')) {
        return;
    }
    
    try {
        // Hacer petición DELETE a la API
        const response = await fetchWithAuth(`${API_URL}/pacientes/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast('Paciente eliminado exitosamente', 'success');
            getPacientes(); // Recargar la lista
        } else {
            showToast(data.message || 'Error al eliminar paciente', 'error');
        }
    } catch (error) {
        console.error('Error al eliminar paciente:', error);
        showToast('Error al eliminar paciente', 'error');
    }
}

// ==========================================
// FUNCIONES DE RENDERIZADO
// ==========================================

/**
 * Renderiza la lista de pacientes en la tabla
 * @param {array} pacientes - Array de pacientes
 */
function renderPacientes(pacientes) {
    // Limpiar tbody
    tbody.innerHTML = '';
    
    // Recorrer cada paciente y crear una fila
    pacientes.forEach(paciente => {
        const tr = document.createElement('tr');
        
        // Formatear la fecha
        const fecha = new Date(paciente.fecha_registro).toLocaleDateString('es-ES');
        
        tr.innerHTML = `
            <td>${paciente.id}</td>
            <td>${paciente.nombre}</td>
            <td>${paciente.apellido}</td>
            <td>${paciente.edad}</td>
            <td>${paciente.telefono || '-'}</td>
            <td>${paciente.email || '-'}</td>
            <td>${paciente.diagnostico || '-'}</td>
            <td>${fecha}</td>
            <td>
                <div class="action-buttons">
                    <button class="btn-edit" onclick="editPaciente(${paciente.id})">
                        Editar
                    </button>
                    <button class="btn-delete" onclick="deletePaciente(${paciente.id})">
                        Eliminar
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

// ==========================================
// FUNCIONES DEL FORMULARIO
// ==========================================

/**
 * Maneja el envío del formulario
 */
form.addEventListener('submit', (e) => {
    e.preventDefault(); // Prevenir que el formulario recargue la página
    
    // Obtener valores del formulario
    const paciente = {
        nombre: nombreInput.value.trim(),
        apellido: apellidoInput.value.trim(),
        edad: parseInt(edadInput.value),
        telefono: telefonoInput.value.trim() || null,
        email: emailInput.value.trim() || null,
        diagnostico: diagnosticoInput.value.trim() || null
    };
    
    // Si estamos editando, actualizar; si no, crear
    if (isEditing) {
        updatePaciente(editingId, paciente);
    } else {
        createPaciente(paciente);
    }
});

/**
 * Prepara el formulario para editar un paciente
 * @param {number} id - ID del paciente a editar
 */
async function editPaciente(id) {
    try {
        // Obtener datos del paciente desde la API
        const response = await fetchWithAuth(`${API_URL}/pacientes/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const paciente = data.data;
            
            // Llenar el formulario con los datos
            idInput.value = paciente.id;
            nombreInput.value = paciente.nombre;
            apellidoInput.value = paciente.apellido;
            edadInput.value = paciente.edad;
            telefonoInput.value = paciente.telefono || '';
            emailInput.value = paciente.email || '';
            diagnosticoInput.value = paciente.diagnostico || '';
            
            // Cambiar el modo a edición
            isEditing = true;
            editingId = id;
            formTitle.textContent = 'Editar Paciente';
            submitBtn.textContent = 'Actualizar Paciente';
            cancelBtn.style.display = 'block';
            
            // Scroll hacia arriba para ver el formulario
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    } catch (error) {
        console.error('Error al obtener paciente:', error);
        showToast('Error al cargar datos del paciente', 'error');
    }
}

/**
 * Resetea el formulario a su estado inicial
 */
function resetForm() {
    form.reset(); // Limpiar todos los inputs
    
    isEditing = false;
    editingId = null;
    formTitle.textContent = 'Agregar Nuevo Paciente';
    submitBtn.textContent = 'Agregar Paciente';
    cancelBtn.style.display = 'none';
}

// Botón cancelar
cancelBtn.addEventListener('click', resetForm);

// ==========================================
// BÚSQUEDA EN TIEMPO REAL
// ==========================================

searchInput.addEventListener('input', (e) => {
    const searchTerm = e.target.value.toLowerCase();
    const rows = tbody.querySelectorAll('tr');
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        
        // Mostrar u ocultar fila según coincida con la búsqueda
        if (text.includes(searchTerm)) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
});

// ==========================================
// INICIALIZACIÓN
// ==========================================

// Cargar pacientes al iniciar la página
document.addEventListener('DOMContentLoaded', () => {
    getPacientes();
});

// Hacer funciones disponibles globalmente (para onclick en HTML)
window.deletePaciente = deletePaciente;
window.editPaciente = editPaciente;

// ==========================================
// MOSTRAR INFO DEL USUARIO EN EL HEADER
// ==========================================

window.addEventListener('DOMContentLoaded', () => {
    const usuario = JSON.parse(localStorage.getItem('usuario'));
    
    if (usuario) {
        document.getElementById('user-name').textContent = usuario.nombre;
        
        // Traducir rol al español
        const roles = {
            'admin': 'Administrador',
            'doctor': 'Doctor',
            'recepcionista': 'Recepcionista'
        };
        document.getElementById('user-role').textContent = roles[usuario.rol] || usuario.rol;
        
        // Ocultar botones según rol
        const userRole = usuario.rol;
        
        // Si es recepcionista, ocultar botón de eliminar
        if (userRole === 'recepcionista') {
            // Esta lógica la agregarás en renderPacientes()
        }
    }
    
    getPacientes();
});