import { NextResponse } from "next/server"
import { getOnlineHeartbeats, getClientsByIds, createCommand, getLatestSuccessfulCommands, insert, findByColumn, update } from "@/lib/db-queries"

export async function GET() {
  try {
    const today = new Date()

    const todayStr =
      today.getFullYear() +
      "-" +
      String(today.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(today.getDate()).padStart(2, "0")

    // ================== 1️⃣ Get all online clients ==================
    const onlineHeartbeats = await getOnlineHeartbeats()
    const onlineClientIds = onlineHeartbeats.map(hb => hb.client_id)

    if (onlineClientIds.length === 0) {
      return NextResponse.json({ processedClients: 0 })
    }

    // ================== 2️⃣ Fetch client details ==================
    const clients = await getClientsByIds(onlineClientIds)

    let processedClients = 0

    for (const client of clients) {
      const clientName = client.client_name
      const clientId = client.client_id

      // ================== 3️⃣ Create command ==================
      try {
        await createCommand({
          client_id: clientId,
          command_type: "kvshJ7oJ4x8GXgZOi950",
          command_data: { Fromdate: todayStr },
          status: "pending",
        })
      } catch (err) {
        console.error(`Failed to create command for client ${clientId}:`, err)
      }

      // ================== 4️⃣ Get latest successful command ==================
      const latestCommands = await getLatestSuccessfulCommands(clientId, "kvshJ7oJ4x8GXgZOi950", 1)

      let lastClosingDate = "—"
      let lastClosingBalance: number | string = "—"

      if (latestCommands.length > 0) {
        const latestCommand = latestCommands[0]
        lastClosingDate = latestCommand.last_closing_date ?? "—"
        lastClosingBalance = latestCommand.last_closing_balance ?? "—"

        if (typeof lastClosingBalance === "string") {
          lastClosingBalance =
            parseFloat(lastClosingBalance.replace(/[^0-9.-]+/g, "")) || 0
        }
      }

      // ================== 5️⃣ Save/update cashbalances ==================
      const dataToSave = {
        client_name: clientName,
        email: client.email ?? "",
        district: client.district ?? "",
        last_closing_date: lastClosingDate,
        last_closing_balance: lastClosingBalance,
      }

      const existing = await findByColumn('balances', 'client_name', clientName)
      if (existing) {
        await update('balances', existing.id, dataToSave)
      } else {
        await insert('balances', dataToSave)
      }

      processedClients++
    }

    return NextResponse.json({ processedClients })
  } catch (err: any) {
    console.error("[execute-online-status]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
