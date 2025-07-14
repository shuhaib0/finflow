
'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

const signUpSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export async function handleSignUp(values: z.infer<typeof signUpSchema>) {
  const result = signUpSchema.safeParse(values)

  if (!result.success) {
    const error = result.error.errors[0];
    return { success: false, error: `${error.path[0]}: ${error.message}` }
  }

  const { name, email, password } = result.data

  try {
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
    });

    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(userRecord.uid, { expiresIn });

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });
    
    return { success: true }
  } catch (error: any) {
    console.error('Firebase sign-up error:', error);
    let errorMessage = 'An unexpected error occurred.'
    if (error.code === 'auth/email-already-exists') {
        errorMessage = 'This email is already registered.'
    } else if (error.code === 'auth/weak-password') {
        errorMessage = 'The password is too weak. It must be at least 6 characters long.'
    }
    return { success: false, error: errorMessage }
  }
}
