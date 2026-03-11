import { NextResponse } from "next/server"
import { getAllClients, getCommandsCreatedToday, createCommand } from "@/lib/db-queries"

export async function GET() {
  try {
    const clients = await getAllClients()
    let created = 0

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const client of clients) {
      // ✅ CHECK IF COMMAND EXISTS TODAY
      const existingCommands = await getCommandsCreatedToday("kvshJ7oJ4x8GXgZOi950", client.client_id)

      if (existingCommands.length > 0) {
        continue
      }

      // 🔥 CREATE COMMAND
      try {
        await createCommand({
          client_id: client.client_id,
          command_type: "kvshJ7oJ4x8GXgZOi950",
          command_data: {
            Fromdate: new Date().toISOString().split("T")[0],
          },
          status: "pending",
        })

        created++
      } catch (error) {
        console.error(`[auto-execute] Failed to create command for client ${client.client_id}:`, error)
      }
    }

    return NextResponse.json({ created })
  } catch (err: any) {
    console.error("[auto-execute]", err)
    return NextResponse.json(
      { error: err.message },
      { status: 500 }
    )
  }
}
