// src/app/api/pro/onboard/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const Payload = z.object({
    full_name: z.string().min(1),
    headline: z.string().optional(),
    phone: z.string().optional(),
    booking_url: z.string().url().optional(),
    languages: z.array(z.enum(['fr', 'nl', 'de', 'en'])).nonempty(),
    specialties: z.array(z.string()).nonempty(),
    address: z.string().optional().default('Cabinet principal'),
    city: z.string().min(1),
    postal_code: z.string().min(1),
    country: z.string().min(2).default('BE'),
    modes: z.array(z.enum(['cabinet', 'domicile', 'visio'])).optional().default([]),

    price_min: z.number().int().min(0).optional(),
    price_max: z.number().int().min(0).optional(),
    price_unit: z.enum(['seance', 'heure']).optional(), // 'séance' / 'heure'
})

type MapboxFeature = { center?: [number, number] }
type MapboxGeocodeResponse = { features?: MapboxFeature[] }

async function geocode(q: string): Promise<{ lon: number; lat: number }> {
    if (!MAPBOX_TOKEN) throw new Error('MAPBOX_TOKEN manquant')
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`)
    url.searchParams.set('access_token', MAPBOX_TOKEN)
    url.searchParams.set('limit', '1')
    url.searchParams.set('language', 'fr')
    url.searchParams.set('country', 'be')

    const r = await fetch(url.toString(), { cache: 'no-store' })
    if (!r.ok) throw new Error('Erreur géocodage')
    const j: MapboxGeocodeResponse = await r.json()
    const feat = j.features?.[0]
    if (!feat?.center || feat.center.length < 2) throw new Error('Adresse introuvable')
    const [lon, lat] = feat.center
    return { lon, lat }
}

function mkPriceHint(min?: number, max?: number, unit?: 'seance' | 'heure'): string | null {
    if (!min && !max) return null
    const core = min && max ? `${min}–${max} €` : `${min ?? max} €`
    const u = unit === 'heure' ? '/h' : '/séance'
    return `${core} ${u}`
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}))
    const parsed = Payload.safeParse(body)
    if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }
    const input = parsed.data

    const sb = await supabaseServer()

    // 0) Auth obligatoire
    const { data: userData, error: userErr } = await sb.auth.getUser()
    if (userErr || !userData?.user) {
        return NextResponse.json({ ok: false, error: 'Non authentifié' }, { status: 401 })
    }
    const user = userData.user

    // 1) Upsert profil (corrige ton FK)
    //    Si la ligne n’existe pas dans public.profiles, on la crée.
    await sb.from('profiles').upsert(
        {
            id: user.id,
            email: user.email ?? null,
            full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
            phone: (user.user_metadata?.phone as string | undefined) ?? null,
        },
        { onConflict: 'id' },
    )

    // 2) Slug unique
    const base = input.full_name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    let slug = base || `ergo-${user.id.slice(0, 6)}`
    for (let i = 0; i < 4; i++) {
        const { data } = await sb.from('therapists').select('id').eq('slug', slug).maybeSingle()
        if (!data) break
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
    }

    // 3) Géocodage (ville + CP + pays)
    const q = [input.postal_code, input.city, input.country].filter(Boolean).join(' ')
    const { lon, lat } = await geocode(q)

    // 4) Insert therapist
    const price_hint = mkPriceHint(input.price_min, input.price_max, input.price_unit)
    const { data: th, error: e1 } = await sb
        .from('therapists')
        .insert({
            slug,
            profile_id: user.id, // <- FK vers profiles.id (corrigé car on a upsert le profil)
            full_name: input.full_name,
            headline: input.headline || null,
            bio: null,
            email: user.email ?? null,
            phone: input.phone || null,
            website: null,
            booking_url: input.booking_url || null,
            price_hint: price_hint,
            is_published: true,
            is_approved: true,
        })
        .select('id')
        .single()

    if (e1) {
        return NextResponse.json({ ok: false, error: e1.message }, { status: 400 })
    }
    const therapist_id = th!.id as string

    // 5) langues
    if (input.languages?.length) {
        const rows = input.languages.map((code) => ({ therapist_id, language_code: code }))
        const { error } = await sb.from('therapist_languages').insert(rows)
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    // 6) spécialités
    if (input.specialties?.length) {
        const rows = input.specialties.map((slug) => ({ therapist_id, specialty_slug: slug }))
        const { error } = await sb.from('therapist_specialties').insert(rows)
        if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 })
    }

    // 7) localisation : on insère la géométrie via WKT SRID=4326;POINT(lon lat)
    const { error: e4 } = await sb.from('therapist_locations').insert({
        therapist_id,
        address: input.address || 'Cabinet principal',
        city: input.city,
        postal_code: input.postal_code,
        country: input.country,
        modes: input.modes ?? [],
        coords: `SRID=4326;POINT(${lon} ${lat})`,
    })
    if (e4) return NextResponse.json({ ok: false, error: e4.message }, { status: 400 })

    return NextResponse.json({ ok: true, therapist_id })
}
