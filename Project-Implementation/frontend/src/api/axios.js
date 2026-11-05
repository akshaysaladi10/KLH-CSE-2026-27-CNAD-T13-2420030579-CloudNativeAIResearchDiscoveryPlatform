import axios from 'axios';

// In development, target the local Docker API Gateway (http://localhost:3000)
// In production (Vercel), target same-origin ('') so requests always hit /api on the Vercel domain
const isDev = import.meta.env.DEV;
const rawBase = import.meta.env.VITE_API_URL;

let baseURL = '';
if (isDev) {
  baseURL = 'http://localhost:3000';
} else if (rawBase && !rawBase.includes('trycloudflare.com') && rawBase.startsWith('http')) {
  baseURL = rawBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
}

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Guarantee that every relative request is routed through /api/...
  if (config.url && !config.url.startsWith('http')) {
    const cleanPath = config.url.replace(/^\/api/, '').replace(/^\/+/, '');
    config.url = `/api/${cleanPath}`;
  }

  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/register') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
