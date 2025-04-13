import axios from 'axios';

// Get the base URL from environment variables
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add the auth token header to requests
apiClient.interceptors.request.use(
  (config) => {
    // Ensure code only runs on the client-side where localStorage is available
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken'); // Get token

      const authPaths = ['/auth/token', '/auth/register'];
      if (token && config.url && !authPaths.some(path => config.url?.endsWith(path))) {
         config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    // Handle request errors here
    return Promise.reject(error);
  }
);

export default apiClient;