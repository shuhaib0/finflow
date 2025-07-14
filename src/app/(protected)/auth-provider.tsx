
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
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
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

  if (user) {
    return <AuthContext.Provider value={{ user, loading: false }}>{children}</AuthContext.Provider>;
  }
  
  // If not loading and no user, the useEffect above will trigger a redirect.
  // We can return the loading screen to avoid a flash of content.
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
