import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

const UpsertPayload = z.object({
    full_name: z.string().min(2),
    headline: z.string().optional(),
    bio: z.string().optional(),
    phone: z.string().optional(),
    website: z.string().url().optional(),
    booking_url: z.string().url().optional(),
    specialties: z.array(z.string()).optional(),
    modes: z.array(z.enum(['cabinet', 'domicile', 'visio'])).optional(),
    publish: z.boolean().optional(), // l'ergo peut demander la publication
})

export async function GET() {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const { data: me } = await supabase
        .from('therapists')
        .select(`
      id, slug, full_name, headline, bio, phone, website, booking_url,
      is_published, is_approved,
      therapist_locations(*),
      therapist_specialties(specialty_slug)
    `)
        .eq('profile_id', user.id)
        .maybeSingle()

    return NextResponse.json({ ok: true, me })
}

export async function PUT(req: Request) {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const parsed = UpsertPayload.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
    const p = parsed.data

    // Upsert fiche
    const { data: me } = await supabase
        .from('therapists')
        .upsert(
            { profile_id: user.id, full_name: p.full_name, headline: p.headline, bio: p.bio, phone: p.phone, website: p.website, booking_url: p.booking_url },
            { onConflict: 'profile_id' }
        )
        .select()
        .maybeSingle()

    if (!me) return NextResponse.json({ ok: false, error: 'Upsert failed' }, { status: 500 })

    // Spécialités (réécrire simple)
    if (p.specialties) {
        await supabase.from('therapist_specialties').delete().eq('therapist_id', me.id)
        if (p.specialties.length) {
            await supabase.from('therapist_specialties').insert(
                p.specialties.map((slug) => ({ therapist_id: me.id, specialty_slug: slug }))
            )
        }
    }

    // Modes : on met à jour toutes ses locations (ou tu peux gérer par location)
    if (p.modes) {
        await supabase.from('therapist_locations').update({ modes: p.modes }).eq('therapist_id', me.id)
    }

    // Demande de publication
    if (p.publish) {
        await supabase.from('therapists').update({ is_published: true }).eq('id', me.id)
    }

    return NextResponse.json({ ok: true })
}
