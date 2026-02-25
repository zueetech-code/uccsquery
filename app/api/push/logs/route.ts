import { NextResponse } from "next/server";
import { pool } from "@/lib/db"; // Database connection

export async function GET() {
  const client = await pool.connect();
  try {
    const result = await client.query(`
      SELECT * FROM push_logs ORDER BY created_at DESC LIMIT 10;
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching push logs:", error);
    return NextResponse.json({ error: "Failed to fetch push logs" }, { status: 500 });
  } finally {
    client.release();
  }
}