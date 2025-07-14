
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // The middleware already handles redirecting to /login if there's no session.
  // This client-side check handles the case where the Firebase session expires
  // while the user is on the site.
  useEffect(() => {
    if (!loading && !user) {
        // This redirect is safe because it only runs after the initial auth check.
        router.push('/login');
    }
  }, [user, loading, router]);


  if (loading) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
    );
  }

  // If we are done loading and there is a user, render the children.
  // Otherwise, the effect above will have already triggered a redirect.
  // Returning null here prevents a flash of content during the redirect.
  if (user) {
    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
  }

  return null;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
