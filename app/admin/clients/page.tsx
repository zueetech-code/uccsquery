"use client"

import { CreateClientDialog } from "@/components/create-client-dialog"
import { RCSClientsTable } from "@/components/rcs-client-table"
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
import { resolveHeartbeatStatus } from "@/lib/heartbeat"
import { subscribeLastSeen } from "@/lib/agent-heartbeat"

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [liveClients, setLiveClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>("admin")
  const [filter, setFilter] = useState<"all" | "online" | "offline">("all")

  /* ================= FETCH CLIENTS ================= */

  useEffect(() => {
    fetchClients()
    fetch("/api/clients/auto-execute").catch(console.error)
  }, [])

  const fetchClients = async () => {
    try {
      setLoading(true)

      const user = auth.currentUser
      if (!user) return

      const idTokenResult = await user.getIdTokenResult()
      const role = (idTokenResult.claims.role as string) || "admin"
      setUserRole(role)

      const db = getFirestore()

      /* ================= ADMIN ================= */
      if (role === "admin") {
        const q = query(
          collection(db, "clients"),
          orderBy("createdAt", "desc")
        )

        const snapshot = await getDocs(q)
        const data = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as Client[]

        setClients(data)
        return
      }

      /* ================= ENGINEER ================= */
      const userDoc = await getDoc(doc(db, "users", user.uid))
      if (!userDoc.exists()) {
        setClients([])
        return
      }

      const assignedClients: string[] =
        userDoc.data().assignedClients || []

      const docs = await Promise.all(
        assignedClients.map((id) => getDoc(doc(db, "clients", id)))
      )

      const data = docs
        .filter((d) => d.exists())
        .map((d) => ({ id: d.id, ...d.data() })) as Client[]

      setClients(data)
    } catch (e) {
      console.error(e)
      setClients([])
    } finally {
      setLoading(false)
    }
  }

  /* ================= SYNC TO LIVE CLIENTS ================= */

  useEffect(() => {
    setLiveClients(clients)
  }, [clients])

  /* ================= HEARTBEAT SUBSCRIBE ================= */

  useEffect(() => {
    if (clients.length === 0) return

    const unsubscribers = clients.map((client) =>
      subscribeLastSeen(client.id, (lastSeen) => {
        setLiveClients((prev) =>
          prev.map((c) =>
            c.id === client.id ? { ...c, lastSeen } : c
          )
        )
      })
    )

    return () => {
      unsubscribers.forEach((u) => u && u())
    }
  }, [clients])

  /* ================= STATS ================= */

  const stats = useMemo(() => {
    const total = liveClients.length
    const online = liveClients.filter(
      (c) => resolveHeartbeatStatus(c.lastSeen) === "online"
    ).length
    const offline = total - online
    return { total, online, offline }
  }, [liveClients])

  /* ================= FILTER ================= */

  const filteredClients = useMemo(() => {
    if (filter === "all") return liveClients
    if (filter === "online")
      return liveClients.filter(
        (c) => resolveHeartbeatStatus(c.lastSeen) === "online"
      )
    return liveClients.filter(
      (c) => resolveHeartbeatStatus(c.lastSeen) === "offline"
    )
  }, [liveClients, filter])

  /* ================= UI ================= */

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
            Loading clients...
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ================= STAT CARDS ================= */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <Card onClick={() => setFilter("all")} className="cursor-pointer">
              <CardHeader>
                <CardTitle>Total Clients</CardTitle>
              </CardHeader>
              <CardContent>{stats.total}</CardContent>
            </Card>

            <Card onClick={() => setFilter("online")} className="cursor-pointer">
              <CardHeader>
                <CardTitle>Online Clients</CardTitle>
              </CardHeader>
              <CardContent>{stats.online}</CardContent>
            </Card>

            <Card onClick={() => setFilter("offline")} className="cursor-pointer">
              <CardHeader>
                <CardTitle>Offline Clients</CardTitle>
              </CardHeader>
              <CardContent>{stats.offline}</CardContent>
            </Card>
          </div>

          {/* ================= TABLE ================= */}
          <Card>
            <CardHeader>
              <CardTitle>
                {filter === "all"
                  ? "All Clients"
                  : filter === "online"
                  ? "Online Clients"
                  : "Offline Clients"}
              </CardTitle>
              <CardDescription>
                Showing {filteredClients.length} of {liveClients.length}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <RCSClientsTable
                clients={filteredClients}
                onUpdate={fetchClients}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}