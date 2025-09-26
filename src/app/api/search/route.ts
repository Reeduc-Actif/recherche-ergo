import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Payload = z.object({
  specialties_filter: z.array(z.string().min(1)).optional(),
  languages_filter: z.array(z.string().min(1)).optional(),
})

const Mode = z.enum(['cabinet','domicile'])

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
  lon: number | null
  lat: number | null
  coverage_geojson?: unknown | null
}

export async function POST(req: Request) {
  const url = new URL(req.url)
  const mode = Mode.parse(url.searchParams.get('mode'))
  const body = await req.json().catch(() => ({}))
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload', results: [] }, { status: 400 })
  }

  const { specialties_filter, languages_filter } = parsed.data
  const supabase = await supabaseServer()

  const { data, error } = await supabase.rpc('search_therapists_by_mode', {
    in_mode: mode,
    in_specialties: specialties_filter?.length ? specialties_filter : null,
    in_languages: languages_filter?.length ? languages_filter : null,
  })

  if (error) {
    console.error('[search_therapists_by_mode]', error)
    return NextResponse.json({ ok: false, error: error.message, results: [] }, { status: 500 })
  }

  const results: Result[] = (data ?? []).map((r: any) => ({
    therapist_id: r.therapist_id,
    slug: r.slug,
    full_name: r.full_name,
    headline: r.headline ?? null,
    booking_url: r.booking_url ?? null,
    location_id: r.location_id,
    address: r.address ?? null,
    city: r.city ?? null,
    postal_code: r.postal_code ?? null,
    modes: r.modes ?? null,
    lon: r.lon ?? null,
    lat: r.lat ?? null,
    coverage_geojson: r.coverage_geojson ?? null,
  }))

  return NextResponse.json({ ok: true, results })
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/search?mode=cabinet|domicile' }, { status: 405 })
}
export async function POST(req: Request) {
  return handler(req)
}

async function handler(req: Request) {
  const p = await parseRequest(req)
  if ('error' in p) {
    return NextResponse.json({ ok: false, error: p.error, results: [] as Result[] }, { status: p.status })
  }

  const { mode, lat, lng, radius_km, specialties_filter, modes_filter, languages_filter } = p

  const langsNorm =
    Array.isArray(languages_filter)
      ? languages_filter.map((v) => String(v).toLowerCase()).filter((v) => ALLOWED_LANGS.has(v))
      : null

  const supabase = await supabaseServer()
  const { data, error } = await supabase.rpc('search_therapists', {
    in_lat: lat ?? null,
    in_lng: lng ?? null,
    in_radius_km: radius_km,
    in_specialties: specialties_filter?.length ? specialties_filter : null,
    in_modes: modes_filter?.length ? modes_filter : null,
    in_mode: mode,
    in_languages: langsNorm && langsNorm.length ? langsNorm : null,
  })

  if (error) {
    console.error('[RPC search_therapists]', error)
    return NextResponse.json({ ok: false, error: error.message, results: [] as Result[] }, { status: 500 })
  }

  const results = (data ?? []) as RpcRow[]
  return NextResponse.json({ ok: true, results })
}
