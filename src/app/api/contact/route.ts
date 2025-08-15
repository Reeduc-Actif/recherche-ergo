// src/app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'

export const dynamic = 'force-dynamic' // évite toute tentative de pré-rendu

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({} as any))
    const { to, from, subject, message } = body ?? {}

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        // Ne casse pas le build : renvoie une erreur explicite à l’exécution
        return NextResponse.json(
            { ok: false, error: 'RESEND_API_KEY is not configured on the server' },
            { status: 500 }
        )
    }

    // ✅ Instanciation au runtime (pas au top-level)
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
        from: from ?? 'no-reply@reeduc-actif.app',
        to,
        subject,
        text: message,
    })

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
}
