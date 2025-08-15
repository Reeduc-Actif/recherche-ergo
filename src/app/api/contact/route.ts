import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY!)

export async function POST(req: Request) {
    const { to, from, subject, message } = await req.json()
    const { error } = await resend.emails.send({
        from: from ?? 'no-reply@reeduc-actif.app',
        to, subject, text: message
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
}
