import { NextResponse } from "next/server"
import { insert, query } from "@/lib/db-client"

export async function POST(req: Request) {
  try {
    const { client_id, client_name, district, status, email } = await req.json()

    if (!client_id || !client_name) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if client already exists
    const existing = await query('SELECT id FROM clients WHERE client_id = $1', [client_id])
    if (existing.length > 0) {
      return NextResponse.json({ error: "Client already exists" }, { status: 400 })
    }

    const client = await insert('clients', {
      client_id,
      client_name,
      district: district || null,
      status: status || 'active',
      email: email || null,
      online_status: 'offline',
    })

    return NextResponse.json({ success: true, client })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
