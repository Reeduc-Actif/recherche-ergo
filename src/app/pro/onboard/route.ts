import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerClient, type CookieOptions } from '@supabase/ssr'

// Sécurise avec un token Mapbox côté serveur (ne PAS utiliser la clé publique)
// Vercel/Env: MAPBOX_TOKEN=pk.XXXXXXXX
const MAPBOX_TOKEN = process.env.MAPBOX_TOKEN

export const dynamic = 'force-dynamic'

const Payload = z.object({
    full_name: z.string().min(2),
    headline: z.string().optional(),
    phone: z.string().optional(),
    booking_url: z.string().url().optional().or(z.literal('')),
    languages: z.array(z.enum(['fr', 'nl', 'de', 'en'])).nonempty(),
    specialties: z.array(z.string()).nonempty(),
    modes: z.array(z.enum(['cabinet', 'domicile', 'visio'])).optional().default([]),

    address: z.string().optional().default('Cabinet principal'),
    city: z.string().min(1),
    postal_code: z.string().min(2),
    country: z.string().min(2).default('BE'),

    price_min: z.number().int().nonnegative().optional(),
    price_max: z.number().int().nonnegative().optional(),
    price_unit: z.enum(['hour', 'session']).optional(),
})

type SupaCookies = {
    get: (name: string) => string | undefined
    set: (name: string, value: string, options: CookieOptions) => void
    remove: (name: string, options: CookieOptions) => void
}

function createSupa(req: Request, res: NextResponse) {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
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
            } as SupaCookies
        }
    )
}

async function geocode(q: string) {
    if (!MAPBOX_TOKEN) throw new Error('MAPBOX_TOKEN manquant (env)')
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`)
    url.searchParams.set('access_token', MAPBOX_TOKEN)
    url.searchParams.set('limit', '1')
    url.searchParams.set('language', 'fr')
    url.searchParams.set('country', 'be')

    const r = await fetch(url.toString(), { cache: 'no-store' })
    if (!r.ok) throw new Error('Erreur géocodage')
    const j = await r.json() as any
    const feat = j.features?.[0]
    if (!feat?.center?.length) throw new Error('Adresse introuvable')
    const [lon, lat] = feat.center
    return { lon: Number(lon), lat: Number(lat) }
}

function slugify(s: string) {
    return s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

export async function POST(req: Request) {
    const res = NextResponse.json({ ok: true })
    const supabase = createSupa(req, res)

    // 1) Auth
    const { data: { user }, error: uErr } = await supabase.auth.getUser()
    if (uErr || !user) {
        return NextResponse.json({ ok: false, error: 'Non authentifié.' }, { status: 401 })
    }

    // 2) Validate payload
    const json = await req.json().catch(() => ({}))
    const parsed = Payload.safeParse(json)
    if (!parsed.success) {
        return NextResponse.json({ ok: false, error: 'Payload invalide.' }, { status: 400 })
    }
    const input = parsed.data

    // 3) Géocode (serveur)
    const query = [input.address, input.postal_code, input.city, 'Belgique'].filter(Boolean).join(', ')
    let lon: number | null = null
    let lat: number | null = null
    try {
        const g = await geocode(query)
        lon = g.lon; lat = g.lat
    } catch (e) {
        return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 })
    }

    // 4) S’assurer que profiles a bien la ligne (évite la violation de FK)
    await supabase.from('profiles').upsert({
        id: user.id,           // PK = auth.user().id
        email: user.email ?? null,
        updated_at: new Date().toISOString()
    }, { onConflict: 'id', ignoreDuplicates: false })

    // 5) Créer le slug unique
    const base = slugify(input.full_name)
    let slug = base
    for (let i = 0; i < 5; i++) {
        const { data: exists } = await supabase.from('therapists').select('id').eq('slug', slug).maybeSingle()
        if (!exists) break
        slug = `${base}-${Math.random().toString(36).slice(2, 6)}`
    }

    // 6) Insert therapist (respecte la FK profile_id)
    const { data: th, error: eTh } = await supabase
        .from('therapists')
        .insert({
            slug,
            profile_id: user.id,                   // FK OK car profiles upsert avant
            full_name: input.full_name,
            headline: input.headline || null,
            bio: null,
            email: user.email ?? null,
            phone: input.phone || null,
            website: null,
            booking_url: input.booking_url || null,
            price_hint: null,                      // conservé si tu l’utilises ailleurs
            price_min: input.price_min ?? null,
            price_max: input.price_max ?? null,
            price_unit: input.price_unit ?? null,
            is_published: true,
            is_approved: true,
            created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

    if (eTh) {
        return NextResponse.json({ ok: false, error: eTh.message }, { status: 400 })
    }
    const therapist_id = th!.id as string

    // 7) langues
    if (input.languages?.length) {
        const rows = input.languages.map(code => ({ therapist_id, language_code: code }))
        const { error: eLang } = await supabase.from('therapist_languages').insert(rows)
        if (eLang) return NextResponse.json({ ok: false, error: eLang.message }, { status: 400 })
    }

    // 8) spécialités
    if (input.specialties?.length) {
        const rows = input.specialties.map(slug => ({ therapist_id, specialty_slug: slug }))
        const { error: eSpec } = await supabase.from('therapist_specialties').insert(rows)
        if (eSpec) return NextResponse.json({ ok: false, error: eSpec.message }, { status: 400 })
    }

    // 9) localisation (coords via lon/lat serveur; lon/lat peuvent alimenter colonnes STORED)
    const { error: eLoc } = await supabase.from('therapist_locations').insert({
        therapist_id,
        address: input.address || 'Cabinet principal',
        city: input.city,
        postal_code: input.postal_code,
        country: input.country || 'BE',
        modes: input.modes ?? [],
        coords: null,            // si tu utilises une colonne geography + triggers, laisse-la gérée côté DB
        lon,                     // colonnes STORED lat/lon présentes dans ta table → OK
        lat,
    })
    if (eLoc) return NextResponse.json({ ok: false, error: eLoc.message }, { status: 400 })

    return res
}
