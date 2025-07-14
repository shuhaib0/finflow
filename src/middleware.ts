
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Handle root path separately to avoid infinite redirects
  if (path === '/') {
    const sessionCookie = request.cookies.get('session')?.value;
    if (sessionCookie) {
      try {
        await auth.verifySessionCookie(sessionCookie, true);
        return NextResponse.redirect(new URL('/dashboard', request.url));
      } catch (err) {
        // Invalid cookie, redirect to login
        const response = NextResponse.redirect(new URL('/login', request.url));
        response.cookies.delete('session');
        return response;
      }
    }
    // No cookie, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  const sessionCookie = request.cookies.get('session')?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch (err) {
      // Session is invalid, clear cookie
      // The redirect will happen below if it's a protected route
      const response = NextResponse.next();
      response.cookies.delete('session');
      if (isProtectedRoute) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return response;
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

// This config specifies which paths the middleware should run on.
// It also specifies the runtime as 'nodejs', which is required for firebase-admin.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
  runtime: 'nodejs',
};
