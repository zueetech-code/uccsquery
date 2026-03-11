export interface Client {
  id: number
  client_id: string
  client_name: string
  email: string
  district?: string
  status: "active" | "disabled"
  online_status?: "online" | "offline"
  last_heartbeat?: string | null
  data?: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Agent {
  id: number
  agent_id: string
  email: string
  full_name?: string
  status: "active" | "inactive"
  last_heartbeat?: string | null
  created_at: string
  updated_at: string
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
  id: number
  client_id: number
  command_type: string
  command_data?: Record<string, any>
  status: "pending" | "running" | "success" | "failed"
  result?: Record<string, any>
  error?: string
  created_at: string
  updated_at?: string
}

export interface Engineer {
  id: number
  engineer_id: string
  email: string
  full_name?: string
  assigned_clients?: string[]
  created_at: string
  updated_at: string
}
