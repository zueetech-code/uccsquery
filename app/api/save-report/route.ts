import { NextResponse } from "next/server"
import { pool } from "@/lib/db"

function toInt(val: any) {
  if (val === "" || val === undefined || val === null) return null
  return parseInt(val, 10)
}

function toNum(val: any) {
  if (val === "" || val === undefined || val === null) return null
  return parseFloat(val)
}

function toBool(val: any) {
  if (val === "Yes") return true
  if (val === "No") return false
  return null
}
/* ================= POST HANDLER ================= */
export async function POST(req: Request) {
  const client = await pool.connect()

  try {
    const body = await req.json()

    const {
      branch,
      member,
      deposit,
      loan,
      jewel,
      emp,
      npa,
      profit,
      safety,
    } = body

    const sds = npa?.SDSCode
    const date = npa?.Date

    if (!sds || !date) {
      return NextResponse.json(
        { error: "Missing SDSCode or Date" },
        { status: 400 }
      )
    }
    const previous = await client.query(
  `
  SELECT COUNT(*)::int AS cnt
  FROM report_insert_log
  WHERE sds_code = $1
    AND report_date = $2
  `,
  [sds, date]
)

const submissionType =
  previous.rows[0].cnt === 0 ? "FIRST" : "RESUBMIT"



    await client.query("BEGIN")
    const logStatus = {
  branch: false,
  members: false,
  deposits: false,
  loans: false,
  jewel: false,
  employee: false,
  npa: false,
  profit: false,
  safety: false,
}

    /* =====================================================
        BRANCH DETAILS
    ===================================================== */
    if (branch?.length) {
        logStatus.branch = true
        }
    for (const r of branch || []) {
        await client.query(
            `
            INSERT INTO branch_details (
            sdscode,
            branchname,
            numberofbranch,
            district,
            state,
            regionname,
            circlename,
            block
            )
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
            ON CONFLICT (sdscode)
            DO UPDATE SET
            branchname     = EXCLUDED.branchname,
            numberofbranch = EXCLUDED.numberofbranch,
            district       = EXCLUDED.district,
            state          = EXCLUDED.state,
            regionname     = EXCLUDED.regionname,
            circlename     = EXCLUDED.circlename,
            block          = EXCLUDED.block,
            modified_at    = CURRENT_TIMESTAMP
            `,
            [
            r.sdscode || r.SDSCODE || r.sds_code,
            r.branchname,
            toInt(r.numberofbranch),
            r.district,
            r.state,
            r.regionname,
            r.circlename,
            r.block,
            ]
        )
        }

    /* =====================================================
       MEMBERS
    ===================================================== */
    if (member?.length) {
        logStatus.members = true
        }
    for (const r of member || []) {
      await client.query(
        `
        INSERT INTO members (
          sds_code,date,schm_code,branch_name,scheme_description,
          upto_month_count,upto_month_balance,
          receipt_count,receipt_amt,
          payment_count,payment_amt,
          close_count,close_amt
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (sds_code,date,schm_code)
        DO UPDATE SET
          branch_name = EXCLUDED.branch_name,
          scheme_description = EXCLUDED.scheme_description,
          upto_month_count = EXCLUDED.upto_month_count,
          upto_month_balance = EXCLUDED.upto_month_balance,
          receipt_count = EXCLUDED.receipt_count,
          receipt_amt = EXCLUDED.receipt_amt,
          payment_count = EXCLUDED.payment_count,
          payment_amt = EXCLUDED.payment_amt,
          close_count = EXCLUDED.close_count,
          close_amt = EXCLUDED.close_amt,
          modified_at = CURRENT_TIMESTAMP
        `,
        [
  sds,
  date,
  r.schm_code,
  r.branch_name,
  r.scheme_description,
  toInt(r.upto_month_count),
  toNum(r.upto_month_balance),
  toInt(r.receipt_count),
  toNum(r.receipt_amt),
  toInt(r.payment_count),
  toNum(r.payment_amt),
  toInt(r.close_count),
  toNum(r.close_amt),
]
      )
    }

    /* =====================================================
       DEPOSITS
    ===================================================== */
    if (deposit?.length) {
        logStatus.deposits = true
        }
    for (const r of deposit || []) {
      await client.query(
        `
        INSERT INTO deposits (
          sds_code,date,schm_code,branch_name,scheme_description,
          upto_month_count,upto_month_balance,
          receipt_count,receipt_amt,
          payment_count,payment_amt,
          close_count,close_amt
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (sds_code,date,schm_code)
        DO UPDATE SET
          branch_name = EXCLUDED.branch_name,
          scheme_description = EXCLUDED.scheme_description,
          upto_month_count = EXCLUDED.upto_month_count,
          upto_month_balance = EXCLUDED.upto_month_balance,
          receipt_count = EXCLUDED.receipt_count,
          receipt_amt = EXCLUDED.receipt_amt,
          payment_count = EXCLUDED.payment_count,
          payment_amt = EXCLUDED.payment_amt,
          close_count = EXCLUDED.close_count,
          close_amt = EXCLUDED.close_amt,
          modified_at = CURRENT_TIMESTAMP
        `,
        [
          sds,
          date,
          r.schm_code,
          r.branch_name,
          r.scheme_description,
          toInt(r.upto_month_count),
        toNum(r.upto_month_balance),
        toInt(r.receipt_count),
        toNum(r.receipt_amt),
        toInt(r.payment_count),
        toNum(r.payment_amt),
        toInt(r.close_count),
        toNum(r.close_amt),
        ]
      )
    }

    /* =====================================================
       LOANS
    ===================================================== */
    if (loan?.length) {
        logStatus.loans = true
        }
    for (const r of loan || []) {
      await client.query(
        `
        INSERT INTO loans (
          sds_code,date,schm_code,branch_name,scheme_description,
          upto_month_count,upto_month_balance,
          receipt_count,receipt_amt,
          payment_count,payment_amt,
          close_count,close_amt
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        ON CONFLICT (sds_code,date,schm_code)
        DO UPDATE SET
          branch_name = EXCLUDED.branch_name,
          scheme_description = EXCLUDED.scheme_description,
          upto_month_count = EXCLUDED.upto_month_count,
          upto_month_balance = EXCLUDED.upto_month_balance,
          receipt_count = EXCLUDED.receipt_count,
          receipt_amt = EXCLUDED.receipt_amt,
          payment_count = EXCLUDED.payment_count,
          payment_amt = EXCLUDED.payment_amt,
          close_count = EXCLUDED.close_count,
          close_amt = EXCLUDED.close_amt,
          modified_at = CURRENT_TIMESTAMP
        `,
        [
          sds,
          date,
          r.schm_code,
          r.branch_name,
          r.scheme_description,
          toInt(r.upto_month_count),
  toNum(r.upto_month_balance),
  toInt(r.receipt_count),
  toNum(r.receipt_amt),
  toInt(r.payment_count),
  toNum(r.payment_amt),
  toInt(r.close_count),
  toNum(r.close_amt),
        ]
      )
    }

    /* =====================================================
       JEWEL DETAILS
    ===================================================== */
    if (jewel?.length) {
  logStatus.jewel = true
}

    for (const r of jewel || []) {
      await client.query(
        `
        INSERT INTO jewel_details (
          sds_code,date,branch_name,no_of_loans,
          gross_weight_grams,net_weight_grams,
          market_value_crores,net_market_value_crores
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        ON CONFLICT (sds_code,date)
        DO UPDATE SET
          branch_name = EXCLUDED.branch_name,
          no_of_loans = EXCLUDED.no_of_loans,
          gross_weight_grams = EXCLUDED.gross_weight_grams,
          net_weight_grams = EXCLUDED.net_weight_grams,
          market_value_crores = EXCLUDED.market_value_crores,
          net_market_value_crores = EXCLUDED.net_market_value_crores,
          modified_at = CURRENT_TIMESTAMP
        `,
        [
  sds,
  date,
  r.branch_name,
  toInt(r.no_of_loans),
  toNum(r.gross_weight_grams),
  toNum(r.net_weight_grams),
  toNum(r.market_value_crores),
  toNum(r.net_market_value_crores),
]
      )
    }

    /* =====================================================
       EMPLOYEE DETAILS
    ===================================================== */
    if (emp && Object.values(emp).some(v => v !== "" && v !== null)) {
  logStatus.employee = true
}
    await client.query(
      `
      INSERT INTO employee_details
      (sds_code,date,approved_cadre_strength,filled,vacant)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (sds_code,date)
      DO UPDATE SET
        approved_cadre_strength = EXCLUDED.approved_cadre_strength,
        filled = EXCLUDED.filled,
        vacant = EXCLUDED.vacant,
        modified_at = CURRENT_TIMESTAMP
      `,
      [
        sds,
        date,
        toInt(emp?.ApprovedCadreStrength),
        toInt(emp?.Filled),
        toInt(emp?.Vacant),
      ]
    )

    /* =====================================================
       NPA DETAILS
    ===================================================== */
    if (npa && Object.values(npa).some(v => v !== "" && v !== null)) {
  logStatus.npa = true
}
   await client.query(
  `
  INSERT INTO npa_details (
    sds_code, date,

    gnpa_amount, gnpa_percent,
    nnpa_amount, nnpa_percent,
    provision_percent,

    total_overdue_count, total_overdue_amount,
    no_action_taken_count, no_action_taken_amount,
    registered_notices_count, registered_notices_amount,

    arc_count, arc_amount,
    decree_count, decree_amount,
    ep_count, ep_amount
  )
  VALUES (
    $1,$2,
    $3,$4,
    $5,$6,
    $7,
    $8,$9,
    $10,$11,
    $12,$13,
    $14,$15,
    $16,$17,
    $18,$19
  )
  ON CONFLICT (sds_code, date)
  DO UPDATE SET
    gnpa_amount = EXCLUDED.gnpa_amount,
    gnpa_percent = EXCLUDED.gnpa_percent,
    nnpa_amount = EXCLUDED.nnpa_amount,
    nnpa_percent = EXCLUDED.nnpa_percent,
    provision_percent = EXCLUDED.provision_percent,

    total_overdue_count = EXCLUDED.total_overdue_count,
    total_overdue_amount = EXCLUDED.total_overdue_amount,

    no_action_taken_count = EXCLUDED.no_action_taken_count,
    no_action_taken_amount = EXCLUDED.no_action_taken_amount,

    registered_notices_count = EXCLUDED.registered_notices_count,
    registered_notices_amount = EXCLUDED.registered_notices_amount,

    arc_count = EXCLUDED.arc_count,
    arc_amount = EXCLUDED.arc_amount,

    decree_count = EXCLUDED.decree_count,
    decree_amount = EXCLUDED.decree_amount,

    ep_count = EXCLUDED.ep_count,
    ep_amount = EXCLUDED.ep_amount,

    modified_at = CURRENT_TIMESTAMP
  `,
  [
    npa.SDSCode,
    npa.Date,

    toNum(npa.GNPA.amount),
    toNum(npa.GNPA.percent),

    toNum(npa.NNPA.amount),
    toNum(npa.NNPA.percent),

    toNum(npa.ProvisionPercent),

    toInt(npa.TotalOverdue.count),
    toNum(npa.TotalOverdue.amount),

    toInt(npa.NoActionTaken.count),
    toNum(npa.NoActionTaken.amount),

    toInt(npa.RegisteredNoticesSent.count),
    toNum(npa.RegisteredNoticesSent.amount),

    toInt(npa.ActionTaken.ARC.count),
    toNum(npa.ActionTaken.ARC.amount),

    toInt(npa.ActionTaken.DECREE.count),
    toNum(npa.ActionTaken.DECREE.amount),

    toInt(npa.ActionTaken.EP.count),
    toNum(npa.ActionTaken.EP.amount),
  ]
)

    /* =====================================================
       PROFIT DETAILS
    ===================================================== */
    if (profit && Object.values(profit).some(v => v !== "" && v !== null)) {
  logStatus.profit = true
}
    await client.query(
      `
      INSERT INTO profit_details (
        sds_code,date,cd_ratio,other_income,expenditure,
        audit_completed_year,net_profit,
        current_profit_with_cumulative_loss,
        current_loss_with_accumulated_loss
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (sds_code,date)
      DO UPDATE SET
        cd_ratio = EXCLUDED.cd_ratio,
        other_income = EXCLUDED.other_income,
        expenditure = EXCLUDED.expenditure,
        audit_completed_year = EXCLUDED.audit_completed_year,
        net_profit = EXCLUDED.net_profit,
        current_profit_with_cumulative_loss = EXCLUDED.current_profit_with_cumulative_loss,
        current_loss_with_accumulated_loss = EXCLUDED.current_loss_with_accumulated_loss,
        modified_at = CURRENT_TIMESTAMP
      `,
      [
  sds,
  date,
  toNum(profit?.CDRatio),
  toNum(profit?.OtherIncome),
  toNum(profit?.Expenditure),
  profit?.ProfitLoss?.AuditCompletedYear,
  toNum(profit?.ProfitLoss?.NetProfit),
  toNum(profit?.ProfitLoss?.CurrentProfitWithCumulativeLoss),
  toNum(profit?.ProfitLoss?.CurrentLossWithAccumulatedLoss),
]
    )

    /* =====================================================
       SAFETY DETAILS
    ===================================================== */
    if (safety && Object.values(safety).some(v => v !== "" && v !== null)) {
  logStatus.safety = true
}
    await client.query(
      `
      INSERT INTO safety_details (
        sds_code,date,
        safety_locker,defender_door,burglary_alarm,cctv,sms_alert
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7)
      ON CONFLICT (sds_code,date)
      DO UPDATE SET
        safety_locker = EXCLUDED.safety_locker,
        defender_door = EXCLUDED.defender_door,
        burglary_alarm = EXCLUDED.burglary_alarm,
        cctv = EXCLUDED.cctv,
        sms_alert = EXCLUDED.sms_alert,
        modified_at = CURRENT_TIMESTAMP
      `,
      [
  sds,
  date,
  toBool(safety?.SafetyLocker),
  toBool(safety?.DefenderDoor),
  toBool(safety?.BurglaryAlarm),
  toBool(safety?.CCTV),
  toBool(safety?.SMSAlert),
]
    )

    await client.query(
  `INSERT INTO report_insert_log (
  client_name,
  sds_code,
  report_date,
  branch_name,
  submission_type,

  branch_inserted,
  members_inserted,
  deposits_inserted,
  loans_inserted,
  jewel_inserted,
  employee_inserted,
  npa_inserted,
  profit_inserted,
  safety_inserted
)
VALUES (
  $1,$2,$3,$4,$5,
  $6,$7,$8,$9,$10,$11,$12,$13,$14
)
  `,
  [
    body.clientName,
    sds,
    date,
    branch?.[0]?.branchname || null,
    submissionType,

    logStatus.branch,
    logStatus.members,
    logStatus.deposits,
    logStatus.loans,
    logStatus.jewel,
    logStatus.employee,
    logStatus.npa,
    logStatus.profit,
    logStatus.safety
  ]
)

    await client.query("COMMIT")
    return NextResponse.json({ success: true })

  } catch (err) {
    await client.query("ROLLBACK")
    console.error("PostgreSQL error:", err)
    return NextResponse.json(
      { error: "Database error" },
      { status: 500 }
    )
  } finally {
    client.release()
  }
}