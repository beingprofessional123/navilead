import axios from 'axios';
import appConfig from '../config/appConfig'; // Make sure path is correct
import { toast } from 'react-toastify';
import { jwtDecode } from 'jwt-decode';


// Create axios instance with base URL
const api = axios.create({
  baseURL: appConfig.apiBaseUrl,
});

// 🔐 Helper to check token expiration
export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const { exp } = jwtDecode(token);
    return Date.now() >= exp * 1000;
  } catch (err) {
    console.error("Error decoding token:", err);
    return true; // treat invalid token as expired
  }
};

// 🔐 Request interceptor: attach token and check expiration
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');

    if (token) {
      if (isTokenExpired(token)) {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        window.location.href = '/login'; // redirect to login
        return Promise.reject(new Error('Token expired. Redirecting to login.'));
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ❌ Response interceptor: global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      toast.error('Authentication failed. Please login again.');
      window.location.href = '/login'; // redirect to login
    } else {
      const msg = error.response?.data?.message || 'Something went wrong';
      toast.error(msg);
      console.error('API error:', error.response?.status, msg);
    }
    return Promise.reject(error);
  }
);

export default api;
