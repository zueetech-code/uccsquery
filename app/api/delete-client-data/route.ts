import { NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { adminDb } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  const { clientName, date } = await req.json();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 🧨 1. DELETE FROM push_logs (PostgreSQL)
    await client.query(
      `
      DELETE FROM push_logs
      WHERE client_name = $1
      AND from_date::date = $2
      `,
      [clientName, date]
    );

    await client.query("COMMIT");

    // 🔥 2. DELETE FROM Firebase (final_reports)
    const snapshot = await adminDb
      .collection("final_reports")
      .where("clientName", "==", clientName)
      .where("fromDate", "==", date)
      .get();

    const batch = adminDb.batch();

    snapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    await batch.commit();

    return NextResponse.json({ success: true });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Delete error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  } finally {
    client.release();
  }
}
