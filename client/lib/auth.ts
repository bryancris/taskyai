import NextAuth, { type NextAuthConfig, type NextAuthOptions } from "next-auth";
import authConfig from "@/auth.config";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { db } from "@/lib/db";

// Merge the imported authConfig with additional options
const nextAuthConfig: NextAuthOptions = {
  ...authConfig,
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/login",
    error: "/auth/error",
  },
};

// Initialize NextAuth with the merged configuration
const { handlers, auth, signIn, signOut } = NextAuth(nextAuthConfig);

// Export getSession as an alias for auth
export const getSession = auth;

// Export the handlers and functions
export { handlers, auth, signIn, signOut, NextAuth };
