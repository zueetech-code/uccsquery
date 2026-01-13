import { Timestamp } from "firebase/firestore"
export interface Client {
  company: any
  id: string
  name: string
  status: "active" | "disabled"
  agentUid?: string
  createdAt: string
  lastSeen?: string | null
  heartbeatStatus?: "online" | "offline"
}

export interface Agent {
  uid: string
  email: string
  role: string
  clientId: string
  // from users
  createdAt: string

  // 🔥 from agent_heartbeats
  lastLogin?: string | null
  heartbeatStatus?: "online" | "offline"
}

export interface DatabaseConfig {
  clientId: string
  host: string
  port: number
  database: string
  username: string // encrypted
  password: string // encrypted
  updatedAt: string
}

export interface Query {
  description: any
  query: string
  id: string
  name: string
  sql: string
  variables: string[]
  createdAt: string
  assignedAgents?: string[] // Array of agent UIDs who can access this query
}

export interface Command {
  resultsPath: boolean
  queryType: string
  sql: any
  queryName: any
  executionTime: any
  id: string
  clientId: string
  queryId: string
  variables: Record<string, any>
  status: "pending" | "running" | "success" | "failed"
  result?: any
  error?: string
  createdAt: string
  completedAt?: string
}

export interface Engineer {
  uid: string
  email: string
  role: string
  assignedClients: string[] // Array of client IDs this engineer can access
  createdAt: string
  lastLogin?: string
}
