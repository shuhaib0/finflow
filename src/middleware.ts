
import { type NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/firebase/admin'

// Force the middleware to run on the Node.js runtime.
// This is required to use 'firebase-admin' which is not compatible with the Edge runtime.
export const runtime = 'nodejs';

const protectedRoutes = ['/dashboard', '/clients', '/invoices', '/transactions', '/reports', '/qna', '/quotations']
const publicRoutes = ['/login', '/signup']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route));
  
  const cookie = request.cookies.get('session')?.value;
  let isAuthenticated = false;

  if (cookie) {
    try {
      await auth.verifySessionCookie(cookie, true);
      isAuthenticated = true;
    } catch (err) {
      // Session cookie is invalid or expired.
      // The user is not authenticated. We can clear the cookie.
      const response = NextResponse.redirect(new URL('/login', request.nextUrl));
      response.cookies.delete('session');
      return response;
    }
  }

  // If trying to access a protected route without being authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', request.nextUrl));
  }

  // If authenticated and trying to access a public route (like login), redirect to the dashboard
  if (isAuthenticated && publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl));
  }

  return NextResponse.next();
}

// Match all paths except for static files, API routes, and image optimization.
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
