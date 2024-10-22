import { type NextAuthOptions } from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

// Define the complete NextAuth configuration
export const nextAuthConfig: NextAuthOptions = {
   ...authConfig,
   adapter: PrismaAdapter(db),
   session: { strategy: "jwt" },
   pages: {
     signIn: "/auth/login",
     error: "/auth/error",
   },
   secret: process.env.NEXTAUTH_SECRET,
   debug: process.env.NODE_ENV === 'development',
   cookies: {
     sessionToken: {
       name: `next-auth.session-token`,
       options: {
         httpOnly: true,
         sameSite: 'lax',
         path: '/',
         secure: process.env.NODE_ENV === 'production'
       }
     }
   }
};

// Export the configuration only
export default nextAuthConfig;
