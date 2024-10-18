import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { User } from '@prisma/client';
import authConfig from '@/auth.config';

import { db } from '@/lib/db';

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  events: {
    async linkAccount({ user }: { user: User }) {
      await db.user.update({
        where: { id: user.id },
        data: { emailVerified: new Date() },
      });
    },
  },
  callbacks: {
    async session({ token, session }) {
      if (token && typeof token === 'object') {
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          accessToken: token.accessToken as string | undefined,
          role: token.role as string || 'user',
        };
      }
      console.log('Session updated:', JSON.stringify({ ...session, user: { ...session.user, accessToken: '[REDACTED]' } }, null, 2));
      return session;
    },
    async jwt({ token, user, account, trigger }) {
      console.log('JWT callback triggered:', trigger, 'User:', user ? JSON.stringify({ ...user, accessToken: user.accessToken ? '[PRESENT]' : '[MISSING]' }) : 'null', 'Account:', account ? JSON.stringify(account) : 'null');

      if (user && typeof user === 'object') {
        token = {
          ...token,
          id: user.id,
          email: user.email,
          name: user.name,
          accessToken: (user as any).accessToken || token.accessToken || undefined,
          role: (user as any).role || token.role || 'user',
        };
        console.log('JWT token after user update:', JSON.stringify({ ...token, accessToken: '[REDACTED]' }, null, 2));
      }
      
      if (account) {
        if (account.type === 'credentials' && (user as any).accessToken) {
          token.accessToken = (user as any).accessToken || undefined;
        } else if (account.access_token) {
          token.accessToken = account.access_token;
        }
        console.log('JWT token updated with access token:', JSON.stringify({ ...token, accessToken: '[REDACTED]' }, null, 2));
      }
      
      if (!token.accessToken) {
        console.warn('Access token is missing in the JWT token');
      }

      console.log('Token structure:', Object.keys(token));
      console.log('Token values:', JSON.stringify({ ...token, accessToken: token.accessToken ? '[PRESENT]' : '[MISSING]' }, null, 2));

      console.log('Final JWT token:', JSON.stringify({ ...token, accessToken: '[REDACTED]' }, null, 2));
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log('SignIn callback triggered');
      console.log('User:', user ? JSON.stringify({ ...user, accessToken: '[REDACTED]' }, null, 2) : 'null');
      console.log('Account:', JSON.stringify(account, null, 2));
      console.log('Profile:', profile ? JSON.stringify(profile, null, 2) : 'null');

      if (!user) {
        console.error('SignIn failed: User object is missing');
        return false;
      }

      if (account?.type === 'credentials') {
        if (user && (user as any).accessToken) {
          console.log('Credentials sign-in successful');
          console.log('User with access token:', JSON.stringify({ ...user, accessToken: '[REDACTED]' }, null, 2));
          return true;
        }
        console.warn('Credentials sign-in: Access token is missing', JSON.stringify(user, null, 2));
        return true; // Allow sign-in even if access token is missing, as it might be added later
      }
      if (account?.type === 'oauth') {
        console.log('OAuth sign-in successful');
        return true;
      }
      return true;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'fallback_secret_for_development',
  adapter: PrismaAdapter(db),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  ...authConfig,
});
