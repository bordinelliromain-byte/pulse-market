import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

const PROTECTED_ORGANISATEUR = [
  '/dashboard/organisateur',
  '/dashboard/candidatures',
  '/dashboard/attribution',
  '/dashboard/tresorerie',
  '/dashboard/creer-evenement',
]

const PROTECTED_PLACIER = ['/dashboard/placier']

const PUBLIC_ROUTES = ['/', '/auth', '/auth/mairie', '/devis', '/whatmarket', '/paiement-express', '/pro', '/commercial', '/mentions-legales', '/cgu', '/confidentialite', '/cgv']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) return NextResponse.next()

  const isPublic = PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + '/'))
  if (isPublic) return NextResponse.next()

  let res = NextResponse.next({ request: { headers: req.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value))
          res = NextResponse.next({ request: { headers: req.headers } })
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const isOrgRoute = PROTECTED_ORGANISATEUR.some(r => pathname.startsWith(r))
    return NextResponse.redirect(new URL(isOrgRoute ? '/auth/mairie' : '/auth', req.url))
  }

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', session.user.id).single()

  const role = profile?.role

  if (PROTECTED_ORGANISATEUR.some(r => pathname.startsWith(r)) && role !== 'organisateur') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  if (pathname === '/dashboard' && role === 'organisateur') {
    return NextResponse.redirect(new URL('/dashboard/organisateur', req.url))
  }

  if (PROTECTED_PLACIER.some(r => pathname.startsWith(r)) && role !== 'placier') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}