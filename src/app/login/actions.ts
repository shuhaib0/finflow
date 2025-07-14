
'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { auth as adminAuth } from '@/lib/firebase/admin'

const sessionSchema = z.object({
  idToken: z.string(),
})

export async function createSession(values: z.infer<typeof sessionSchema>) {
  const result = sessionSchema.safeParse(values)

  if (!result.success) {
    const error = result.error.errors[0];
    return { success: false, error: `${error.path[0]}: ${error.message}` }
  }

  const { idToken } = result.data;

  try {
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

    cookies().set('session', sessionCookie, {
      maxAge: expiresIn,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'lax',
    });

    return { success: true }
  } catch (error: any) {
    console.error('Firebase session creation error:', error);
    return { success: false, error: 'Failed to create session. Please try again.' }
  }
}

export async function handleLogout() {
  cookies().delete('session');
}
