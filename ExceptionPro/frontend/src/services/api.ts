import axios from 'axios';

const isLocalhost =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const api = axios.create({
  // ============================================================================
  // [LOCALHOST DEVELOPMENT CONFIGURATION]
  // Active when running locally on http://localhost:5173 against Spring Boot on port 9090:
  baseURL: isLocalhost ? 'http://localhost:9090' : (import.meta.env.VITE_API_URL || window.location.origin),

  // [HOSTINGER VPS / DOCKER NGINX PRODUCTION CONFIGURATION]
  // Note: The expression above automatically uses 'http://localhost:9090' on Localhost
  // and `window.location.origin` (e.g. 'http://189.72.153.133') on Hostinger VPS!
  // ============================================================================
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
