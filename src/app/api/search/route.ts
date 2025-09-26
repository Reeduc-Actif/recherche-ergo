// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const Payload = z.object({
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  radius_km: z.number().int().min(1).max(300).optional(),
  specialties_filter: z.array(z.string().min(1)).nonempty().optional(),
  languages_filter: z.array(z.string().min(1)).nonempty().optional(),
})

type Mode = 'cabinet' | 'domicile'

// Row tel que renvoyé par la jointure Supabase (locations + therapists)
type JoinedTherapist = {
  id: string
  slug: string
  full_name: string
  headline: string | null
  booking_url: string | null
  is_published: boolean | null
}

type JoinedLocation = {
  id: number
  therapist_id: string
  address: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  modes: string[] | null
  lon: number | null
  lat: number | null
  therapists: JoinedTherapist | null
}

type ApiRow = {
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
  languages: string[] | null
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mode: Mode = searchParams.get('mode') === 'domicile' ? 'domicile' : 'cabinet'

    const body = await req.json().catch(() => ({}))
    const parsed = Payload.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', results: [] as ApiRow[] }, { status: 400 })
    }
    const { specialties_filter, languages_filter } = parsed.data

    const supabase = await supabaseServer()

    // 1) Filtre langues
    let therapistIdsByLang: string[] | null = null
    if (languages_filter?.length) {
      const { data: langs, error: langErr } = await supabase
        .from('therapist_languages')
        .select('therapist_id, language_code')
        .in('language_code', languages_filter)

      if (langErr) throw langErr
      therapistIdsByLang = Array.from(new Set((langs ?? []).map(r => r.therapist_id)))
    }

    // 2) Filtre spécialités
    let therapistIdsBySpec: string[] | null = null
    if (specialties_filter?.length) {
      const { data: specs, error: specErr } = await supabase
        .from('therapist_specialties')
        .select('therapist_id, specialty_slug')
        .in('specialty_slug', specialties_filter)

      if (specErr) throw specErr
      therapistIdsBySpec = Array.from(new Set((specs ?? []).map(r => r.therapist_id)))
    }

    // 3) Intersection éventuelle
    let therapistFilter: string[] | null = null
    if (therapistIdsByLang && therapistIdsBySpec) {
      const set = new Set(therapistIdsByLang)
      therapistFilter = therapistIdsBySpec.filter(id => set.has(id))
    } else {
      therapistFilter = therapistIdsByLang ?? therapistIdsBySpec ?? null
    }

    // 4) Requête principale
    let q = supabase
      .from('therapist_locations')
      .select(`
        id,
        therapist_id,
        address,
        city,
        postal_code,
        country,
        modes,
        lon,
        lat,
        therapists!inner (
          id,
          slug,
          full_name,
          headline,
          booking_url,
          is_published
        )
      `)
      .eq('country', 'BE')
      .contains('modes', [mode])

    if (therapistFilter && therapistFilter.length) {
      q = q.in('therapist_id', therapistFilter)
    }

    const { data: locsData, error: locErr } = await q
    if (locErr) throw locErr

    const locs = (locsData ?? []) as JoinedLocation[]

    // 5) Mise en forme typée (plus de `any`)
    const results: ApiRow[] = locs
      .filter((r) => Boolean(r.therapists?.is_published))
      .map((r) => {
        const t = r.therapists!
        return {
          therapist_id: r.therapist_id,
          slug: t.slug,
          full_name: t.full_name,
          headline: t.headline,
          booking_url: t.booking_url,
          location_id: r.id,
          address: r.address,
          city: r.city,
          postal_code: r.postal_code,
          modes: r.modes ?? null,
          lon: typeof r.lon === 'number' ? r.lon : null,
          lat: typeof r.lat === 'number' ? r.lat : null,
          languages: null,
        }
      })

    return NextResponse.json({ ok: true, results })
  } catch (e) {
    console.error('[API /api/search] Fatal:', e)
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ ok: false, error: message, results: [] as ApiRow[] }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/search' }, { status: 405 })
}
