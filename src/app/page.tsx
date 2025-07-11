'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Icons } from '@/components/icons';

export default function Home() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
      <p className="mt-4 text-muted-foreground">Loading Ailutions Finance Hub...</p>
    </div>
  );
}
