// frontend/src/api.js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  withCredentials: true
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response && err.response.status === 401) {
      // On 401 Unauthorized, the token is likely invalid, so clear it.
      clearAuthToken();
      // Force a reload to the login page to re-authenticate.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

/**
 * Removes the JWT token from localStorage and the default Axios headers.
 */
export function clearAuthToken() {
  try {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
  } catch (e) {
    console.error('Error clearing auth token', e);
  }
}

export default api;