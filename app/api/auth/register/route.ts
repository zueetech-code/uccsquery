import { registerUser } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const { user, token } = await registerUser(email, password, fullName);

    // Create response with token in secure http-only cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        uid: user.uid,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        is_admin: user.is_admin,
      },
      token,
    });

    response.cookies.set('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error: any) {
    console.error('[v0] Register error:', error);
    return NextResponse.json(
      { error: error.message || 'Registration failed' },
      { status: 400 }
    );
  }
}
