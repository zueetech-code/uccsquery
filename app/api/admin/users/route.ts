import { NextRequest, NextResponse } from "next/server"
import { adminAuth, adminDb } from "@/lib/firebase-admin"

export async function POST(req: Request) {
  try {
    const { email, password, role } = await req.json()

    if (!email || !password || !role) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 })
    }

    // 1️⃣ Create Auth user
    const userRecord = await adminAuth.createUser({
      email,
      password,
    })

    const uid = userRecord.uid

    // 2️⃣ Set role claim
    await adminAuth.setCustomUserClaims(uid, { role })

    // 3️⃣ Save to Firestore
    await adminDb.collection("users").doc(uid).set({
      email,
      role,
      active: true,
      createdAt: new Date(),
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

