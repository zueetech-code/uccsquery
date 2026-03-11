import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { jwtDecode } from "jwt-decode"

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("token")?.value

    if (!token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const decoded: any = jwtDecode(token)

    return NextResponse.json({
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: decoded.role,
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }
}
