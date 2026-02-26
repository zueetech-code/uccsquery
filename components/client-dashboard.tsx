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
    <div className="space-y-8">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        {/* Total Clients Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 border-border/40 ${
            filter === "all"
              ? "border-primary/40 bg-card ring-1 ring-primary/20 shadow-xl"
              : "hover:border-primary/20 hover:bg-card/80"
          }`}
          onClick={() => handleCardClick("all")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold tracking-tight">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {filter === "all" ? "All clients" : "Click to view all"}
            </p>
          </CardContent>
        </Card>

        {/* Online Clients Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 border-border/40 ${
            filter === "online"
              ? "border-accent/40 bg-card ring-1 ring-accent/20 shadow-xl"
              : "hover:border-accent/20 hover:bg-card/80"
          }`}
          onClick={() => handleCardClick("online")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Online Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold tracking-tight">{stats.online}</div>
              <span className="h-3 w-3 rounded-full bg-accent/80 animate-pulse" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filter === "online" ? "Active now" : "Click to view"}
            </p>
          </CardContent>
        </Card>

        {/* Offline Clients Card */}
        <Card
          className={`cursor-pointer transition-all duration-300 border-border/40 ${
            filter === "offline"
              ? "border-destructive/40 bg-card ring-1 ring-destructive/20 shadow-xl"
              : "hover:border-destructive/20 hover:bg-card/80"
          }`}
          onClick={() => handleCardClick("offline")}
        >
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Offline Clients
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="text-3xl font-bold tracking-tight">{stats.offline}</div>
              <span className="h-3 w-3 rounded-full bg-destructive/60" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {filter === "offline" ? "Inactive" : "Click to view"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtered Client List */}
      <Card className="border-border/40">
        <CardHeader className="pb-4">
          <div className="flex items-end justify-between">
            <div>
              <CardTitle className="text-xl">
                {filter === "all"
                  ? "All Clients"
                  : filter === "online"
                    ? "Online Clients"
                    : "Offline Clients"}
              </CardTitle>
              <CardDescription className="mt-2">
                Showing {filteredClients.length} of {clients.length} clients
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="flex h-[250px] items-center justify-center rounded-lg border border-border/50 border-dashed bg-secondary/20">
              <div className="text-center">
                <h3 className="text-sm font-semibold">No clients found</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  No clients match the selected filter.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30 bg-secondary/40 hover:bg-secondary/40">
                    <TableHead className="font-semibold">Client Name</TableHead>
                    <TableHead className="font-semibold">Client ID</TableHead>
                    <TableHead className="font-semibold">Status</TableHead>
                    <TableHead className="font-semibold">Connection</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => {
                    const isOnline =
                      resolveHeartbeatStatus(client.lastSeen) === "online"
                    return (
                      <TableRow key={client.id} className="border-border/30 hover:bg-secondary/30 transition-colors">
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
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`h-2.5 w-2.5 rounded-full ${
                                isOnline
                                  ? "bg-accent"
                                  : "bg-destructive/60"
                              }`}
                            />
                            <span
                              className={`text-sm font-medium ${
                                isOnline
                                  ? "text-accent"
                                  : "text-destructive/80"
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
