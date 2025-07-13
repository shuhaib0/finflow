
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
  Users,
  BadgeCent,
  TrendingUp,
  CircleDollarSign,
} from "lucide-react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import { useEffect, useState, Children, cloneElement, isValidElement } from "react"

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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarSeparator,
  SidebarGroupContent,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { handleLogout } from "@/app/login/actions"
import { auth } from "@/lib/firebase"
import type { User as FirebaseUser } from "firebase/auth"
import { onAuthStateChanged, signOut } from "firebase/auth"

const navItems = [
    { 
      id: 'crm',
      label: "CRM",
      icon: Briefcase,
      subItems: [
        { href: "/clients", label: "All Contacts", icon: Users },
        { href: "/clients?status=lead", label: "Leads", icon: BadgeCent },
        { href: "/clients?status=opportunity", label: "Opportunities", icon: TrendingUp },
        { href: "/clients?status=customer", label: "Customers", icon: CircleDollarSign },
      ]
    },
    {
      id: 'sales',
      label: "Sales",
      icon: DollarSign,
      subItems: [
        { href: "/quotations", label: "Quotations", icon: FileQuestion },
        { href: "/invoices", label: "Invoices", icon: FileText },
      ]
    },
];

const singleNavItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard" },
    { href: "/transactions", icon: ArrowLeftRight, label: "Transactions", tooltip: "Transactions" },
    { href: "/reports", icon: BarChart3, label: "Reports", tooltip: "Reports" },
    { href: "/qna", icon: Sparkles, label: "AI Q&A", tooltip: "AI Q&A" },
];


export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [pageTitle, setPageTitle] = useState("Dashboard");
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

    return () => unsubscribe();
  }, [router]);
  
  const currentRoute = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  useEffect(() => {
    const getTitle = () => {
        for (const item of singleNavItems) {
            if (pathname === item.href) return item.label;
        }
        for (const group of navItems) {
            for (const subItem of group.subItems) {
                if (currentRoute === subItem.href) return subItem.label;
            }
        }
        if (pathname.startsWith('/clients')) return 'CRM';
        if (pathname.startsWith('/quotations')) return 'Quotations';
        if (pathname.startsWith('/invoices')) return 'Invoices';
        if (pathname.startsWith('/transactions')) return 'Transactions';
        if (pathname.startsWith('/reports')) return 'Reports';
        if (pathname.startsWith('/qna')) return 'AI Q&A';
        return 'Dashboard';
    }
    setPageTitle(getTitle());
  }, [currentRoute, pathname]);

  const onLogout = async () => {
    await signOut(auth);
    await handleLogout(); 
    router.push('/login');
  }
  
  if (loading) {
    return <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
      <Icons.logo className="h-12 w-12 animate-pulse text-primary" />
      <p className="mt-4 text-muted-foreground">Authenticating...</p>
    </div>;
  }

  const childrenWithProps = Children.map(children, child => {
    if (isValidElement(child)) {
      // @ts-ignore
      return cloneElement(child, { user });
    }
    return child;
  });

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
            {singleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        asChild
                        tooltip={item.tooltip}
                        isActive={pathname === item.href}
                    >
                        <Link href={item.href}>
                            <item.icon />
                            {item.label}
                        </Link>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            ))}
          </SidebarMenu>
          <SidebarSeparator />
          <SidebarMenu>
            {navItems.map((group) => (
                <SidebarGroup key={group.id} className="p-2 pt-0">
                    <SidebarGroupLabel className="flex items-center gap-2">
                        <group.icon />
                        {group.label}
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenuSub>
                            {group.subItems.map(subItem => (
                                <SidebarMenuSubItem key={subItem.href}>
                                    <SidebarMenuSubButton asChild isActive={currentRoute === subItem.href}>
                                      <Link href={subItem.href}>
                                          {subItem.icon && <subItem.icon />}
                                          <span>{subItem.label}</span>
                                      </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </SidebarGroupContent>
                </SidebarGroup>
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
          {childrenWithProps}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
