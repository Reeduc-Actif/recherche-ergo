// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'
import type { Feature, FeatureCollection } from 'geojson'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const BodyPayload = z.object({
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  radius_km: z.number().int().min(1).max(300).default(25),
  specialties_filter: z.array(z.string().min(1)).nonempty().optional(),
  // modes_filter plus utile si tu passes "mode" en query, on le laisse optionnel pour rétro-compat
  modes_filter: z.array(z.enum(['cabinet', 'domicile'])).nonempty().optional(),
  languages_filter: z.array(z.string().min(1)).nonempty().optional(),
})

const ModeParam = z.enum(['cabinet', 'domicile']).default('cabinet')
const ALLOWED_LANGS = new Set(['fr', 'nl', 'de', 'en'])

type Coverage = Feature | FeatureCollection | null

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
  coverage_radius_km: number | null
  coverage_geojson: Coverage
}

type Result = RpcRow

async function parseRequest(req: Request) {
  const url = new URL(req.url)
  const qsMode = url.searchParams.get('mode') ?? undefined
  const mode = ModeParam.parse(qsMode)

  if (req.method === 'POST') {
    const body = await req.json().catch(() => ({}))
    const parsed = BodyPayload.safeParse(body)
    if (!parsed.success) {
      return { error: 'Invalid payload', status: 400 } as const
    }
    return { mode, ...parsed.data } as const
  }

  // GET
  const lat = url.searchParams.get('lat')
  const lng = url.searchParams.get('lng')
  const radius = url.searchParams.get('radius_km')
  const specialties = url.searchParams.getAll('specialties')
  const languages = url.searchParams.getAll('languages')

  return {
    mode,
    lat: lat ? Number(lat) : undefined,
    lng: lng ? Number(lng) : undefined,
    radius_km: radius ? Math.min(300, Math.max(1, Number(radius))) : 25,
    specialties_filter: specialties.length ? specialties : undefined,
    modes_filter: undefined,
    languages_filter: languages.length ? languages : undefined,
  } as const
}

export async function GET(req: Request) {
  return handler(req)
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
