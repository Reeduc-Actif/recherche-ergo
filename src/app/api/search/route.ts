// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Payload reçu depuis le client
const Payload = z.object({
    lat: z.number().optional(),
    lng: z.number().optional(),
    radius_km: z.number().optional(), // pour plus tard si tu ajoutes un filtre distance
})

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
    if (!_input.success) {
        // On ne bloque pas : on continue avec des valeurs par défaut (fallback)
        // Si tu préfères, renvoie un 400 ici.
    }

    // 2) Supabase server (RLS côté serveur)
    const supabase = await supabaseServer()

    // 3) Récupère les thérapeutes + emplacements
    // NOTE: adapte les noms exacts de relations si différents dans ton schéma.
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

    // 4) Aplatis en tableau de résultats
    const results: Result[] =
        (data ?? []).flatMap((t) =>
            (t as any).therapist_locations?.map((l: any) => ({
                therapist_id: t.id as string,
                slug: t.slug as string,
                full_name: t.full_name as string,
                headline: (t.headline as string) ?? null,
                booking_url: (t.booking_url as string) ?? null,
                location_id: l.id as number,
                address: (l.address as string) ?? null,
                city: (l.city as string) ?? null,
                postal_code: (l.postal_code as string) ?? null,
                modes: (l.modes as string[]) ?? null,
                distance_m: null, // 👉 tu peux calculer la distance plus tard côté RPC
            })) ?? [],
        ) ?? []

    return NextResponse.json({ ok: true, results })
}

// Optionnel : éviter 405 si quelqu’un ping en GET
export async function GET() {
    return NextResponse.json(
        { ok: false, error: 'Use POST /api/search' },
        { status: 405 },
    )
}
