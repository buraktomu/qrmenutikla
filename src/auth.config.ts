import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 Gün
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnDashboard = nextUrl.pathname.startsWith('/dashboard');
      const isOnAdmin = nextUrl.pathname.startsWith('/admin');

      if (isOnDashboard || isOnAdmin) {
        if (!isLoggedIn) return false; // Logged out users are redirected to login

        const role = (auth?.user as any)?.role;

        // Super Admin checks
        if (isOnAdmin && role !== 'SUPER_ADMIN') {
          return Response.redirect(new URL('/dashboard', nextUrl));
        }

        return true;
      }
      
      // If user is logged in and tries to access login/register, redirect them to dashboard
      const isOnAuthPage = nextUrl.pathname.startsWith('/login') || nextUrl.pathname.startsWith('/register');
      if (isOnAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.name = user.name;
        token.email = user.email;
      }
      
      // If updating session profile dynamically
      if (trigger === 'update' && session) {
        token.name = session.name || token.name;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
      }
      return session;
    },
  },
  providers: [], // Configured in auth.ts (node runtime)
} satisfies NextAuthConfig;
