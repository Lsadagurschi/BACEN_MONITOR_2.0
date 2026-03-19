import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Auth temporariamente desabilitado — acesso direto ao dashboard
export async function middleware(request: NextRequest) {
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
