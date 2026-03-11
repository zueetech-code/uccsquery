"use client"

import { queryOne } from "@/lib/db-client"

/**
 * Fetch agent heartbeat from database
 */
export async function getAgentHeartbeat(
  agentUid: string
): Promise<string | null> {
  try {
    const heartbeat = await queryOne(
      `SELECT last_heartbeat FROM agent_heartbeats 
       WHERE agent_id = (SELECT id FROM agents WHERE agent_id = $1)
       ORDER BY created_at DESC LIMIT 1`,
      [agentUid]
    )

    return heartbeat?.last_heartbeat ?? null
  } catch (err) {
    console.error("Error fetching agent heartbeat:", err)
    return null
  }
}
