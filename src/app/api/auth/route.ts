import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email e senha obrigatórios' }, { status: 400 });
    }

    // Get client IP for rate limiting
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '0.0.0.0';

    const result = await authenticateUser(email, password, ip);
    
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: 401 });
    }

    // Set token in cookie + return in body
    const response = NextResponse.json({
      success: true,
      email: result.email,
      name: result.name,
      role: result.role,
      token: result.token,
    });

    // HttpOnly cookie for API protection
    response.cookies.set('bc_token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24h
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE() {
  // Logout — clear cookie
  const response = NextResponse.json({ success: true });
  response.cookies.delete('bc_token');
  return response;
}
