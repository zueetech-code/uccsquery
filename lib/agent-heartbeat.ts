import { queryOne } from "@/lib/db-client"

export async function getLastSeen(
  clientId: string
): Promise<string | null> {
  try {
    const heartbeat = await queryOne(
      `SELECT last_heartbeat FROM agent_heartbeats 
       WHERE client_id = (SELECT id FROM clients WHERE client_id = $1)
       ORDER BY created_at DESC LIMIT 1`,
      [clientId]
    )

    return heartbeat?.last_heartbeat ?? null
  } catch (err) {
    console.error("Error fetching last seen:", err)
    return null
  }
}
