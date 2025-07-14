
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

// IMPORTANT: This middleware must run on the a 'nodejs' runtime.
// The Edge runtime does not support the 'firebase-admin' package.
export const runtime = 'nodejs';

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Determine if the current path is a protected route.
  // Note: Also protect the root path '/' by redirecting to '/dashboard'.
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route)) || path === '/';

  // Get the session cookie.
  const sessionCookie = request.cookies.get('session')?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      // Verify the session cookie with Firebase Admin.
      await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch (err) {
      // Session cookie is invalid or expired.
      // Create a response to clear the invalid cookie and then redirect.
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // Handle redirection logic.

  // If trying to access a protected route without being authenticated, redirect to login.
  if (isProtectedRoute && !isAuthenticated) {
    // If the requested path is the root, redirect to login.
    if (path === '/') {
        return NextResponse.redirect(new URL('/login', request.url));
    }
    // For other protected routes, redirect to login.
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and trying to access a public-only route (like login/signup),
  // redirect to the dashboard.
  if (isAuthenticated && publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If authenticated and accessing the root path, redirect to the dashboard.
  if (isAuthenticated && path === '/') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  // Otherwise, continue to the requested path.
  return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
export const config = {
  matcher: [
    // Match all paths except for static files, API routes, and image optimization folders.
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
};
