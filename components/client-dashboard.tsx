"use client"

import { useState, useMemo } from "react"
import type { Client } from "@/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { resolveHeartbeatStatus } from "@/lib/heartbeat"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type FilterType = "all" | "online" | "offline"

interface ClientDashboardProps {
  clients: Client[]
  onUpdate?: () => void
}

export function ClientDashboard({ clients }: ClientDashboardProps) {
  const [filter, setFilter] = useState<FilterType>("all")

  // Calculate statistics
  const stats = useMemo(() => {
    const onlineCount = clients.filter(
      (c) => resolveHeartbeatStatus(c.lastSeen) === "online"
    ).length
    const offlineCount = clients.filter(
      (c) => resolveHeartbeatStatus(c.lastSeen) === "offline"
    ).length

    return {
      total: clients.length,
      online: onlineCount,
      offline: offlineCount,
    }
  }, [clients])

  // Filter clients based on selected filter
  const filteredClients = useMemo(() => {
    if (filter === "all") return clients

    return clients.filter((client) => {
      const isOnline = resolveHeartbeatStatus(client.lastSeen) === "online"
      return filter === "online" ? isOnline : !isOnline
    })
  }, [clients, filter])

  const handleCardClick = (filterType: FilterType) => {
    setFilter(filterType)
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Total Clients Card */}
        <Card
          className={`cursor-pointer transition-colors ${
            filter === "all"
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
              : "hover:bg-muted"
          }`}
          onClick={() => handleCardClick("all")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {filter === "all" ? "Selected" : "Click to view"}
            </p>
          </CardContent>
        </Card>

        {/* Online Clients Card */}
        <Card
          className={`cursor-pointer transition-colors ${
            filter === "online"
              ? "border-green-500 bg-green-50 dark:bg-green-950"
              : "hover:bg-muted"
          }`}
          onClick={() => handleCardClick("online")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Online Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.online}</div>
              <span className="h-3 w-3 rounded-full bg-green-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {filter === "online" ? "Selected" : "Click to view"}
            </p>
          </CardContent>
        </Card>

        {/* Offline Clients Card */}
        <Card
          className={`cursor-pointer transition-colors ${
            filter === "offline"
              ? "border-red-500 bg-red-50 dark:bg-red-950"
              : "hover:bg-muted"
          }`}
          onClick={() => handleCardClick("offline")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Offline Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{stats.offline}</div>
              <span className="h-3 w-3 rounded-full bg-red-500" />
            </div>
            <p className="text-xs text-muted-foreground">
              {filter === "offline" ? "Selected" : "Click to view"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Client List */}
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
            Showing {filteredClients.length} of {clients.length} clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <h3 className="text-sm font-semibold">No clients found</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  No clients match the selected filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Client ID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Online Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const isOnline =
                      resolveHeartbeatStatus(client.lastSeen) === "online"
                    return (
                      <TableRow key={client.id}>
                        <TableCell className="font-medium">
                          {client.name}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {client.id}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              client.status === "active"
                                ? "default"
                                : "secondary"
                            }
                          >
                            {client.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isOnline
                                  ? "bg-green-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                isOnline
                                  ? "text-green-600"
                                  : "text-red-600"
                              }`}
                            >
                              {isOnline ? "Online" : "Offline"}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
