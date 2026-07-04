import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use(
  (config) => {
    let token = null;
    
    // Check if we are currently in the admin panel
    const isAdminRoute = window.location.pathname.startsWith('/admin');
    
    if (isAdminRoute) {
      // For admin routes, prioritize admin token
      token = sessionStorage.getItem('adminToken') || localStorage.getItem('userToken');
    } else {
      // For vendor/customer routes, strictly use user token to prevent admin token leakage
      token = localStorage.getItem('userToken');
    }

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
