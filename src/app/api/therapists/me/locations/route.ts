import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

const LocationPayload = z.object({
    address: z.string().min(3),
    city: z.string().min(2),
    postal_code: z.string().min(2),
    country: z.string().default('BE'),
    modes: z.array(z.enum(['cabinet', 'domicile', 'visio'])).default(['cabinet']),
    lat: z.number().finite(),
    lng: z.number().finite(),
})

export async function POST(req: Request) {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const parsed = LocationPayload.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    // Récupéro ergo
    const { data: me } = await supabase.from('therapists').select('id').eq('profile_id', user.id).maybeSingle()
    if (!me) return NextResponse.json({ ok: false, error: 'Create therapist first' }, { status: 400 })

    // Insérer + coords -> geography
    const { error } = await supabase.rpc('upsert_location_with_point', {
        p_therapist_id: me.id,
        p_address: parsed.data.address,
        p_city: parsed.data.city,
        p_postal: parsed.data.postal_code,
        p_country: parsed.data.country,
        p_modes: parsed.data.modes,
        p_lat: parsed.data.lat,
        p_lng: parsed.data.lng,
    })

    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
}
