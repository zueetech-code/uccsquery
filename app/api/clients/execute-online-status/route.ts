import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue } from "firebase-admin/firestore"

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
    const heartbeatSnap = await adminDb
      .collection("agent_heartbeats")
      .where("status", "==", "online")
      .get()

    const onlineClientIds = heartbeatSnap.docs.map(doc => doc.data().clientId)

    if (onlineClientIds.length === 0) {
      return NextResponse.json({ processedClients: 0 })
    }

    // ================== 2️⃣ Fetch client details ==================
    const clientsSnap = await adminDb
      .collection("clients")
      .where("__name__", "in", onlineClientIds) // fetch only online clients
      .get()

    let processedClients = 0

    for (const c of clientsSnap.docs) {
      const client = c.data()
      const clientName = client.name
      const clientId = c.id

      // ================== 3️⃣ Create command ==================
      await adminDb.collection("commands").add({
        clientId,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
        queryId: "kvshJ7oJ4x8GXgZOi950",
        variables: { Fromdate: todayStr },
      })

      // ================== 4️⃣ Get latest successful command ==================
      const commandsSnap = await adminDb
        .collection("commands")
        .where("clientId", "==", clientId)
        .where("queryId", "==", "kvshJ7oJ4x8GXgZOi950")
        .where("status", "==", "success")
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()

      let lastClosingDate = "—"
      let lastClosingBalance: number | string = "—"

      if (!commandsSnap.empty) {
        const latestCommand = commandsSnap.docs[0].data()
        if (latestCommand.resultsPath) {
          const rowsSnap = await adminDb
            .collection(`${latestCommand.resultsPath}/rows`)
            .get()

          if (!rowsSnap.empty) {
            const row = rowsSnap.docs[0].data()
            lastClosingDate = row.lastdate ?? "—"
            lastClosingBalance = row.closingbalance ?? "—"

            if (typeof lastClosingBalance === "string") {
              lastClosingBalance =
                parseFloat(lastClosingBalance.replace(/[^0-9.-]+/g, "")) || 0
            }
          }
        }
      }

      // ================== 5️⃣ Save/update cashbalances ==================
      const docId = `${clientName}-${todayStr}`
      const dataToSave = {
        clientName,
        email: client.email ?? "",
        district: client.district ?? "",
        lastClosingDate,
        lastClosingBalance,
        updatedAt: FieldValue.serverTimestamp(),
      }

      const balanceRef = adminDb.collection("cashbalances").doc(docId)
      const balanceDoc = await balanceRef.get()
      if (balanceDoc.exists) {
        await balanceRef.update(dataToSave)
      } else {
        await balanceRef.set(dataToSave)
      }

      processedClients++
    }

    return NextResponse.json({ processedClients })
  } catch (err: any) {
    console.error("[execute-online-status]", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}