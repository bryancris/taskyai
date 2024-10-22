import NextAuth from 'next-auth';
import authConfig from '@/auth.config';

const handler = NextAuth(authConfig);
console.log('[NextAuth] Route handler initialized');
 
export { handler as GET, handler as POST };