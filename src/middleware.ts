import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware de segurança — protege todas as rotas /api/* exceto /api/auth
 * Verifica se o cookie bc_token está presente (a validação real é feita nos endpoints)
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — allow without auth
  if (
    pathname === '/api/auth' ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico' ||
    pathname === '/sw.js'
  ) {
    return NextResponse.next();
  }

  // API routes — require auth cookie
  if (pathname.startsWith('/api/')) {
    const token = request.cookies.get('bc_token')?.value;
    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado — faça login' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};
