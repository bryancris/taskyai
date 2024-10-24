import CredentialsProvider from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import { AxiosError } from 'axios';
import axios from 'axios';
import https from 'https';
import { NextAuthConfig } from 'next-auth';

// Define the authentication configuration as NextAuthConfig
const authConfig: NextAuthConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
    CredentialsProvider({
      async authorize(credentials): Promise<any> {
        const { email, password } = credentials as Record<"email" | "password", string> || {};
        console.log(`[NextAuth] Authorize function called for email: ${email}`);

        if (!email || !password) {
          console.error('Missing email or password');
          return null;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7232';
          console.log(`[NextAuth] Sending login request to: ${apiUrl}/api/login`);

          const axiosConfig: any = {
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            timeout: 10000, // 10 seconds timeout
            validateStatus: (status) => status >= 200 && status < 300,
          };

          const response = await axios.post<{ id: string; email: string; name: string; token: string; refreshToken: string }>(
            `${apiUrl}/api/login`,
            { email, password },
            axiosConfig
          );

          console.log(`[NextAuth] Login response received:`, { status: response.status, statusText: response.statusText });

          if (!response.data || typeof response.data !== 'object') {
            console.error('Login failed: Invalid response data', response.status, JSON.stringify(response.data, null, 2));
            return null;
          }

          const { id, email: userEmail, name, token: accessToken } = response.data;

          if (!id || !userEmail || !accessToken) {
            console.error('Invalid user data received:', JSON.stringify(response.data, (key, value) => ['token', 'accessToken'].includes(key) ? '[REDACTED]' : value, 2), 'Required fields:', { id, userEmail, accessToken: accessToken ? 'Present' : 'Missing' });
            return null;
          }

          const user = {
            id,
            email: userEmail,
            name,
            image: null,
            accessToken,
            refreshToken: response.data.refreshToken,
          };

          console.log(`[NextAuth] User authenticated:`, { id: user.id, email: user.email, name: user.name });
          console.log(`[NextAuth] Access token received: ${accessToken ? 'Yes' : 'No'}, Length: ${accessToken?.length}`);
           
          console.log(`[NextAuth] Returning user object from authorize function:`, JSON.stringify({ id: user.id, email: user.email, name: user.name }, null, 2));
          return user;

        } catch (error: any) {
          if (error instanceof AxiosError) {
            console.error('[NextAuth] Axios error:', error.message);
            console.error('[NextAuth] Error status:', error.response?.status);
            console.error('[NextAuth] Error time:', new Date().toISOString(), 'Error code:', error.code);
            console.error('Response data:', error.response?.data ? JSON.stringify(error.response.data, null, 2) : 'No response data');
            console.error('Request config:', error.config);
            if (error.response?.status === 404) {
              console.error('API endpoint not found. Check if the server is running and the URL is correct.');
            }
            console.error('Full error object:', error);
            console.error('Error stack:', error.stack || 'No stack trace available');
            console.error('Request URL:', error.config?.url);
            console.error('Network status:', typeof window !== 'undefined' ? (window.navigator.onLine ? 'Online' : 'Offline') : 'Unknown (server-side)');
            console.error('Full error object:', JSON.stringify(error, null, 2));
            console.error('Request headers:', error.config?.headers);
            console.error('Response headers:', error.response?.headers);
            console.error('Request data:', error.config?.data);
          } else if (error instanceof Error) {
            console.error('[NextAuth] Error during login:', error.message, 'Stack:', error.stack);
          } else {
            console.error('[NextAuth] Unknown error during login:', error);
          }
          console.error('Login failed. Please check the server logs for more details.');
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      console.log('[NextAuth] JWT callback', { tokenKeys: Object.keys(token), userKeys: user ? Object.keys(user) : null, tokenId: token.id, userId: user?.id });
      if (user) {
        token.accessToken = user.accessToken || '';
        token.refreshToken = user.refreshToken || '';
        token.id = user.id;
      }
      console.log('[NextAuth] JWT callback result:', { tokenKeys: Object.keys(token), tokenId: token.id });
      return token;
    },
    async session({ session, token }) {
      console.log('[NextAuth] Session callback input:', { sessionKeys: Object.keys(session), tokenKeys: Object.keys(token), tokenId: token.id });
      session.user.accessToken = token.accessToken as string || '';
      session.user.refreshToken = token.refreshToken as string || '';
      session.user.id = token.id as string;
      console.log('[NextAuth] Session callback result:', { sessionKeys: Object.keys(session), sessionUserKeys: Object.keys(session.user), sessionUserId: session.user.id });
      return session;
    },
  },
};

export default authConfig;