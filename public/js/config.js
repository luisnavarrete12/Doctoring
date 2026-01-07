// config.js
const API_URL = 'http://localhost:3000/api';

// Función global de logout
/*function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
}
*/
// Función para hacer fetch autenticado
async function authFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
  };

  const response = await fetch(`${API_URL}${endpoint}`, config);
  
  // Si es 401, logout automático
  if (response.status === 401) {
    logout();
    throw new Error('Sesión expirada');
  }
  
  return response;
}