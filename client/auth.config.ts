import Credentials from 'next-auth/providers/credentials';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import type { NextAuthConfig, User } from 'next-auth';

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
    Credentials({
      async authorize(credentials): Promise<User | null> {
        const { email, password } = credentials;

        if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
          console.error('Missing email or password');
          return null;
        }

        try {
          console.log('Attempting to login with:', { email, password: '********' });
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          const responseData = await response.json();
          console.log('Login response:', responseData);

          if (!response.ok) {
            console.error('Login failed:', responseData);
            return null;
          }

          console.log('Login successful:', responseData);
          const user: User = {
            id: responseData.id,
            email: responseData.email,
            name: responseData.name,
            accessToken: responseData.token
          } as User;
          return user;

        } catch (error) {
          console.error('Error during login:', error);
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
};

export default authConfig;