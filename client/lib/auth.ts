import NextAuth, { User } from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
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
        return {
          ...session,
          user: {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          name: token.name as string,
          accessToken: token.accessToken as string | undefined,
          role: token.role as string || 'user',
          },
        };
      }
      return session;
    },
    async jwt({ token, user, account }) {
      let updatedToken = { ...token };
      if (user && typeof user === 'object') {
        updatedToken = {
          ...updatedToken,
          id: user.id,
          email: user.email,
          name: user.name,
          accessToken: (user as any).accessToken || token.accessToken || undefined,
          role: (user as any).role || token.role || 'user',
        };
      }
      
      if (account) {
        if (account.type === 'credentials' && (user as any).accessToken) {
          updatedToken.accessToken = (user as any).accessToken || undefined;
        } else if (account.access_token) {
          updatedToken.accessToken = account.access_token;
        }
      }
      
      return updatedToken;
    },
    async signIn({ user, account }) {
      if (!user) {
        return false;
      }

      if (account?.type === 'credentials') {
        return true;
      }
      if (account?.type === 'oauth') {
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
