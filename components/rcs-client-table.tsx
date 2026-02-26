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
    Record<string, { date: string; balance: number | string }>
  >({})

  function formatDate(value: any): string {
  if (!value?.seconds) return "—"

  const date = new Date(value.seconds * 1000)
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date)
}

  /* ================= FETCH CLOSING INFO ================= */

  useEffect(() => {
    clients.forEach(async (client) => {
      const online =
        resolveHeartbeatStatus(client.lastSeen) === "online"
      if (!online) return

      const snap = await getDocs(
        query(
          collection(db, "commands"),
          where("clientId", "==", client.id)
        )
      )

      if (snap.empty) return

      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const latest = snap.docs
        .map((d) => d.data())
        .filter(
          (c) =>
            c.queryId === "kvshJ7oJ4x8GXgZOi950" &&
            c.status === "success" &&
            c.createdAt?.toDate() >= today
        )
        .sort(
          (a, b) =>
            b.createdAt.toDate().getTime() -
            a.createdAt.toDate().getTime()
        )[0]

      if (!latest?.resultsPath) return

      const rows = await getDocs(
        collection(db, `${latest.resultsPath}/rows`)
      )
      if (rows.empty) return

      const row = rows.docs[0].data()

      setClosingInfo((prev) => ({
        ...prev,
        [client.id]: {
          date: row.lastdate ?? "—",
          balance: row.closingbalance ?? "—",
        },
      }))
    })
  }, [clients])

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Client Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Last Closed Date</TableHead>
            <TableHead>Last Closed Cash Balance</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clients.map((client) => {
            const online =
              resolveHeartbeatStatus(client.lastSeen) === "online"

            return (
              <TableRow key={client.id}>
                <TableCell className="font-medium">
                  {client.name}
                </TableCell>

                <TableCell>
                  <span
                    className={`font-semibold ${
                      online ? "text-green-600" : "text-red-600"
                    }`}
                  >
                    {online ? "Online" : "Offline"}
                  </span>
                </TableCell>

                <TableCell>
                  {formatDate(closingInfo[client.id]?.date)}
                </TableCell>

                <TableCell>
                  {closingInfo[client.id]?.balance ?? "—"}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}