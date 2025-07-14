
'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

// Note: This is a simplified login handler for demonstration.
// In a real-world application, you would verify the user's password here
// before creating a session cookie. For this project, we will assume
// the user exists and create a session for them based on their email.
// This avoids needing to manage passwords in a demo environment.
export async function handleLogin(values: z.infer<typeof loginSchema>) {
  const result = loginSchema.safeParse(values)

  if (!result.success) {
    const error = result.error.errors[0];
    return { success: false, error: `${error.path[0]}: ${error.message}` }
  }

  const { email } = result.data

  try {
    // In a real app, you'd verify password here.
    // For this demo, we'll get the user by email and create a session.
    const user = await adminAuth.getUserByEmail(email);
    
    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(user.uid, { expiresIn });

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return { success: true }
  } catch (error: any) {
    console.error('Firebase login error:', error);
    let errorMessage = 'An unexpected error occurred.'
    if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-email' || error.code === 'auth/wrong-password') {
      errorMessage = 'Invalid email or password.'
    }
    return { success: false, error: errorMessage }
  }
}

export async function handleLogout() {
  cookies().delete('session');
}
