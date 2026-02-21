import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

export async function POST(req: Request) {
  const client = await pool.connect()

  try {
    const body = await req.json()
    const { clientName, fromDate } = body

    if (!clientName || !fromDate) {
      return NextResponse.json(
        { error: "Missing clientName or fromDate" },
        { status: 400 }
      )
    }

    /* =====================================================
       STEP 1: Get SDS Code From Log
    ===================================================== */
    const logRes = await client.query(
      `
      SELECT sds_code
      FROM report_insert_log
      WHERE client_name = $1
        AND report_date = $2
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [clientName, fromDate]
    )

    if (logRes.rowCount === 0) {
      return NextResponse.json(
        { error: "No report found" },
        { status: 404 }
      )
    }

    const sds = logRes.rows[0].sds_code
    const date = fromDate

    /* =====================================================
       FETCH ALL TABLES
    ===================================================== */

    const [
      branchRes,
      memberRes,
      depositRes,
      loanRes,
      jewelRes,
      empRes,
      npaRes,
      profitRes,
      safetyRes
    ] = await Promise.all([

      client.query(
        `SELECT * FROM branch_details WHERE sdscode = $1`,
        [sds]
      ),

      client.query(
        `SELECT * FROM members WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM deposits WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM loans WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM jewel_details WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM employee_details WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM npa_details WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM profit_details WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      ),

      client.query(
        `SELECT * FROM safety_details WHERE sds_code = $1 AND date = $2`,
        [sds, date]
      )
    ])

    /* =====================================================
       FORMAT RESPONSE
    ===================================================== */

    return NextResponse.json({
      branch: branchRes.rows,
      member: memberRes.rows,
      deposit: depositRes.rows,
      loan: loanRes.rows,
      jewel: jewelRes.rows,
      emp: empRes.rows[0] || null,
      npa: npaRes.rows[0] || null,
      profit: profitRes.rows[0] || null,
      safety: safetyRes.rows[0] || null,
      fromDate: date,
      sdsCode: sds
    })

  } catch (err) {
    console.error("GET REPORT ERROR:", err)
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}