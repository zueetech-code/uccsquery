import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey !== process.env.PULL_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clientNames } = await req.json()

  if (!Array.isArray(clientNames) || clientNames.length === 0) {
    return NextResponse.json({ error: "clientNames array is required" }, { status: 400 })
  }

  // Map each clientName to a Promise that fetches its data
  const promises = clientNames.map(async (clientName) => {
    try {
      // Step 3: Get agentUid from clients
      const clientSnap = await adminDb
        .collection("clients")
        .where("name", "==", clientName)
        .limit(1)
        .get()

      if (clientSnap.empty) {
        return { clientName, error: "Client not found" }
      }

      const agentUid = clientSnap.docs[0].data().agentUid

      // Step 4: Get latest query result using agentUid
      const resultSnap = await adminDb
        .collection("temp_query_results")
        .where("agentUid", "==", agentUid)
        .orderBy("createdAt", "desc")
        .limit(1)
        .get()

      if (resultSnap.empty) {
        return { clientName, error: "No data found for client" }
      }

      const resultDoc = resultSnap.docs[0]

      // Step 5: Read rows subcollection
      const rowsSnap = await resultDoc.ref.collection("rows").get()
      const data = rowsSnap.docs.map(doc => doc.data())

      return { clientName, data }

    } catch (error) {
      return { clientName, error: "Internal server error" }
    }
  })

  // Wait for all queries to finish
  const resultsArray = await Promise.all(promises)

  // Optionally, convert results array to an object keyed by clientName
  const results = resultsArray.reduce((acc, item) => {
    acc[item.clientName] = item.error ? { error: item.error } : { data: item.data }
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json(results)
}
