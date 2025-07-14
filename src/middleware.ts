
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // If the path is for a static file, do nothing.
  if (path.startsWith('/_next/') || path.startsWith('/static/') || path.includes('.')) {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) || path === '/';

  const sessionCookie = request.cookies.get('session')?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch (err) {
      // Session is invalid, clear cookie and redirect to login
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Handle root path redirect for authenticated users
  if (isAuthenticated && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
// It also specifies the runtime as 'nodejs', which is required for firebase-admin.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
  runtime: 'nodejs',
};
