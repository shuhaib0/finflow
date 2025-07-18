
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations', '/settings'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const sessionCookie = request.cookies.get('session')?.value;

  // Let the root page handle its own redirection logic
  if (path === '/') {
    return NextResponse.next();
  }

  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => path.startsWith(route));

  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      await auth.verifySessionCookie(sessionCookie, true);
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
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
