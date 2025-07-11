'use server'

import { z } from 'zod'
import { createSession, clearSession } from '@/lib/auth'
import { redirect } from 'next/navigation'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

// In a real app, you'd validate against a database
const MOCK_USER = {
  email: 'admin@ailutions.com',
  password: 'password',
  uid: '12345',
}

export async function handleLogin(values: z.infer<typeof loginSchema>) {
  const result = loginSchema.safeParse(values)

  if (!result.success) {
    return { success: false, error: 'Invalid input.' }
  }

  const { email, password } = result.data

  if (email === MOCK_USER.email && password === MOCK_USER.password) {
    await createSession(MOCK_USER.uid)
    // We don't redirect here, the client-side will do it on success.
    return { success: true }
  }

  return { success: false, error: 'Invalid email or password.' }
}

export async function handleLogout() {
  await clearSession();
  redirect('/login');
}
