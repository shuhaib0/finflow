import 'server-only'

import { cookies } from 'next/headers'

const SESSION_COOKIE_NAME = 'session'

export async function getSession() {
  const cookie = cookies().get(SESSION_COOKIE_NAME)
  return cookie ? JSON.parse(cookie.value) : null
}

export async function createSession(uid: string) {
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    const session = { uid, expires: expires.toISOString() }
  
    // Save session in a cookie
    cookies().set(SESSION_COOKIE_NAME, JSON.stringify(session), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      expires: expires,
      sameSite: 'lax',
      path: '/',
    })
}

export async function clearSession() {
    cookies().delete(SESSION_COOKIE_NAME, { path: '/' });
}

export async function isAuthenticated() {
    const session = await getSession();
    if (!session) return false;
    // You might want to add more checks here, e.g., token validation
    return true;
}
