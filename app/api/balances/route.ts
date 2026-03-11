import { NextResponse } from "next/server"
import { query } from "@/lib/db-client"

export async function GET() {
  try {
    const balances = await query('SELECT * FROM balances ORDER BY updated_at DESC')
    return NextResponse.json({ balances })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
