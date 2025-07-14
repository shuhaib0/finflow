
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

// This is required to use 'firebase-admin' which is not compatible with the Edge runtime.
export const runtime = 'nodejs';

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations'];
const publicRoutes = ['/login', '/signup'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Determine if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));

  // Get the session cookie
  const sessionCookie = request.cookies.get('session')?.value;
  let isAuthenticated = false;

  if (sessionCookie) {
    try {
      // Verify the session cookie
      await auth.verifySessionCookie(sessionCookie, true);
      isAuthenticated = true;
    } catch (err) {
      // Session cookie is invalid or expired. The user is not authenticated.
      // We create a response to clear the invalid cookie and then redirect.
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('session');
      return response;
    }
  }

  // If trying to access a protected route without being authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If authenticated and trying to access a public route (like login/signup), redirect to the dashboard
  if (isAuthenticated && publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Otherwise, continue to the requested path
  return NextResponse.next();
}

// This config specifies which paths the middleware should run on.
export const config = {
  matcher: [
    // Match all paths except for static files, API routes, and image optimization folders.
    '/((?!api|_next/static|_next/image|favicon.ico).*)'
  ],
};
