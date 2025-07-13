'use server'

import { z } from 'zod'
import { createSession, clearSession } from '@/lib/auth'
import { auth } from '@/lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'Password must be at least 6 characters.'),
})

export async function handleLogin(values: z.infer<typeof loginSchema>) {
  const result = loginSchema.safeParse(values)

  if (!result.success) {
    const error = result.error.errors[0];
    return { success: false, error: `${error.path[0]}: ${error.message}` }
  }

  const { email, password } = result.data

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await createSession(userCredential.user.uid)
    return { success: true }
  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.'
    switch (error.code) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        errorMessage = 'Invalid email or password.'
        break;
      default:
        console.error('Firebase login error:', error);
        break;
    }
    return { success: false, error: errorMessage }
  }
}

export async function handleLogout() {
  await clearSession();
}
