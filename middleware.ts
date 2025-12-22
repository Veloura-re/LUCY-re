import { type NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        response.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // 1. Refresh session
    const { data: { user } } = await supabase.auth.getUser()

    // 2. Define protected paths
    const url = request.nextUrl.clone()
    const path = url.pathname

    const isAuthPage = path === '/login' || path === '/register'
    const isAdminPage = path.startsWith('/admin')
    const isDashboardPage = path.startsWith('/dashboard')

    // 3. Handle Unauthenticated Users
    if (!user) {
        if (isAdminPage || isDashboardPage) {
            url.pathname = '/login'
            return NextResponse.redirect(url)
        }
        return response
    }

    // 4. Handle Authenticated Users
    const metadataRole = user.user_metadata?.role

    if (metadataRole) {
        if (isAuthPage) {
            const dest = metadataRole === 'SUPERADMIN' ? '/admin/dashboard' : '/dashboard'
            url.pathname = dest
            return NextResponse.redirect(url)
        }

        if (isAdminPage && metadataRole !== 'SUPERADMIN') {
            url.pathname = '/dashboard'
            return NextResponse.redirect(url)
        }
    } else if (isAuthPage) {
        url.pathname = '/dashboard'
        return NextResponse.redirect(url)
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - api (API routes - generally we want these protected by code, but middleware can run too)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
}
