import { NextRequest, NextResponse } from "next/server"
import { insert, findAll, query } from "@/lib/db-client"
import { hashPassword } from "@/lib/auth"

export async function POST(req: Request) {
  try {
    const { email, password, role, fullName } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // Check if user already exists
    const existing = await query('SELECT id FROM users WHERE email = $1', [email])
    if (existing.length > 0) {
      return NextResponse.json({ error: "User already exists" }, { status: 400 })
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const uid = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const user = await insert('users', {
      uid,
      email,
      password_hash: passwordHash,
      full_name: fullName || '',
      role,
      is_admin: role === 'admin',
    })

    return NextResponse.json({ success: true, user })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const users = await findAll('users')
    return NextResponse.json({ users })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

