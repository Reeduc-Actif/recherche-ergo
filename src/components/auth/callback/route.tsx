// src/app/auth/callback/route.ts
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
    const supabase = createRouteHandlerClient({ cookies })
    const { event, session } = await req.json()

    // Quand on se connecte ou qu’on rafraîchit le token → écrire les cookies SSR
    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        // @ts-ignore - setSession est dispo sur le client helpers
        await supabase.auth.setSession(session)
    }
    if (event === 'SIGNED_OUT') {
        await supabase.auth.signOut()
    }
    return NextResponse.json({ ok: true })
}
