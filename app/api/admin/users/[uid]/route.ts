import { NextRequest, NextResponse } from "next/server"
import { deleteRecord, findByColumn, update, query } from "@/lib/db-client"
import { hashPassword } from "@/lib/auth"

// DELETE User
export async function DELETE(req: NextRequest, context: { params: { uid: string } }) {
  const { uid } = await context.params

  if (!uid) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 })
  }

  try {
    // Find user by uid and delete
    const user = await findByColumn('users', 'uid', uid)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    
    await deleteRecord('users', user.id)
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 })
  }
}

// PUT User - Update user role/details
export async function PUT(req: NextRequest, context: { params: { uid: string } }) {
  const { uid } = await context.params
  
  if (!uid) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 })
  }

  try {
    const body = await req.json()
    const { email, role, fullName } = body

    const user = await findByColumn('users', 'uid', uid)
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    const updateData: Record<string, any> = {}
    if (email) updateData.email = email
    if (role) updateData.role = role
    if (fullName) updateData.full_name = fullName

    const updated = await update('users', user.id, updateData)
    return NextResponse.json({ success: true, user: updated })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
