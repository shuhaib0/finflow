
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

  useEffect(() => {
    // This effect handles redirection after the initial loading is complete.
    // The middleware handles the initial server-side redirect if the cookie is missing.
    // This client-side check is a fallback for cases like token expiration during a session.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // While loading, show a full-screen loading indicator.
  if (loading) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
    );
  }

  // If not loading and there's a user, render the children (the application).
  if (user) {
    return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
  }

  // If not loading and no user, show a redirecting screen while the router push completes.
  // This state is hit for a brief moment before the redirect happens.
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
    </div>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
