import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession } from 'next-auth/react';
import https from 'https';
import { User } from 'next-auth';

// Extend the User type to include accessToken if it's not already included
interface ExtendedUser extends Omit<User, 'id'> {
  id: string;
  accessToken?: string;
}

export const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error('An error occurred while fetching the data.');
    // Attach extra info to the error object.
    (error as any).info = await res.json();
    (error as any).status = res.status;
    throw error;
  }
  return res.json();
};

// API endpoint keys for SWR cache invalidation
export const LISTS_KEY = '/api/lists';
export const LABELS_KEY = '/api/labels';

export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7232',
  headers: {
    'Content-Type': 'application/json',
  },
  httpsAgent: new https.Agent({
    rejectUnauthorized: process.env.NODE_ENV === 'production',
  }),
  timeout: 10000, // Set a timeout of 10 seconds
  validateStatus: (status) => status >= 200 && status < 300, // Only treat 2xx status codes as successful
});

console.log('API base URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7232');

api.interceptors.request.use(async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
  const session = await getSession();
  if (session?.user && (session.user as ExtendedUser).accessToken) {
    const newConfig = { ...config };
    newConfig.headers.Authorization = `Bearer ${(session.user as ExtendedUser).accessToken}`;
    return newConfig;
  }
  return config;
}, (interceptorError) => Promise.reject(interceptorError));

api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error(`API Error at ${new Date().toISOString()}:`, error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
    if (error.response) {
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
      console.error('Response status:', error.response.status, error.response.statusText);
      console.error('Response headers:', JSON.stringify(error.response.headers, null, 2));
    } else if (error.request) {
      console.error('No response received. Request details:', JSON.stringify(error.request, null, 2));
      console.error('Is this a timeout?', error.code === 'ECONNABORTED', 'Timeout value:', api.defaults.timeout);
    } else {
      console.error('Error setting up the request:', error.message);
    }
    console.error('Request config:', JSON.stringify(error.config, null, 2));
    console.error('Is network error:', error.isAxiosError && !error.response, 'Error code:', error.code);
    
    // Additional network-related logging
    if (error.code === 'ECONNABORTED') {
      console.error('Request timed out. Check server availability and network conditions.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('DNS lookup failed. Check the API URL and your network connection.');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused. Ensure the server is running and accessible.');
    } else if (error.code === 'CERT_HAS_EXPIRED' || error.code === 'UNABLE_TO_VERIFY_LEAF_SIGNATURE') {
      console.error('SSL certificate issue. Check the server\'s SSL configuration.');
    }
    
    // Log network status and API URL
    console.error('Network status:', navigator.onLine ? 'Online' : 'Offline');
    console.error('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7232');

    return Promise.reject(error);
  }
);