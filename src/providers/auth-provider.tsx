
"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Icons } from '@/components/icons';
import { usePathname, useRouter } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup');

  useEffect(() => {
    if (!loading && !user && !isAuthPage) {
      router.push('/login');
    }
  }, [loading, user, router, pathname, isAuthPage]);

  if (loading) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
            <p className="mt-4 text-muted-foreground">Authenticating...</p>
        </div>
    );
  }

  // Render auth pages or redirect if user state is determined
  if (isAuthPage) {
      if(user) {
          router.push('/dashboard');
          return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
              <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
              <p className="mt-4 text-muted-foreground">Redirecting...</p>
            </div>
          );
      }
      return <>{children}</>;
  }

  if (!user) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  return <AuthContext.Provider value={{ user, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
