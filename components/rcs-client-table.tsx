"use client"

import type { Client } from "@/types"
import { resolveHeartbeatStatus } from "@/lib/heartbeat"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2, UserPlus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useEffect, useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { getFirestore, doc, updateDoc, deleteDoc, query, Timestamp, where, orderBy, limit } from "firebase/firestore"
import { AssignAgentDialog } from "./assign-agent-dialog"
import { EditClientDialog } from "./edit-client-dialog"
import { subscribeLastSeen } from "@/lib/agent-heartbeat"
import { collection, getDocs } from "firebase/firestore"
import { db } from "@/lib/firebase-client"


interface RCSClientsTableProps {
  clients: Client[]
  onUpdate: () => void
}


export function RCSClientsTable({ clients, onUpdate }: RCSClientsTableProps) {
  const { toast } = useToast()
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [assignAgentOpen, setAssignAgentOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [liveClients, setLiveClients] = useState<Client[]>(clients)
  const [closingInfo, setClosingInfo] = useState<
  Record<string, { date: string; balance: number | string }>
>({})


  const handleDelete = async () => {
    if (!selectedClient) return

    try {
      const db = getFirestore()
      const clientRef = doc(db, "clients", selectedClient.id)
      await deleteDoc(clientRef)

      toast({
        title: "Client deleted",
        description: `Client ${selectedClient.name} has been deleted.`,
      })
      onUpdate()
    } catch (error: any) {
      console.error("[v0] Delete client error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete client",
        variant: "destructive",
      })
    }

    setDeleteDialogOpen(false)
    setSelectedClient(null)
  }
  function formatDate(value: any): string {
  if (!value) return "—"

  // Firestore Timestamp
  if (typeof value === "object" && "seconds" in value) {
    const date = new Date(value.seconds * 1000)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  // Already string
  return String(value)
}

  const handleToggleStatus = async (client: Client) => {
    const newStatus = client.status === "active" ? "disabled" : "active"

    try {
      const db = getFirestore()
      const clientRef = doc(db, "clients", client.id)
      await updateDoc(clientRef, { status: newStatus })

      toast({
        title: "Status updated",
        description: `Client ${client.name} is now ${newStatus}.`,
      })
      onUpdate()
    } catch (error: any) {
      console.error("[v0] Update status error:", error)
      toast({
        title: "Error",
        description: error.message || "Failed to update status",
        variant: "destructive",
      })
    }
  }
        useEffect(() => {
        // sync when parent reloads
        setLiveClients(clients)

        // realtime lastSeen subscription
        const unsubscribers = clients.map((client) =>
          subscribeLastSeen(client.id, (lastSeen) => {
            setLiveClients((prev) =>
              prev.map((c) =>
                c.id === client.id ? { ...c, lastSeen } : c
              )
            )
          })
        )

        // ⏱ UI TIMER — detects crash / power cut
        const interval = setInterval(() => {
          setLiveClients((prev) =>
            prev.map((c) => ({
              ...c,
              // 👇 status is DERIVED, not stored
              isOnline: resolveHeartbeatStatus(c.lastSeen) === "online",
            }))
          )
        }, 60_000)

        return () => {
          unsubscribers.forEach((u) => u && u())
          clearInterval(interval)
        }
      }, [clients])

      useEffect(() => {
  liveClients.forEach(async (client) => {
    const online =
      resolveHeartbeatStatus(client.lastSeen) === "online"

    if (!online) return

    const result = await fetchClosingResult(client.id)
    if (!result) return

    setClosingInfo((prev) => ({
      ...prev,
      [client.id]: result,
    }))
  })
}, [liveClients])

async function fetchClosingResult(clientId: string) {
  // 1️⃣ Fetch ALL successful commands for this client
  const cmdSnap = await getDocs(
    query(
      collection(db, "commands"),
      where("clientId", "==", clientId) // ✅ single where → index-free
    )
  )

  if (cmdSnap.empty) return null

  // 2️⃣ Filter in JS (index-free)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const todaysCommands = cmdSnap.docs
    .map(d => d.data())
    .filter(cmd =>
      cmd.queryId === "kvshJ7oJ4x8GXgZOi950" &&
      cmd.status === "success" &&
      cmd.createdAt?.toDate() >= today
    )

  if (todaysCommands.length === 0) return null

  // 3️⃣ Pick latest command (JS sort)
  const latest = todaysCommands.sort(
    (a, b) =>
      b.createdAt.toDate().getTime() -
      a.createdAt.toDate().getTime()
  )[0]

  if (!latest.resultsPath) return null

  // 4️⃣ Read temp query results
  const rowsSnap = await getDocs(
    collection(db, `${latest.resultsPath}/rows`)
  )

  if (rowsSnap.empty) return null

  const row = rowsSnap.docs[0].data()

  return {
    date: row.lastdate ?? "—",
    balance: row.closingbalance ?? "—",
  }
}

  if (clients.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold">No clients</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new client.</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              {/* <TableHead>Status</TableHead> */}
              <TableHead>Last Seen</TableHead>
              <TableHead>Last Closed Date</TableHead>
              <TableHead>Last Closed Cash Balance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {liveClients.map((client) => (
              
              <TableRow key={client.id}>
                <TableCell className="font-medium">{client.name}</TableCell>
                {/* <TableCell>
                  <Badge variant={client.status === "active" ? "default" : "secondary"}>{client.status}</Badge>
                </TableCell> */}
                <TableCell>
                  {(() => {
                    const online = resolveHeartbeatStatus(client.lastSeen) === "online"

                    return (
                      <div className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${
                            online ? "bg-green-500" : "bg-red-500"
                          }`}
                        />
                        <span
                          className={`text-sm font-medium ${
                            online ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {online ? "Online" : "Offline"}
                        </span>
                      </div>
                    )
                  })()}
                </TableCell>
                
                <TableCell>
                  {formatDate(closingInfo[client.id]?.date ?? "—")}
                </TableCell>
                
                <TableCell>
                  {closingInfo[client.id]?.balance ?? "—"}
                  </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedClient && (
        <>
          <EditClientDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            client={selectedClient}
            onSuccess={onUpdate}
          />
          <AssignAgentDialog
            open={assignAgentOpen}
            onOpenChange={setAssignAgentOpen}
            client={selectedClient}
            onSuccess={onUpdate}
          />
        </>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the client {selectedClient?.name}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
