'use server'

import { z } from 'zod'
import { createSession } from '@/lib/auth'
import { auth, db } from '@/lib/firebase'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'
import { doc, setDoc } from 'firebase/firestore'

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
    // Step 1: Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Step 2: Update the user's profile with their name
    await updateProfile(user, { displayName: name });
    
    // Step 3: Create a corresponding user document in Firestore
    await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: name,
        email: email,
        role: 'admin', // Assign a default role
        createdAt: new Date().toISOString(),
    });

    // Step 4: Create a session for the new user
    await createSession(user.uid)

    return { success: true }
  } catch (error: any) {
    let errorMessage = 'An unexpected error occurred.'
    switch (error.code) {
      case 'auth/email-already-in-use':
        errorMessage = 'This email is already registered.'
        break;
      case 'auth/weak-password':
        errorMessage = 'The password is too weak.'
        break;
      default:
        console.error('Firebase sign-up error:', error);
        break;
    }
    return { success: false, error: errorMessage }
  }
}
