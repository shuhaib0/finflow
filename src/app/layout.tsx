
"use client"

import { AuthProvider } from '@/providers/auth-provider'
import { Toaster } from "@/components/ui/toaster"
import "./globals.css";
import { Inter, Space_Grotesk } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"], variable: "--font-body" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-headline" });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.variable, spaceGrotesk.variable, "font-body")}>
        <AuthProvider>
            {children}
            <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
