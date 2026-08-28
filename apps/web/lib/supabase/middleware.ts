import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
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


  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all routes inside /admin
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin-login') && !request.nextUrl.pathname.startsWith('/admin-signup')) {
    if (!user) {
      // User is not authenticated, redirect to admin login page
      const url = request.nextUrl.clone()
      url.pathname = '/admin-login'
      return NextResponse.redirect(url)
    }
    
    // Optional: Add role-based protection here if we use custom claims
    // e.g., if (user.app_metadata?.role !== 'admin') { return redirect('/unauthorized') }
  }

  // Prevent logged-in users from viewing the admin login page
  if ((request.nextUrl.pathname === '/admin-login' || request.nextUrl.pathname === '/admin-signup') && user) {
    const rawCookie = request.cookies.get('admin_last_tab')?.value
    let target = '/admin'
    if (rawCookie) {
      const decoded = decodeURIComponent(rawCookie)
      if (decoded.startsWith('/admin') && !decoded.startsWith('/admin-login') && !decoded.startsWith('/admin-signup')) {
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
