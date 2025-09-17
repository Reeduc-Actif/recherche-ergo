// src/app/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

    const res = NextResponse.json({ ok: true })

    const supabase = createServerClient(url, key, {
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
    })

    // on attend { event, session } depuis le client
    const payload = await req.json().catch(() => null) as { event?: string; session?: any } | null
    const event = payload?.event
    const session = payload?.session

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // écrit les cookies sb-* sur la réponse
        await supabase.auth.setSession(session)
    } else if (event === 'SIGNED_OUT') {
        await supabase.auth.signOut()
    }

    return res
}
