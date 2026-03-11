import { query, update } from "@/lib/db-client"

let started = false

export function startCommandTimeoutWorker() {

  if (started) return
  started = true

  console.log("Command timeout worker started")

  setInterval(async () => {

    try {

      const commands = await query(
        `SELECT * FROM commands WHERE status = $1 AND created_at < NOW() - INTERVAL '20 minutes'`,
        ['pending']
      )

      for (const cmd of commands) {

        await update('commands', cmd.id, {
          status: 'failed',
          error: 'Timeout > 20 minutes',
        })

        console.log("Command timed out:", cmd.id)

      }

    } catch (err) {

      console.error("Timeout worker error:", err)

    }

  }, 60000) // every 1 minute

}
