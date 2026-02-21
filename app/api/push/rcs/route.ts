import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebase-admin"
import { logPushStatus } from "@/lib/pushLogger"
import https from "https"

/* ================= CONFIG ================= */

const DRY_RUN = process.env.RCS_DRY_RUN === "true"

const DEPOSIT_LOAN_URL =
  "https://dashboard.kooturavu.tn.gov.in/v1/api/uccs/deposit_loan/upsert"

const JEWEL_URL =
  "https://dashboard.kooturavu.tn.gov.in/v1/api/uccs/jwel/upsert"

const BATCH_SIZE = 10
const REQUEST_TIMEOUT = 15000

/* ================= KEEP ALIVE AGENT ================= */

const httpsAgent = new https.Agent({
  keepAlive: true,
  maxSockets: 20,
  maxFreeSockets: 10,
  timeout: 60000,
})

/* ================= SAFE FETCH ================= */

async function safeFetch(url: string, payload: any) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.RCS_API_KEY!,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    })

    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = text }

    return { ok: res.ok, status: res.status, data }
  } catch (error: any) {
    return {
      ok: false,
      status: 500,
      data: { error: error.message || "Request failed" },
    }
  } finally {
    clearTimeout(timeout)
  }
}

/* ================= API ================= */

export async function POST(req: Request) {
  /* ✅ Collect actual RCS responses */
  const depositLoanResponses: any[] = []
  const jewelResponses: any[] = []

  try {
    /* ---------- AUTH ---------- */
    const apiKey = req.headers.get("x-api-key")
    if (apiKey !== process.env.PUSH_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    /* ---------- INPUT ---------- */
    const { clientName, fromDate } = await req.json()

    if (!clientName || !fromDate) {
      return NextResponse.json(
        { error: "clientName and fromDate required" },
        { status: 400 }
      )
    }

    /* ---------- FETCH FIRESTORE ---------- */
    const docId = `${clientName}_${fromDate}`
    const snap = await adminDb
      .collection("final_reports")
      .doc(docId)
      .get()

    if (!snap.exists) {
      return NextResponse.json(
        { error: "Report not found" },
        { status: 404 }
      )
    }

    const report = snap.data()!

    /* =====================================================
       MEMBER + DEPOSIT + LOAN
    ===================================================== */

    const combinedRows = [
      ...(report.member || []),
      ...(report.deposit || []),
      ...(report.loan || []),
    ]

    for (let i = 0; i < combinedRows.length; i += BATCH_SIZE) {
      const batch = combinedRows.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (row: any) => {
          const payload = {
            sds_code: row.sds_code || "",
            date: row.date || "",
            schm_code: row.schm_code || "",
            branch_name: row.branch_name || "",
            modules: row.modules || "",
            scheme_description: row.scheme_description || "",
            upto_month_count: Number(row.upto_month_count || 0),
            upto_month_balance: Number(row.upto_month_balance || 0),
            receipt_count: Number(row.receipt_count || 0),
            receipt_amt: Number(row.receipt_amt || 0),
            payment_count: Number(row.payment_count || 0),
            payment_amt: Number(row.payment_amt || 0),
            close_count: Number(row.close_count || 0),
            close_amt: Number(row.close_amt || 0),
          }

          let responseData: any = { dryRun: true }
          let status: "SUCCESS" | "FAILED" | "DRY_RUN" = "DRY_RUN"

          if (!DRY_RUN) {
            const result = await safeFetch(DEPOSIT_LOAN_URL, payload)
            responseData = result.data
            status = responseData?.success ? "SUCCESS" : "FAILED"
          }

          /* ✅ store actual RCS response */
          depositLoanResponses.push(responseData)

          await logPushStatus({
            source: "FIREBASE",
            clientName,
            fromDate,
            module: "DEPOSIT/LOAN/MEMBER",
            response: responseData,
            status: DRY_RUN ? "DRY_RUN" : status,
          })
        })
      )
    }

    /* =====================================================
       JEWEL
    ===================================================== */

    const jewelRows = report.jewel || []

    for (let i = 0; i < jewelRows.length; i += BATCH_SIZE) {
      const batch = jewelRows.slice(i, i + BATCH_SIZE)

      await Promise.all(
        batch.map(async (row: any) => {
          const payload = {
            sds_code: row.sds_code || "",
            date: row.date || "",
            branch_name: row.branch_name || "",
            no_of_loans: Number(row.no_of_loans || 0),
            gross_weight_grams: Number(row.gross_weight_grams || 0),
            net_weight_grams: Number(row.net_weight_grams || 0),
            market_value_crores: Number(row.market_value_crores || 0),
            net_market_value_crores: Number(
              row.net_market_value_crores || 0
            ),
          }

          let responseData: any = { dryRun: true }
          let status: "SUCCESS" | "FAILED" | "DRY_RUN" = "DRY_RUN"

          if (!DRY_RUN) {
            const result = await safeFetch(JEWEL_URL, payload)
            responseData = result.data
            status = responseData?.success ? "SUCCESS" : "FAILED"
          }

          /* ✅ store actual RCS response */
          jewelResponses.push(responseData)

          await logPushStatus({
            source: "FIREBASE",
            clientName,
            fromDate,
            module: "JEWEL",
            response: responseData,
            status: DRY_RUN ? "DRY_RUN" : status,
          })
        })
      )
    }

    /* =====================================================
       FINAL RESPONSE (ACTUAL CLIENT RESPONSES)
    ===================================================== */
    return NextResponse.json({
      source: "RCS_DASHBOARD",
      mode: DRY_RUN ? "DRY_RUN" : "LIVE",
      clientName,
      fromDate,
      deposit_loan: depositLoanResponses,
      jewel: jewelResponses,
    })

  } catch (error) {
    console.error("Push Error:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}