"use client"

import type { Client } from "@/types"
import { resolveHeartbeatStatus } from "@/lib/heartbeat"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase-client"

interface Props {
  clients: Client[]
  onUpdate: () => void
}

export function RCSClientsTable({ clients }: Props) {
 const [closingInfo, setClosingInfo] = useState<
  Record<string, { lastClosingDate: string; lastClosingBalance: number | string }>
>({})
  const [clientEmails, setClientEmails] = useState<Record<string, string>>({})
  



  /* ================= FETCH CLOSING INFO ================= */

  useEffect(() => {
  async function loadEmails() {
    const snap = await getDocs(collection(db, "users"))

    const map: Record<string, string> = {}

    snap.docs.forEach((doc) => {
      const data = doc.data()

      if (data.clientId && data.email) {
        map[data.clientId] = data.email
      }
    })

    setClientEmails(map)
  }

  loadEmails()
}, [])
function formatDate(value: any): string {
  if (!value) return "—"

  // If Firestore Timestamp
  if (value.seconds !== undefined) {
    const date = new Date(value.seconds * 1000)
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

  // If already a string
  return value
}
useEffect(() => {
  async function loadBalances() {
    const snap = await getDocs(collection(db, "cashbalances"))
    const map: Record<
      string,
      { lastClosingDate: string; lastClosingBalance: number | string }
    > = {}

    snap.docs.forEach((doc) => {
      const data = doc.data()
      if (!data.clientName) return
      map[data.clientName] = {
        lastClosingDate: formatDate(data.lastClosingDate) ?? "—",
        lastClosingBalance: data.lastClosingBalance ?? "—",
      }
    })

    setClosingInfo(prev => ({
  ...prev,
  ...map
}))
  }

  loadBalances()
}, [clients])

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Closed Date</TableHead>
            <TableHead>Last Closed Cash Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const online = resolveHeartbeatStatus(client.lastSeen) === "online"
            const balance = closingInfo[client.name]

            return (
              <TableRow key={client.id}>
                <TableCell>{client.name}</TableCell>
                <TableCell>{clientEmails[client.id] ?? "—"}</TableCell>
                <TableCell>
                  <span className={online ? "text-green-600 font-semibold" : "text-red-600 font-semibold"}>
                    {online ? "Online" : "Offline"}
                  </span>
                </TableCell>
                <TableCell>{formatDate(balance?.lastClosingDate) ?? "—"}</TableCell>
                <TableCell>{balance?.lastClosingBalance ?? "—"}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}