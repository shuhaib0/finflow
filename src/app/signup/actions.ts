
'use server'

import { z } from 'zod'
import { cookies } from 'next/headers'
import { auth as adminAuth, db } from '@/lib/firebase/admin'
import { collection, addDoc } from 'firebase/firestore'

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
    
    // Create a corresponding company profile for the new user
    await addDoc(collection(db, 'companies'), {
      userId: userRecord.uid,
      name: `${name}'s Company`,
      address: '',
      taxId: '',
      contactEmail: email,
    });

    // Create a session cookie
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    // This needs to be done via a custom token, as creating a session cookie from UID is deprecated client-side.
    // For simplicity in this server action, we'll create a custom token and let the client sign in with it.
    const customToken = await adminAuth.createCustomToken(userRecord.uid);
    
    // We cannot set the cookie here directly after signup in a reliable way that works with client-side redirects.
    // Instead, we return the custom token and let the client complete the sign-in process.
    return { success: true, token: customToken }
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
