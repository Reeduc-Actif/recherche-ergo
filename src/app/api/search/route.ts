// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'
import type * as GeoJSON from 'geojson' // ✅ pour typer coverage_geojson

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Payload = z.object({
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  radius_km: z.number().int().min(1).max(300).default(25),
  specialties_filter: z.array(z.string().min(1)).nonempty().optional(),
  languages_filter: z.array(z.string().min(1)).nonempty().optional(),
})

const ALLOWED_LANGS = new Set(['fr', 'nl', 'de', 'en'])

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
  lat: number | null
  languages: string[] | null
  // ✅ on précise les types optionnels
  coverage_radius_km?: number | null
  coverage_geojson?: GeoJSON.Feature | GeoJSON.FeatureCollection | null
}

type Result = RpcRow

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url)
  const mode = z.enum(['cabinet', 'domicile']).optional().catch(undefined).parse(searchParams.get('mode') || undefined)

  const body = await req.json().catch(() => ({}))
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload', results: [] as Result[] }, { status: 400 })
  }

  const { lat, lng, radius_km, specialties_filter, languages_filter } = parsed.data

  const langsNorm =
    Array.isArray(languages_filter)
      ? languages_filter.map((v) => String(v).toLowerCase()).filter((v) => ALLOWED_LANGS.has(v))
      : null

  const supabase = await supabaseServer()
  const in_modes = mode ? [mode] : null

  const { data: rpcData, error } = await supabase.rpc('search_therapists', {
    in_lat: lat ?? null,
    in_lng: lng ?? null,
    in_radius_km: radius_km,
    in_specialties: specialties_filter?.length ? specialties_filter : null,
    in_modes,
    in_languages: langsNorm && langsNorm.length ? langsNorm : null,
  })

  if (error) {
    // eslint-disable-next-line no-console
    console.error('[RPC search_therapists]', error)
    return NextResponse.json({ ok: false, error: error.message, results: [] as Result[] }, { status: 500 })
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
    lat: r.lat,
    languages: r.languages ?? null,
    // ✅ plus de `any`
    coverage_radius_km: r.coverage_radius_km ?? null,
    coverage_geojson: r.coverage_geojson ?? null,
  }))

  return NextResponse.json({ ok: true, results })
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/search' }, { status: 405 })
}
