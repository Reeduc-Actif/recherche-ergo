import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

const Query = z.object({
    lat: z.coerce.number().optional(),
    lng: z.coerce.number().optional(),
    radius_km: z.coerce.number().default(25),
    specialties: z.array(z.string()).optional(),
    modes: z.array(z.string()).optional(),
})

export async function POST(req: Request) {
    const body = await req.json().catch(() => ({}))
    const params = Query.parse(body)
    const supabase = await supabaseServer()

    const { data, error } = await supabase.rpc('search_therapists', {
        lat: params.lat ?? null,
        lng: params.lng ?? null,
        radius_km: params.radius_km,
        specialties_filter: params.specialties ?? null,
        modes_filter: params.modes ?? null,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ results: data })
}
