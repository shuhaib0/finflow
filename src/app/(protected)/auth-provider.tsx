
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Icons } from '@/components/icons';
import { useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
};

const AuthContext = createContext<AuthContextType>({ user: null });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // This effect runs only after the initial loading is complete.
    // The middleware is responsible for the initial redirect if not authenticated.
    // This client-side check is a fallback for cases like token expiration during a session.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
    );
  }
  
  // Only render children if there is a user.
  // If no user, the useEffect above will trigger a redirect.
  // We can render a redirecting screen here as a fallback.
  if (user) {
    return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
  }

  // This state is reached if !loading and !user, before the router push completes.
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
