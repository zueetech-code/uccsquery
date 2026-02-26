"use client"

import { CreateClientDialog } from "@/components/create-client-dialog"
import { ClientsTable } from "@/components/clients-table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useEffect, useState, useMemo } from "react"
import type { Client } from "@/types"
import {
  getFirestore,
  collection,
  getDocs,
  query,
  orderBy,
  doc,
  getDoc,
} from "firebase/firestore"
import { auth } from "@/lib/firebase-client"
import { RCSClientsTable } from "@/components/rcs-client-table"
import { resolveHeartbeatStatus } from "@/lib/heartbeat"
import { Users, Activity } from "lucide-react"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("admin")
  
  // Calculate stats from clients
  const stats = useMemo(() => {
    const total = clients.length
    const online = clients.filter(c => resolveHeartbeatStatus(c.lastSeen) === "online").length
    const offline = total - online
    
    return { total, online, offline }
  }, [clients])
  

  useEffect(() => {
    fetchClients()
    fetch("/api/clients/auto-execute").catch(console.error)
  }, [])
  

  const fetchClients = async () => {
    try {
      setLoading(true)

      const user = auth.currentUser
      if (!user) return

      // 🔑 Get role from custom claims
      const idTokenResult = await user.getIdTokenResult()
      const role = (idTokenResult.claims.role as string) || "admin"
      setUserRole(role)

      const db = getFirestore()

      /* ===================== ADMIN ===================== */
      if (role === "admin") {
        const q = query(
          collection(db, "clients"),
          orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q)

        const clientsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Client[]
        setClients(clientsData)
        return
      }

      /* ===================== ENGINEER ===================== */

      // 1️⃣ Read engineer's OWN user document
      const userDoc = await getDoc(
        doc(db, "users", user.uid)
      )

      if (!userDoc.exists()) {
        console.error("Engineer user document not found")
        setClients([])
        return
      }

      const assignedClients: string[] =
        userDoc.data().assignedClients || []

      console.log("[v0] Engineer assigned clients:", assignedClients)

      // 2️⃣ Fetch ONLY assigned client documents
      const clientDocs = await Promise.all(
        assignedClients.map((clientId: string) =>
          getDoc(doc(db, "clients", clientId))
        )
      )

      const clientsData = clientDocs
        .filter((d) => d.exists())
        .map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Client[]
      setClients(clientsData)

    } catch (error) {
      console.error("[v0] Failed to fetch clients:", error)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground">
            {userRole === "engineer"
              ? "Manage your assigned client accounts"
              : "Manage client accounts and their configurations"}
          </p>
        </div>

        {userRole === "admin" && (
          <CreateClientDialog onSuccess={fetchClients} />
        )}
      </div>

      {loading ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Loading clients...</p>
          </CardContent>
        </Card>
      ) : clients.length === 0 ? (
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">
              No clients assigned
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card className="border-white/20 cursor-default">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Total Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold tracking-tight text-foreground">{stats.total}</div>
                <p className="text-xs text-muted-foreground mt-2">
                  All active clients
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/20 cursor-default">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Online Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground">{stats.online}</div>
                  <span className="h-3 w-3 rounded-full bg-accent/80 animate-pulse" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Currently active
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/20 cursor-default">
              <CardHeader className="pb-3">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Offline Clients
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-bold tracking-tight text-foreground">{stats.offline}</div>
                  <span className="h-3 w-3 rounded-full bg-destructive/60" />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Currently inactive
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Clients Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {userRole === "engineer" ? "Assigned Clients" : "All Clients"}
              </CardTitle>
              <CardDescription>
                {userRole === "engineer"
                  ? "Clients assigned to you"
                  : "All client accounts in the system"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RCSClientsTable clients={clients} onUpdate={fetchClients} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
