// src/app/api/contact/route.ts
import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

// Schemas sans API dépréciée
const Payload = z.object({
    to: z.email(),
    from: z.email().optional(),
    subject: z.string().min(1),
    message: z.string().min(1),
})

export async function POST(req: Request) {
    let input: z.infer<typeof Payload>
    try {
        const json = await req.json()
        input = Payload.parse(json)
    } catch {
        return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        return NextResponse.json(
            { ok: false, error: 'RESEND_API_KEY is not configured' },
            { status: 500 },
        )
    }

    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
        from: input.from ?? 'no-reply@reeduc-actif.app',
        to: input.to,
        subject: input.subject,
        text: input.message,
    })

    if (error) {
        return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }
    return NextResponse.json({ ok: true })
}
