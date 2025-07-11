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
  Users,
  Briefcase,
} from "lucide-react"

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
} from "@/components/ui/sidebar"
import { Icons } from "@/components/icons"
import { usePathname, useRouter } from "next/navigation"
import { handleLogout } from "@/app/login/actions"
import { useEffect, useState } from "react"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", tooltip: "Dashboard" },
    { 
      href: "/crm", 
      icon: Briefcase, 
      label: "CRM", 
      tooltip: "CRM",
      subItems: [
        { href: "/crm?status=lead", label: "Leads" },
        { href: "/crm?status=opportunity", label: "Opportunities" },
        { href: "/crm?status=customer", label: "Customers" },
      ]
    },
    { href: "/invoices", icon: FileText, label: "Invoices", tooltip: "Invoices" },
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

  useEffect(() => {
    const currentNavItem = navItems.find(item => pathname.startsWith(item.href));
    if (currentNavItem) {
        setPageTitle(currentNavItem.label);
    }
  }, [pathname]);

  const onLogout = async () => {
    await handleLogout();
    router.push('/login');
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
                  <Collapsible key={item.href} asChild>
                    <SidebarMenuItem>
                      <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            href={item.href}
                            tooltip={item.tooltip}
                            isActive={pathname.startsWith(item.href)}
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
                                          isActive={pathname === subItem.href.split('?')[0] && router.query?.status === subItem.href.split('=')[1]}
                                          >
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
              <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="avatar person" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col group-data-[collapsible=icon]:hidden">
              <span className="font-semibold text-sm text-sidebar-foreground">
                Admin User
              </span>
              <span className="text-xs text-muted-foreground">
                admin@ailutions.com
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
