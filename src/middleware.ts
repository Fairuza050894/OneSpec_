import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyInternalOriginOrToken } from '@/lib/serverSecurity';

export function middleware(request: NextRequest) {
  const method = request.method.toUpperCase();

  // Enforce origin and session verification on all mutating requests
  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
    const authCheck = verifyInternalOriginOrToken(request);
    if (!authCheck.authorized) {
      return NextResponse.json(
        {
          success: false,
          error: authCheck.reason || 'Forbidden: Unauthorized request origin or missing session token',
        },
        { status: 403 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/sdlc/:path*', '/api/discovery/:path*'],
};
