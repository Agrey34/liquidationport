import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const pathname = request.nextUrl.pathname
  const isAdminRoute =
    pathname.startsWith('/admin') &&
    !pathname.startsWith('/admin-login') &&
    !pathname.startsWith('/admin-signup')
  const isAuthRoute = pathname === '/admin-login' || pathname === '/admin-signup'

  // Check if any Supabase auth session cookies exist
  const allCookies = request.cookies.getAll()
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  // Fast-path: On public storefront routes without auth cookies, avoid external network calls to Supabase
  if (!isAdminRoute && !isAuthRoute && !hasAuthCookie) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Retrieve user with a safe 3-second timeout to prevent external Supabase latency from hanging page loads
  let user: any = null
  try {
    const userPromise = supabase.auth.getUser()
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 3000)
    )
    const { data } = await Promise.race([userPromise, timeoutPromise])
    user = data?.user ?? null
  } catch {
    user = null
  }

  // Protect all routes inside /admin
  if (isAdminRoute) {
    if (!user) {
      // User is not authenticated, redirect to admin login page
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }
  }

  // Prevent logged-in users from viewing the admin login page
  if (isAuthRoute && user) {
    const rawCookie = request.cookies.get('admin_last_tab')?.value
    let target = '/admin'
    if (rawCookie) {
      const decoded = decodeURIComponent(rawCookie)
      if (
        decoded.startsWith('/admin') &&
        !decoded.startsWith('/admin-login') &&
        !decoded.startsWith('/admin-signup')
      ) {
        target = decoded
      }
    }
    const url = request.nextUrl.clone()
    url.pathname = target.split('?')[0]
    const search = target.split('?')[1]
    url.search = search ? `?${search}` : ''
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}
