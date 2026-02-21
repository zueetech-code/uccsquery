import { NextResponse } from "next/server"
import { pool } from "@/lib/db"
import https from "https"

/* ================= CONFIG ================= */

const DRY_RUN = process.env.RCS_DRY_RUN === "true"

const DEPOSIT_LOAN_URL =
  "https://dashboard.kooturavu.tn.gov.in/v1/api/uccs/deposit_loan/upsert"

const JEWEL_URL =
  "https://dashboard.kooturavu.tn.gov.in/v1/api/uccs/jwel/upsert"

const BATCH_SIZE = 10
const REQUEST_TIMEOUT = 15000

const MODULE_DL = "DEPOSIT/LOAN/MEMBER"
const MODULE_JEWEL = "JEWEL"

/* ================= KEEP ALIVE ================= */

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

    return { ok: res.ok, data }
  } catch (err: any) {
    return { ok: false, data: { error: err.message } }
  } finally {
    clearTimeout(timeout)
  }
}

/* ================= CHECK MODULE PUSH ================= */

async function isModuleAlreadyPushed(
  client: any,
  clientName: string,
  date: string,
  module: string
) {
  const res = await client.query(
    `
    SELECT 1
    FROM push_logs
    WHERE source = 'POSTGRES'
      AND client_name = $1
      AND from_date = $2
      AND module = $3
      AND status = 'SUCCESS'
    LIMIT 1
    `,
    [clientName, date, module]
  )
  return res.rowCount > 0
}

/* ================= API ================= */

export async function POST(req: Request) {
  const apiKey = req.headers.get("x-api-key")
  if (apiKey !== process.env.PUSH_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { clientName } = await req.json()
  if (!clientName) {
    return NextResponse.json({ error: "clientName required" }, { status: 400 })
  }

  const client = await pool.connect()

  try {
    /* =====================================================
       STEP 1: LAST SUBMISSION DATE
    ===================================================== */
    const last = await client.query(
      `
      SELECT sds_code, report_date
      FROM report_insert_log
      WHERE client_name = $1
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [clientName]
    )

    if (!last.rowCount) {
      return NextResponse.json(
        { error: "No submission found for client" },
        { status: 404 }
      )
    }

    const { sds_code: sds, report_date: date } = last.rows[0]

    /* =====================================================
       STEP 2: FETCH DATA
    ===================================================== */
    const [members, deposits, loans, jewels] = await Promise.all([
      client.query(`SELECT * FROM members WHERE sds_code=$1 AND date=$2`, [sds, date]),
      client.query(`SELECT * FROM deposits WHERE sds_code=$1 AND date=$2`, [sds, date]),
      client.query(`SELECT * FROM loans WHERE sds_code=$1 AND date=$2`, [sds, date]),
      client.query(`SELECT * FROM jewel_details WHERE sds_code=$1 AND date=$2`, [sds, date]),
    ])

    const depositLoanResponses: any[] = []
    const jewelResponses: any[] = []

    /* =====================================================
       STEP 3: DEPOSIT / LOAN / MEMBER
    ===================================================== */
    if (await isModuleAlreadyPushed(client, clientName, date, MODULE_DL)) {
      return NextResponse.json({
        alreadyPushed: true,
        module: MODULE_DL,
        clientName,
        pushedDate: date,
        message: "Deposit / Loan / Member already pushed for this date",
      })
    }

    const combined = [
      ...members.rows.map(r => ({ ...r, modules: "Members" })),
      ...deposits.rows.map(r => ({ ...r, modules: "Deposits" })),
      ...loans.rows.map(r => ({ ...r, modules: "Loans" })),
    ]

    for (let i = 0; i < combined.length; i += BATCH_SIZE) {
      const batch = combined.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async r => {
        const payload = {
          sds_code: r.sds_code,
          date: r.date,
          schm_code: r.schm_code,
          branch_name: r.branch_name,
          modules: r.modules,
          scheme_description: r.scheme_description,
          upto_month_count: Number(r.upto_month_count || 0),
          upto_month_balance: Number(r.upto_month_balance || 0),
          receipt_count: Number(r.receipt_count || 0),
          receipt_amt: Number(r.receipt_amt || 0),
          payment_count: Number(r.payment_count || 0),
          payment_amt: Number(r.payment_amt || 0),
          close_count: Number(r.close_count || 0),
          close_amt: Number(r.close_amt || 0),
        }

        const res = DRY_RUN
          ? { ok: true, data: { dryRun: true } }
          : await safeFetch(DEPOSIT_LOAN_URL, payload)

        depositLoanResponses.push(res.data)
      }))
    }

    await client.query(
      `
      INSERT INTO push_logs
      (source, client_name, from_date, module, status, response)
      VALUES ('POSTGRES',$1,$2,$3,$4,$5)
      `,
      [clientName, date, MODULE_DL, DRY_RUN ? "DRY_RUN" : "SUCCESS", JSON.stringify(depositLoanResponses),]
    )

    /* =====================================================
       STEP 4: JEWEL
    ===================================================== */
    if (await isModuleAlreadyPushed(client, clientName, date, MODULE_JEWEL)) {
      return NextResponse.json({
        alreadyPushed: true,
        module: MODULE_JEWEL,
        clientName,
        pushedDate: date,
        message: "Jewel already pushed for this date",
      })
    }

    for (let i = 0; i < jewels.rows.length; i += BATCH_SIZE) {
      const batch = jewels.rows.slice(i, i + BATCH_SIZE)

      await Promise.all(batch.map(async r => {
        const payload = {
          sds_code: r.sds_code,
          date: r.date,
          branch_name: r.branch_name,
          no_of_loans: Number(r.no_of_loans || 0),
          gross_weight_grams: Number(r.gross_weight_grams || 0),
          net_weight_grams: Number(r.net_weight_grams || 0),
          market_value_crores: Number(r.market_value_crores || 0),
          net_market_value_crores: Number(r.net_market_value_crores || 0),
        }

        const res = DRY_RUN
          ? { ok: true, data: { dryRun: true } }
          : await safeFetch(JEWEL_URL, payload)

        jewelResponses.push(res.data)
      }))
    }

    await client.query(
      `
      INSERT INTO push_logs
      (source, client_name, from_date, module, status, response)
      VALUES ('POSTGRES',$1,$2,$3,$4,$5)
      `,
      [clientName, date, MODULE_JEWEL, DRY_RUN ? "DRY_RUN" : "SUCCESS", JSON.stringify(jewelResponses),]
    )

    /* =====================================================
       FINAL RESPONSE
    ===================================================== */
    return NextResponse.json({
      source: "RCS_DASHBOARD",
      mode: DRY_RUN ? "DRY_RUN" : "LIVE",
      clientName,
      pushedDate: date,
      deposit_loan: depositLoanResponses,
      jewel: jewelResponses,
    })

  } catch (err) {
    console.error("Local Push Error:", err)
    return NextResponse.json({ error: "Push failed" }, { status: 500 })
  } finally {
    client.release()
  }
}