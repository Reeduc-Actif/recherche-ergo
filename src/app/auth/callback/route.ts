import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

// --- GET: utilisé par les liens magiques / reset password
export async function GET(req: Request) {
    const requestUrl = new URL(req.url)
    const next = requestUrl.searchParams.get('next') || '/pro/mon-profil'
    const code = requestUrl.searchParams.get('code')

    const res = NextResponse.redirect(new URL(next, requestUrl.origin))

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const cookie = req.headers.get('cookie') ?? ''
                    const m = cookie.match(new RegExp(`${name}=([^;]+)`))
                    return m?.[1]
                },
                set(name: string, value: string, options: CookieOptions) {
                    res.cookies.set(name, value, options)
                },
                remove(name: string, options: CookieOptions) {
                    res.cookies.set(name, '', { ...options, maxAge: 0 })
                },
            },
        },
    )

    // Si un "code" est présent, on l’échange contre une session et on pose les cookies
    if (code) {
        await supabase.auth.exchangeCodeForSession(code)
    }
    // Exige un code pour éviter les redirections silencieuses
    if (!code) {
        return NextResponse.redirect(new URL('/pro/connexion?error=missing_code', requestUrl.origin))
    }
    await supabase.auth.exchangeCodeForSession(code)

    return res
}

// --- POST: utilisé après login par mot de passe pour synchroniser la session côté serveur
type CallbackEvent = 'SIGNED_IN' | 'TOKEN_REFRESHED' | 'SIGNED_OUT'
type SessionTokens = { access_token?: string; refresh_token?: string }
type CallbackBody = { event?: CallbackEvent; session?: SessionTokens | null }

export async function POST(req: Request) {
    const res = NextResponse.json({ ok: true })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    const cookie = req.headers.get('cookie') ?? ''
                    const m = cookie.match(new RegExp(`${name}=([^;]+)`))
                    return m?.[1]
                },
                set(name: string, value: string, options: CookieOptions) {
                    res.cookies.set(name, value, options)
                },
                remove(name: string, options: CookieOptions) {
                    res.cookies.set(name, '', { ...options, maxAge: 0 })
                },
            },
        },
    )

    const payload = (await req.json().catch(() => null)) as CallbackBody | null
    const event = payload?.event

    if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')
        && payload?.session?.access_token && payload.session.refresh_token) {
        await supabase.auth.setSession({
            access_token: payload.session.access_token,
            refresh_token: payload.session.refresh_token,
        })
    } else if (event === 'SIGNED_OUT') {
        await supabase.auth.signOut()
    }

    return res
}
