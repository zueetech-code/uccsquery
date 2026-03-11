import { NextResponse } from "next/server"
import { getReportByClientIdAndDate, getLatestReportByClientId } from "@/lib/db-queries"

export async function POST(req: Request) {

  /* ================= API KEY CHECK ================= */
  const apiKey = req.headers.get("x-api-key")

  if (apiKey !== process.env.PULL_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  const body = await req.json()

  /* ================= SUPPORT SINGLE OR MULTIPLE ================= */

  let clientIds: string[] = []
  const fromDate: string | undefined = body.fromDate

  if (body.clientIds && Array.isArray(body.clientIds)) {
    clientIds = body.clientIds
  } else if (body.clientId && typeof body.clientId === "string") {
    clientIds = [body.clientId]
  } else {
    return NextResponse.json(
      { error: "clientId or clientIds array is required" },
      { status: 400 }
    )
  }

  /* ================= PROCESS ALL CLIENTS IN PARALLEL ================= */

  const promises = clientIds.map(async (clientId) => {
    try {

      let report

      // If fromDate provided → fetch report for that date
      if (fromDate) {
        report = await getReportByClientIdAndDate(clientId, fromDate)
      } else {
        // If no date → fetch latest report
        report = await getLatestReportByClientId(clientId)
      }

      if (!report) {
        return { clientId, error: "No report found" }
      }

      return { clientId, data: report }

    } catch (error) {
      console.error(error)
      return { clientId, error: "Internal server error" }
    }
  })

  const resultsArray = await Promise.all(promises)

  /* ================= FORMAT RESPONSE ================= */

  const results = resultsArray.reduce((acc, item) => {
    acc[item.clientId] = item.error
      ? { error: item.error }
      : { data: item.data }
    return acc
  }, {} as Record<string, any>)

  return NextResponse.json(results)
}
