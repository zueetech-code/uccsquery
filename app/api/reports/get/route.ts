import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"

export async function GET(req: Request) {

  const { searchParams } = new URL(req.url)

  const clientId = searchParams.get("clientId")
  const fromDate = searchParams.get("fromDate")

  const apiKey = req.headers.get("x-api-key")

  if (apiKey !== process.env.PULL_API_KEY) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    )
  }

  if (!clientId || !fromDate) {
    return NextResponse.json(
      { error: "clientId and fromDate required" },
      { status: 400 }
    )
  }

  try {

    const docId = `${clientId}_${fromDate}`

    const docSnap = await adminDb
      .collection("final_reports")
      .doc(docId)
      .get()

    if (!docSnap.exists) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: docSnap.data()
    })

  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
