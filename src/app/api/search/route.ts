// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'
import type * as GeoJSON from 'geojson' // pour typer coverage_geojson

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Corps JSON autorisé
const Payload = z.object({
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  radius_km: z.number().int().min(1).max(600).default(300), // Belgique entière par défaut
  specialties_filter: z.array(z.string().min(1)).optional(),
  languages_filter: z.array(z.string().min(2).max(2)).optional(), // fr|nl|de|en
})

const ALLOWED_LANGS = new Set(['fr', 'nl', 'de', 'en'])

// Typage d'une ligne renvoyée par la RPC
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
  coverage_radius_km?: number | null
  coverage_geojson?: GeoJSON.Feature | GeoJSON.FeatureCollection | null
}

type Result = RpcRow

export async function POST(req: Request) {
  // lecture du mode depuis la query (?mode=cabinet|domicile)
  const { searchParams } = new URL(req.url)
  const modeParam = searchParams.get('mode') ?? undefined
  const mode = z.enum(['cabinet', 'domicile']).optional().parse(modeParam as 'cabinet' | 'domicile' | undefined)
  const in_modes = mode ? [mode] : null

  // validation du body
  const body = await req.json().catch(() => ({}))
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload', results: [] as Result[] }, { status: 400 })
  }

  const { lat, lng, radius_km, specialties_filter, languages_filter } = parsed.data

  // normalisation langues
  const langsNorm =
    Array.isArray(languages_filter)
      ? languages_filter.map((v) => String(v).toLowerCase()).filter((v) => ALLOWED_LANGS.has(v))
      : null

  const supabase = await supabaseServer()

  // appel RPC
  const { data: rpcData, error } = await supabase.rpc('search_therapists', {
    in_lat: lat ?? null,
    in_lng: lng ?? null,
    in_radius_km: radius_km,
    in_specialties: specialties_filter?.length ? specialties_filter : null,
    in_modes,
    in_languages: langsNorm && langsNorm.length ? langsNorm : null,
  })

  if (error) {
    // garder ce log pour diagnostiquer côté serveur
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
    coverage_radius_km: r.coverage_radius_km ?? null,
    coverage_geojson: r.coverage_geojson ?? null,
  }))

  return NextResponse.json({ ok: true, results })
}

// éviter 405 sur GET
export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/search' }, { status: 405 })
}
