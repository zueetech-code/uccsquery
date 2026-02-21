import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

// DELETE User
export async function DELETE(req: NextRequest, context: { params: { uid: string } }) {
  const { uid } = await context.params

  if (!uid) {
    return NextResponse.json({ error: "User ID missing" }, { status: 400 })
  }

  try {
    await adminAuth.deleteUser(uid)
    await adminDb.collection("users").doc(uid).delete()
    return NextResponse.json({ message: "User deleted successfully" })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 })
  }
}

// POST User (optional, can also be separate)
export async function POST(req: NextRequest) {
  const { email, password, role } = await req.json()
  if (!email || !password || !role) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 })
  }
  try {
    const userRecord = await adminAuth.createUser({ email, password })
    const uid = userRecord.uid
    await adminAuth.setCustomUserClaims(uid, { role })
    await adminDb.collection("users").doc(uid).set({
      email,
      role,
      active: true,
      createdAt: new Date(),
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
