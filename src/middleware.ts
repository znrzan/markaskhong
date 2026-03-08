import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
    // Check if user is accessing dashboard
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const authCookie = request.cookies.get('auth_token')

        // If no auth token, redirect to login
        if (!authCookie || authCookie.value !== 'authenticated') {
            const loginUrl = new URL('/login', request.url)
            loginUrl.searchParams.set('from', request.nextUrl.pathname)
            return NextResponse.redirect(loginUrl)
        }
    }

    return NextResponse.next()
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: '/dashboard/:path*',
}
