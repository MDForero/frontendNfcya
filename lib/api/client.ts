import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string | null) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

// Request interceptor - adds Authorization header when token exists
apiClient.interceptors.request.use(
  (config) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[API Client] Added Authorization header to request');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Promise caching for refresh requests to avoid race conditions
let refreshPromise: Promise<any> | null = null;

// Response interceptor - handles 401 errors with automatic refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already retried this request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // If a refresh is already in progress, wait for it
        if (refreshPromise) {
          await refreshPromise;
        } else {
          // Start a new refresh request
          refreshPromise = apiClient.post('/auth/refresh');
          const { data } = await refreshPromise;

          // Update the access token
          setAccessToken(data.accessToken);
          console.log('[API Client] Token refreshed successfully');

          refreshPromise = null;
        }

        // Retry the original request with new token
        if (accessToken) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - clear token and redirect to login
        console.error('[API Client] Token refresh failed:', refreshError);
        setAccessToken(null);
        refreshPromise = null;

        // Redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
