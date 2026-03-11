import { NextResponse } from "next/server"
import { findByColumn, update } from "@/lib/db-client"

export async function POST(req: Request) {
  try {
    const { uid, role } = await req.json()

    if (!uid || !role) {
      return NextResponse.json({ error: "Missing uid or role" }, { status: 400 })
    }

    // Find user by uid
    const user = await findByColumn('users', 'uid', uid)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Update user role
    await update('users', user.id, {
      role,
      is_admin: role === 'admin',
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Set role error:", error)
    return NextResponse.json({ error: error.message || "Failed" }, { status: 500 })
  }
}
