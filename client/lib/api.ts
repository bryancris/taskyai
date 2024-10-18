import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { getSession, Session } from 'next-auth/react';

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
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://localhost:7232',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> => {
  const session = await getSession() as Session | null;
  if (session?.user?.accessToken) {
    const newConfig = { ...config };
    newConfig.headers.Authorization = `Bearer ${session.user.accessToken}`;
    return newConfig;
  }
  return config;
}, (interceptorError) => Promise.reject(interceptorError));