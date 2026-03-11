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
    const loadBalances = async () => {
      try {
        const response = await fetch('/api/balances')
        if (!response.ok) return
        const { balances } = await response.json()

        const map: Record<
          string,
          { lastClosingDate: string; lastClosingBalance: number | string }
        > = {}

        balances.forEach((balance: any) => {
          map[balance.client_name] = {
            lastClosingDate: formatDate(balance.last_closing_date) ?? "—",
            lastClosingBalance: balance.last_closing_balance ?? "—",
          }
        })

        setClosingInfo(map)
      } catch (err) {
        console.error("Error loading balances:", err)
      }
    }

    loadBalances()
  }, [clients])

  useEffect(() => {
    const loadEmails = async () => {
      try {
        const response = await fetch('/api/admin/users')
        if (!response.ok) return
        const { users } = await response.json()

        const map: Record<string, string> = {}
        users.forEach((user: any) => {
          if (user.uid && user.email) {
            map[user.uid] = user.email
          }
        })

        setClientEmails(map)
      } catch (err) {
        console.error("Error loading emails:", err)
      }
    }

    loadEmails()
  }, [])

  function formatDate(value: any): string {
    if (!value) return "—"

    // If ISO date string
    const date = new Date(value)
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date)
  }

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
