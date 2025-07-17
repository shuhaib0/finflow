
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
import { useEffect, useState } from "react"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
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
  SidebarGroupContent,
  SidebarSeparator,
  SidebarInset,
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { handleLogout } from "@/app/login/actions"
import { AuthProvider, useAuth } from '@/providers/auth-provider'
import { Toaster } from "@/components/ui/toaster"
import { cn } from "@/lib/utils"

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

function ProtectedLayoutContent({
  children,
}: {
  children: React.ReactNode
}) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pageTitle, setPageTitle] = useState("Dashboard");
  const currentRoute = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');

  useEffect(() => {
    const getTitle = () => {
        if (pathname.startsWith('/clients')) {
            const status = searchParams.get('status');
            if (status === 'lead') return 'Leads';
            if (status === 'opportunity') return 'Opportunities';
            if (status === 'customer') return 'Customers';
            return 'All Contacts';
        }
        for (const item of singleNavItems) {
            if (pathname.startsWith(item.href)) return item.label;
        }
        for (const group of navItems) {
            for (const subItem of group.subItems) {
                if (currentRoute.startsWith(subItem.href)) return subItem.label;
            }
        }
        if (pathname.startsWith('/quotations')) return 'Quotations';
        if (pathname.startsWith('/invoices')) return 'Invoices';
        if (pathname.startsWith('/transactions')) return 'Transactions';
        if (pathname.startsWith('/reports')) return 'Reports';
        if (pathname.startsWith('/qna')) return 'AI Q&A';
        if (pathname.startsWith('/settings')) return 'Settings';
        return 'Dashboard';
    }
    setPageTitle(getTitle());
  }, [pathname, searchParams, currentRoute]);

  const onLogout = async () => {
    await handleLogout(); 
    router.push('/login');
    router.refresh(); 
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
            {singleNavItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                        tooltip={item.tooltip}
                        isActive={pathname === item.href}
                        asChild
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
            {navItems.map((group) => (
                <SidebarMenu key={group.id}>
                    <SidebarGroup>
                        <SidebarGroupLabel className="flex items-center gap-2">
                            <group.icon />
                            {group.label}
                        </SidebarGroupLabel>
                        <SidebarGroupContent>
                            <SidebarMenuSub>
                                {group.subItems.map(subItem => (
                                    <SidebarMenuSubItem key={subItem.href}>
                                        <SidebarMenuSubButton isActive={currentRoute === subItem.href} asChild>
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
                </SidebarMenu>
            ))}
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
                <SidebarMenuButton tooltip="Settings" isActive={pathname === '/settings'} asChild>
                    <Link href="/settings"><Settings /> Settings</Link>
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/signup');

  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-body antialiased", !isAuthRoute && "overflow-hidden")}>
        <AuthProvider>
          {isAuthRoute ? (
            children
          ) : (
            <ProtectedLayoutContent>
              {children}
            </ProtectedLayoutContent>
          )}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
