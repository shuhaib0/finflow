
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations', '/settings'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('session')?.value;

  // For the root path, redirect based on auth status
  if (path === '/') {
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

  let isAuthenticated = false;
  let userClaims = null;

  if (sessionCookie) {
    try {
      userClaims = await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch (err) {
      // Session is invalid, clear cookie and redirect if on a protected route
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      if (isProtectedRoute) {
        return response;
      }
      // if not a protected route, just clear cookie and continue
      const nextResponse = NextResponse.next();
      nextResponse.cookies.delete('session');
      return nextResponse;
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    // Not authenticated, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (isAuthenticated && isPublicRoute) {
    // Authenticated, but on a public route, redirect to dashboard
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
// It also specifies the runtime as 'nodejs', which is required for firebase-admin.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     *
     * This avoids running the middleware on static assets and API routes.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
  runtime: 'nodejs',
};
