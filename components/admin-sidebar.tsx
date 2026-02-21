"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { LayoutDashboard, Users, UserCog, Users2, Database, FileText, Play, ScrollText } from "lucide-react"
import { useEffect, useState } from "react"
import { auth } from "@/lib/firebase-client"

const adminMenuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    title: "Users",
    href: "/admin/users",
    icon: Users2,
    roles: ["admin"],
  },
  {
    title: "Clients",
    href: "/admin/clients",
    icon: Users,
    roles: ["admin"],
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: UserCog,
    roles: ["admin"],
  },
  {
    title: "Engineers",
    href: "/admin/engineers",
    icon: Users2,
    roles: ["admin"],
  },
  {
    title: "Database Credentials",
    href: "/admin/database-credentials",
    icon: Database,
    roles: ["admin"],
  },
  {
    title: "Queries",
    href: "/admin/queries",
    icon: FileText,
    roles: ["admin"],
  },
  {
    title: "Execute Query",
    href: "/admin/execute-query",
    icon: Play,
    roles: ["admin"],
  },
  {
    title: "Logs",
    href: "/admin/logs",
    icon: ScrollText,
    roles: ["admin"],
  },
]

const engineerMenuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["engineer"],
  },
  {
    title: "Clients",
    href: "/admin/clients",
    icon: Users,
    roles: ["engineer"],
  },
  {
    title: "Agents",
    href: "/admin/agents",
    icon: UserCog,
    roles: ["engineer"],
  },
  {
    title: "Execute Query",
    href: "/admin/execute-query",
    icon: Play,
    roles: ["engineer"],
  },
  {
    title: "Logs",
    href: "/admin/logs",
    icon: ScrollText,
    roles: ["engineer"],
  },
]

const agentMenuItems = [
  {
    title: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    roles: ["agent"],
  },
  {
    title: "Generate Custom Report",
    href: "/admin/agent-reports",
    icon: FileText,
    roles: ["agent"],
  },
   {
    title: "Fill Data",
    href: "/admin/fill-data",
    icon: FileText,
    roles: ["agent"],
  },
  {
    title: "Logs",
    href: "/admin/logs",
    icon: ScrollText,
    roles: ["agent"],
  },
]

const ercsMenuItems = [
  {
    title: "Dashboard",
    href: "/admin/ercs/dashboard",
    icon: LayoutDashboard,
    roles: ["ercs"],
  },
   {
    title: "Fill Data",
    href: "/admin/fill-data/ercs",
    icon: FileText,
    roles: ["ercs"],
  },
  {
    title: "Logs",
    href: "/admin/logs",
    icon: ScrollText,
    roles: ["ercs"],
  },
]



export function AdminSidebar() {
  const pathname = usePathname()
  const [userRole, setUserRole] = useState<string>("admin")
  const [filteredMenuItems, setFilteredMenuItems] = useState(adminMenuItems)

  useEffect(() => {
    const getCurrentRole = async () => {
      const user = auth.currentUser
      if (user) {
        const idTokenResult = await user.getIdTokenResult()
        const role = (idTokenResult.claims.role as string) || "admin"
        setUserRole(role)

        let menu = adminMenuItems
        if (role === "engineer") {
          menu = engineerMenuItems
        } else if (role === "agent") {
          menu = agentMenuItems
        }else if (role === "ercs") {
        }
        setFilteredMenuItems(menu)
      }
    }
    getCurrentRole()
  }, [])

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-sidebar-border bg-sidebar">
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-lg font-semibold text-sidebar-foreground">
          {userRole === "engineer"
            ? "Engineer Dashboard"
            :userRole === "ercs"
            ? "SLDB RCS Dashboard"
            : userRole === "agent"
              ? "Agent Dashboard"
              : "Admin Dashboard"}
        </h1>
      </div>
      <nav className="space-y-1 p-4">
        {filteredMenuItems.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.title}</span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
