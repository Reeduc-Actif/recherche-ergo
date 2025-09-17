// src/app/api/pro/onboard/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

// IMPORTANT : build node
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Payload = z.object({
    full_name: z.string().trim().min(2),
    headline: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    booking_url: z.string().url().optional(),

    languages: z.array(z.enum(['fr', 'nl', 'de', 'en'])).nonempty(),
    specialties: z.array(z.string().min(1)).nonempty(),
    modes: z.array(z.enum(['cabinet', 'domicile', 'visio'])).optional().default([]),

    address: z.string().trim().min(2),
    postal_code: z.string().trim().min(2),
    city: z.string().trim().min(2),
    country: z.string().trim().default('BE'),

    price_min: z.coerce.number().int().min(1).max(1000).optional(),
    price_max: z.coerce.number().int().min(1).max(1000).optional(),
    price_unit: z.enum(['hour', 'session']).optional(),
})

type Geo = { lon: number | null; lat: number | null }

async function geocode(addr: { address: string; postal_code: string; city: string; country: string }): Promise<Geo> {
    const token = process.env.MAPBOX_TOKEN_SERVER || process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) return { lon: null, lat: null }
    const q = encodeURIComponent(`${addr.address}, ${addr.postal_code} ${addr.city}, ${addr.country}`)
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1&country=be`
    try {
        const res = await fetch(url, { cache: 'no-store' })
        if (!res.ok) return { lon: null, lat: null }
        const json = await res.json()
        const feat = json?.features?.[0]
        if (feat?.center?.length === 2) {
            const [lon, lat] = feat.center
            return { lon: Number(lon), lat: Number(lat) }
        }
        return { lon: null, lat: null }
    } catch {
        return { lon: null, lat: null }
    }
}

export async function POST(req: Request) {
    const supabase = await supabaseServer()
    const { data: auth } = await supabase.auth.getUser()
    const user = auth?.user
    if (!user) {
        return NextResponse.json({ ok: false, error: 'Unauthenticated' }, { status: 401 })
    }

    // parse + validations métier
    let input: z.infer<typeof Payload>
    try {
        input = Payload.parse(await req.json())
    } catch (e) {
        return NextResponse.json({ ok: false, error: 'Données invalides', details: e }, { status: 400 })
    }
    if (input.price_min && input.price_max && input.price_min > input.price_max) {
        return NextResponse.json({ ok: false, error: 'price_min > price_max' }, { status: 400 })
    }

    // géocodage
    const { lon, lat } = await geocode({
        address: input.address,
        postal_code: input.postal_code,
        city: input.city,
        country: input.country,
    })

    // slug unique
    const base = input.full_name
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
    let slug = base || `ergo-${user.id.slice(0, 8)}`
    for (let i = 0; i < 5; i++) {
        const { data: exists } = await supabase.from('therapists').select('id').eq('slug', slug).maybeSingle()
        if (!exists) break
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
    }

    // transaction manuelle (simple séquencement)
    try {
        // 1) therapists
        const { data: th, error: e1 } = await supabase
            .from('therapists')
            .insert({
                slug,
                profile_id: user.id,                               // <— FK vers profiles.id (garanti par trigger handle_new_user)
                full_name: input.full_name,
                headline: input.headline ?? null,
                email: user.email,
                phone: input.phone ?? null,
                website: null,
                booking_url: input.booking_url ?? null,
                price_hint: null,
                price_min: input.price_min ?? null,
                price_max: input.price_max ?? null,
                price_unit: input.price_unit ?? null,
                is_published: true,
                is_approved: true,
            })
            .select('id')
            .single()
        if (e1) throw e1
        const therapist_id = th!.id as string

        // 2) langues
        if (input.languages?.length) {
            const rows = input.languages.map(code => ({ therapist_id, language_code: code }))
            const { error: e2 } = await supabase.from('therapist_languages').insert(rows)
            if (e2) throw e2
        }

        // 3) spécialités
        if (input.specialties?.length) {
            const rows = input.specialties.map(slug => ({ therapist_id, specialty_slug: slug }))
            const { error: e3 } = await supabase.from('therapist_specialties').insert(rows)
            if (e3) throw e3
        }

        // 4) localisation
        // NOTE: si column coords est de type geography, PostgREST accepte du WKT "SRID=4326;POINT(lon lat)"
        const coordsWkt = lon != null && lat != null ? `SRID=4326;POINT(${lon} ${lat})` : null
        const { error: e4 } = await supabase.from('therapist_locations').insert({
            therapist_id,
            address: input.address,
            city: input.city,
            postal_code: input.postal_code,
            country: input.country,
            modes: input.modes ?? [],
            coords: coordsWkt,
        })
        if (e4) throw e4

        return NextResponse.json({ ok: true, therapist_id, slug })
    } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Erreur'
        // aide au debug côté client
        return NextResponse.json({ ok: false, error: msg }, { status: 400 })
    }
}
