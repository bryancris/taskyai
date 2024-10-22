import NextAuth, { AuthOptions } from 'next-auth';
import type { AuthOptions } from 'next-auth';
import authConfig from '@/auth.config';

export const authOptions: AuthOptions = authConfig;

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
