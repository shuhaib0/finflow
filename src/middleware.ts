
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations', '/settings'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('session')?.value;

  // Root path is handled by the matcher, this logic is for redirection inside the app.
  if (path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch (err) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      if (isProtectedRoute) {
        return response;
      }
      const nextResponse = NextResponse.next();
      nextResponse.cookies.delete('session');
      return nextResponse;
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/dashboard/:path*',
    '/clients/:path*',
    '/invoices/:path*',
    '/transactions/:path*',
    '/reports/:path*',
    '/qna/:path*',
    '/quotations/:path*',
    '/settings/:path*',
    '/login',
    '/signup',
  ],
  runtime: 'nodejs',
};
