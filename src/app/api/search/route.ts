// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Validation du payload (défauts sûrs)
const Payload = z.object({
    lat: z.number().finite().optional(),
    lng: z.number().finite().optional(),
    radius_km: z.number().int().min(1).max(200).default(25),
    specialties_filter: z.array(z.string().min(1)).nonempty().optional(),
    modes_filter: z.array(z.string().min(1)).nonempty().optional(),
})

// Typage du retour de la RPC
type RpcRow = {
    therapist_id: string
    slug: string
    full_name: string
    headline: string | null
    booking_url: string | null
    location_id: number
    address: string | null
    city: string | null
    postal_code: string | null
    modes: string[] | null
    distance_m: number | null
    lon: number | null
    lat_out: number | null
}

type Result = {
    therapist_id: string
    slug: string
    full_name: string
    headline: string | null
    booking_url: string | null
    location_id: number
    address: string | null
    city: string | null
    postal_code: string | null
    modes: string[] | null
    distance_m: number | null
    lon: number | null
    lat: number | null
}

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}))
    const parsed = Payload.safeParse(body)

    if (!parsed.success) {
        return NextResponse.json(
            { ok: false, error: 'Invalid payload', results: [] as Result[] },
            { status: 400 },
        )
    }

    const { lat, lng, radius_km, specialties_filter, modes_filter } = parsed.data
    const supabase = await supabaseServer()

    const { data: rpcData, error } = await supabase.rpc('search_therapists', {
        lat: lat ?? null,
        lng: lng ?? null,
        radius_km,
        specialties_filter: specialties_filter ?? null,
        modes_filter: modes_filter ?? null,
    })

    if (error) {
        console.error('[RPC search_therapists]', error) // ← indispensable pour voir la vraie cause
        return NextResponse.json(
            { ok: false, error: error.message, results: [] as Result[] },
            { status: 500 },
        )
    }

    const rows = (rpcData ?? []) as RpcRow[]

    const results: Result[] = rows.map((r) => ({
        therapist_id: r.therapist_id,
        slug: r.slug,
        full_name: r.full_name,
        headline: r.headline,
        booking_url: r.booking_url,
        location_id: r.location_id,
        address: r.address,
        city: r.city,
        postal_code: r.postal_code,
        modes: r.modes,
        distance_m: r.distance_m,
        lon: r.lon,
        lat: r.lat_out,
    }))

    return NextResponse.json({ ok: true, results })
}

// Pour éviter un 405 en GET
export async function GET() {
    return NextResponse.json(
        { ok: false, error: 'Use POST /api/search' },
        { status: 405 },
    )
}
