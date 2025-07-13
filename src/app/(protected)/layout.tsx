
"use client"

import Link from "next/link"
import {
  ArrowLeftRight,
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Sparkles,
  Briefcase,
  DollarSign,
  FileQuestion,
} from "lucide-react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { handleLogout } from "@/app/login/actions"
import { auth } from "@/lib/firebase"
import type { User as FirebaseUser } from "firebase/auth"
import { onAuthStateChanged, signOut } from "firebase/auth"


const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard" },
    { 
      href: "/clients", 
      icon: Briefcase, 
      label: "CRM", 
      tooltip: "CRM",
      subItems: [
        { href: "/clients?status=lead", label: "Leads" },
        { href: "/clients?status=opportunity", label: "Opportunities" },
        { href: "/clients?status=customer", label: "Customers" },
      ]
    },
    {
      href: "/sales",
      icon: DollarSign,
      label: "Sales",
      tooltip: "Sales",
      subItems: [
        { href: "/quotations", label: "Quotations", icon: FileQuestion },
        { href: "/invoices", label: "Invoices", icon: FileText },
      ]
    },
    { href: "/transactions", icon: ArrowLeftRight, label: "Transactions", tooltip: "Transactions" },
    { href: "/reports", icon: BarChart3, label: "Reports", tooltip: "Reports" },
    { href: "/qna", icon: Sparkles, label: "AI Q&A", tooltip: "AI Q&A" },
]

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const [activeSubItem, setActiveSubItem] = useState("");
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // This logic now runs only on the client-side
    if (typeof window !== 'undefined') {
        const searchParams = new URLSearchParams(window.location.search);
        const currentStatus = searchParams.get('status');
        if (pathname === '/clients' && currentStatus) {
          setActiveSubItem(`/clients?status=${currentStatus}`);
        } else {
          setActiveSubItem("");
        }
        
        let currentNavItem = navItems.find(item => pathname.startsWith(item.href));
        let currentPageTitle = currentNavItem?.label || "Dashboard";

        if (currentNavItem?.subItems) {
          const activeSub = currentNavItem.subItems.find(sub => pathname.startsWith(sub.href));
          if (activeSub) {
            currentPageTitle = activeSub.label;
          }
        }
        
        setPageTitle(currentPageTitle);
    }
  }, [pathname]);

  const onLogout = async () => {
    await signOut(auth); // Sign out from Firebase client
    await handleLogout(); // Clear server-side session cookie
    router.push('/login');
  }

  const isSalesPath = (path: string) => path === '/quotations' || path === '/invoices';
  
  if (loading) {
    return <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
      <p className="mt-4 text-muted-foreground">Authenticating...</p>
    </div>;
  }


  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-headline text-lg font-semibold text-sidebar-foreground"
          >
            <Icons.logo className="h-8 w-8 text-accent" />
            <span className="group-data-[collapsible=icon]:hidden">
              Ailutions
            </span>
          </Link>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => (
                 item.subItems ? (
                  <Collapsible key={item.href} asChild defaultOpen={pathname.startsWith(item.href) || (item.href === '/sales' && isSalesPath(pathname))}>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            href={(item.href === '/clients' || item.href === '/sales') ? undefined : item.href}
                            tooltip={item.tooltip}
                            isActive={pathname.startsWith(item.href) && !activeSubItem && !isSalesPath(pathname)}
                        >
                            <item.icon />
                            {item.label}
                        </SidebarMenuButton>
                      </CollapsibleTrigger>
                      <CollapsibleContent asChild>
                          <SidebarMenuSub>
                              {item.subItems.map(subItem => (
                                  <SidebarMenuSubItem key={subItem.href}>
                                      <SidebarMenuSubButton 
                                          href={subItem.href}
                                          isActive={activeSubItem ? activeSubItem === subItem.href : pathname.startsWith(subItem.href)}
                                          >
                                            {subItem.icon && <subItem.icon />}
                                            {subItem.label}
                                      </SidebarMenuSubButton>
                                  </SidebarMenuSubItem>
                              ))}
                          </SidebarMenuSub>
                      </CollapsibleContent>
                    </SidebarMenuItem>
                  </Collapsible>
                 ) : (
                  <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                          href={item.href}
                          tooltip={item.tooltip}
                          isActive={pathname.startsWith(item.href)}
                      >
                          <item.icon />
                          {item.label}
                      </SidebarMenuButton>
                  </SidebarMenuItem>
                 )
            ))}
          </SidebarMenu>
        </SidebarContent>
        <SidebarFooter className="p-4">
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user?.photoURL || "https://placehold.co/100x100.png"} alt="User Avatar" data-ai-hint="avatar person" />
              <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-sm text-sidebar-foreground">
                {user?.displayName || 'Admin User'}
              </span>
              <span className="text-xs text-muted-foreground">
                {user?.email || 'admin@ailutions.com'}
              </span>
            </div>
          </div>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Settings">
                <Settings />
                Settings
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Log Out" onClick={onLogout}>
                <LogOut />
                Log Out
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b bg-card px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="hidden md:flex" />
          <div className="flex-1">
            <h1 className="font-headline text-lg font-semibold">{pageTitle}</h1>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
