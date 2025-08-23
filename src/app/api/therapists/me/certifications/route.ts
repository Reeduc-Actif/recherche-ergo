import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

const CertPayload = z.object({
    title: z.string().min(3),
    issuer: z.string().optional(),
    issue_date: z.string().date().optional(), // ou .regex(/^\d{4}-\d{2}-\d{2}$/)
    file_path: z.string().min(3),  // chemin dans le bucket
})

export async function POST(req: Request) {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const parsed = CertPayload.safeParse(body)
    if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })

    const { data: me } = await supabase.from('therapists').select('id').eq('profile_id', user.id).maybeSingle()
    if (!me) return NextResponse.json({ ok: false, error: 'Create therapist first' }, { status: 400 })

    const { error } = await supabase.from('therapist_certifications').insert({
        therapist_id: me.id,
        title: parsed.data.title,
        issuer: parsed.data.issuer,
        issue_date: parsed.data.issue_date ? new Date(parsed.data.issue_date) : null,
        file_url: parsed.data.file_path,
    })
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })

    return NextResponse.json({ ok: true })
}
