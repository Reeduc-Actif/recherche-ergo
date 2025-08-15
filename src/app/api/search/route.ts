// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Payload reçu depuis le client
const Payload = z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    radius_km: z.number().optional(),
})

type LocationRow = {
    id: number
    address: string | null
    city: string | null
    postal_code: string | null
    modes: string[] | null
}

type TherapistWithLocations = {
    id: string
    slug: string
    full_name: string
    headline: string | null
    booking_url: string | null
    therapist_locations: LocationRow[] | null
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
}

/**
 * POST /api/search
 * Retourne une liste à plat de thérapeutes + adresses (distance_m = null tant que pas de géo).
 */
export async function POST(req: Request) {
    // 1) Parse/valide l'input (même si on ne l'exploite pas encore pour filtrer)
    const json = await req.json().catch(() => ({}))
    const _input = Payload.safeParse(json)
    // (optionnel) si tu veux bloquer sur payload invalide, renvoie 400 ici

    // 2) Supabase (côté serveur)
    const supabase = await supabaseServer()

    // 3) Récupère les thérapeutes + emplacements
    const { data, error } = await supabase
        .from('therapists')
        .select(
            `
      id,
      slug,
      full_name,
      headline,
      booking_url,
      therapist_locations:therapist_locations (
        id,
        address,
        city,
        postal_code,
        modes
      )
    `,
        )
        .limit(100)

    if (error) {
        return NextResponse.json(
            { ok: false, error: error.message, results: [] as Result[] },
            { status: 500 },
        )
    }

    // 4) Typage fort de la réponse (sans any)
    const rows = (data ?? []) as unknown as TherapistWithLocations[]

    // 5) Aplatir en tableau de résultats
    const results: Result[] = rows.flatMap((t) =>
        (t.therapist_locations ?? []).map((l) => ({
            therapist_id: t.id,
            slug: t.slug,
            full_name: t.full_name,
            headline: t.headline ?? null,
            booking_url: t.booking_url ?? null,
            location_id: l.id,
            address: l.address ?? null,
            city: l.city ?? null,
            postal_code: l.postal_code ?? null,
            modes: l.modes ?? null,
            distance_m: null, // 👉 à calculer plus tard via RPC géo
        })),
    )

    return NextResponse.json({ ok: true, results })
}

// Optionnel : éviter 405 si quelqu’un ping en GET
export async function GET() {
    return NextResponse.json(
        { ok: false, error: 'Use POST /api/search' },
        { status: 405 },
    )
}
