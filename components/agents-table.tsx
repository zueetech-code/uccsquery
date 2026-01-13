"use client"

import type { Agent, Client } from "@/types"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useEffect, useState } from "react"
import { subscribeAgentHeartbeat } from "@/lib/agent-heartbeat-agents"


interface AgentsTableProps {
  agents: Agent[]
  clients: Client[]
  onUpdate: () => void
}

export function AgentsTable({ agents, clients }: AgentsTableProps) {
  const [liveAgents, setLiveAgents] = useState<Agent[]>(agents)
  const getClientName = (clientId: string) => {
    const client = clients.find((c) => c.id === clientId)
    return client ? client.name : clientId
  }

  if (agents.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <h3 className="mt-2 text-sm font-semibold">No agents</h3>
          <p className="mt-1 text-sm text-muted-foreground">Create agents manually in Firebase Console.</p>
        </div>
      </div>
    )
  }
  function formatFirestoreDate(value: any): string {
  if (!value) return "—"

  // Firestore Timestamp
  if (typeof value === "object" && "toDate" in value) {
    return value.toDate().toLocaleDateString("en-GB")
  }

  const date = new Date(value)
  return isNaN(date.getTime()) ? "—" : date.toLocaleDateString("en-GB")
}
function getOnlineStatus(status?: string) {
  const online = status === "online"
  return {
    online,
    label: online ? "Online" : "Offline",
  }
}


  useEffect(() => {
  setLiveAgents(agents)

  const unsubscribers = agents.map((agent) =>
          subscribeAgentHeartbeat(agent.uid, ({ lastLogin, heartbeatStatus }) => {
            setLiveAgents((prev) =>
              prev.map((a) =>
                a.uid === agent.uid
                  ? { ...a, lastLogin, heartbeatStatus: heartbeatStatus as "online" | "offline" | undefined }
                  : a
              )
            )
          })
        )

        return () => {
          unsubscribers.forEach((unsub) => unsub && unsub())
        }
      }, [agents])

      function formatDateDDMMYYYY(value: any): string {
  if (!value) return "—"

  let date: Date

  // Firestore Timestamp
  if (typeof value === "object" && "toDate" in value) {
    date = value.toDate()
  } else {
    date = new Date(value)
  }

  if (isNaN(date.getTime())) return "—"

  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = date.getFullYear()

  return `${dd}-${mm}-${yyyy}`
}

  

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Last Login</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {liveAgents.map((agent) => (
            <TableRow key={agent.uid}>
              <TableCell className="font-mono text-sm">{agent.email}</TableCell>
              <TableCell className="font-medium">{getClientName(agent.clientId)}</TableCell>
              <TableCell>
                <Badge variant="outline">{agent.role}</Badge>
              </TableCell>
              <TableCell className="text-muted-foreground">{formatDateDDMMYYYY(agent.createdAt)}</TableCell>
              <TableCell>
                  {(() => {
                    const { online, label } = getOnlineStatus(agent.heartbeatStatus)

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
                          {label}
                        </span>
                      </div>
                    )
                  })()}
                </TableCell>

            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
