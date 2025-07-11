import { type NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const protectedRoutes = ['/dashboard', '/crm', '/invoices', '/transactions', '/reports', '/qna']
const publicRoutes = ['/login']

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some(route => path.startsWith(route))
  
  const isAuthed = await isAuthenticated()

  if (isProtectedRoute && !isAuthed) {
    return NextResponse.redirect(new URL('/login', request.nextUrl))
  }

  if (isAuthed && publicRoutes.some(route => path.startsWith(route))) {
    return NextResponse.redirect(new URL('/dashboard', request.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
}
