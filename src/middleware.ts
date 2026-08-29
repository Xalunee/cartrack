import NextAuth from 'next-auth'
import { authConfig } from '@shared/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/register')
  const isProtected =
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/mileage') ||
    pathname.startsWith('/service') ||
    pathname.startsWith('/events') ||
    pathname.startsWith('/fines') ||
    pathname.startsWith('/help') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/settings') ||
    pathname.startsWith('/onboarding')

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
