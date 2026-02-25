import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Database connection

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM report_insert_log;
    `);
    //console.log("Last submitted data query result:", result.rows);

    if (!result.rows.length) {
      return NextResponse.json({ error: "No data found" }, { status: 404 });
    }

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching last submitted data:", error);
    return NextResponse.json({ error: "Failed to fetch last submitted data" }, { status: 500 });
  } finally {
    client.release();
  }
}