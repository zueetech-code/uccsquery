import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { FieldValue, Timestamp } from "firebase-admin/firestore"

export async function GET() {
  try {
    const start = new Date()
    start.setHours(0, 0, 0, 0)

    const clientsSnap = await adminDb.collection("clients").get()
    let created = 0

    for (const c of clientsSnap.docs) {
      const clientId = c.id

      // ✅ CHECK IF COMMAND EXISTS TODAY
      // ✅ INDEX-FREE: only ONE where
const existingSnap = await adminDb
  .collection("commands")
  .where("clientId", "==", clientId)
  .get()

let alreadyExecutedToday = false

const today = new Date()
today.setHours(0, 0, 0, 0)

existingSnap.forEach(doc => {
  const cmd = doc.data()

  if (
    cmd.queryId === "kvshJ7oJ4x8GXgZOi950" &&
    cmd.createdAt?.toDate() >= today
  ) {
    alreadyExecutedToday = true
  }
})

if (alreadyExecutedToday) continue

      // 🔥 CREATE COMMAND — IDENTICAL TO EXECUTE QUERY PAGE
      await adminDb.collection("commands").add({
        clientId,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(), // 🔴 IMPORTANT
        queryId: "kvshJ7oJ4x8GXgZOi950",
        variables: {
          Fromdate: new Date().toISOString().split("T")[0],
        },
      })

      created++
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