import NextAuth from 'next-auth';
import type { NextAuthOptions } from 'next-auth';
import authConfig from '@/auth.config';

console.log('[NextAuth] Initializing NextAuth handler', { authConfigKeys: Object.keys(authConfig), authConfigType: typeof authConfig });
console.log('[NextAuth] AuthConfig:', JSON.stringify(authConfig, null, 2));

const authOptions: NextAuthOptions = authConfig;

const handler = NextAuth.default(authOptions);

async function authHandler(req: Request): Promise<Response> {
  console.log(`[NextAuth] ${req.method} request received`, { url: req.url });
  return handler(req) as Promise<Response>;
}

export const GET = authHandler;
export const POST = authHandler;

console.log('[NextAuth] Route file loaded and handler exported');

// Export the auth options
export { authOptions };

export type { NextAuthOptions };
