// src/app/api/search/route.ts
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// On garde la charge utile minimale ; lat/lng ignorés pour l’instant (Belgique entière)
const Payload = z.object({
  lat: z.number().finite().optional(),
  lng: z.number().finite().optional(),
  radius_km: z.number().int().min(1).max(300).optional(),
  specialties_filter: z.array(z.string().min(1)).nonempty().optional(),
  languages_filter: z.array(z.string().min(1)).nonempty().optional(),
})

type Mode = 'cabinet' | 'domicile'

type Row = {
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
  // distance_m ignorée (pas de rayon)
  lon: number | null
  lat: number | null
  languages: string[] | null
}

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const mode: Mode =
      (searchParams.get('mode') === 'domicile' ? 'domicile' : 'cabinet')

    const body = await req.json().catch(() => ({}))
    const parsed = Payload.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: 'Invalid payload', results: [] as Row[] }, { status: 400 })
    }
    const { specialties_filter, languages_filter } = parsed.data

    const supabase = await supabaseServer()

    // 1) Filtre langues (liste des therapist_id)
    let therapistIdsByLang: string[] | null = null
    if (languages_filter?.length) {
      const { data: langs, error: langErr } = await supabase
        .from('therapist_languages')
        .select('therapist_id, language_code')
        .in('language_code', languages_filter)

      if (langErr) throw langErr
      therapistIdsByLang = Array.from(new Set((langs ?? []).map(r => r.therapist_id)))
    }

    // 2) Filtre spécialités (liste des therapist_id)
    let therapistIdsBySpec: string[] | null = null
    if (specialties_filter?.length) {
      const { data: specs, error: specErr } = await supabase
        .from('therapist_specialties')
        .select('therapist_id, specialty_slug')
        .in('specialty_slug', specialties_filter)

      if (specErr) throw specErr
      therapistIdsBySpec = Array.from(new Set((specs ?? []).map(r => r.therapist_id)))
    }

    // 3) Intersection éventuelle des deux filtres
    let therapistFilter: string[] | null = null
    if (therapistIdsByLang && therapistIdsBySpec) {
      const set = new Set(therapistIdsByLang)
      therapistFilter = therapistIdsBySpec.filter(id => set.has(id))
    } else {
      therapistFilter = therapistIdsByLang ?? therapistIdsBySpec ?? null
    }

    // 4) Jointure therapists + therapist_locations (filtrage par mode)
    //    On ne fait pas de distance ; on renvoie tout en Belgique.
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

    // filtre “mode” (modes est text[])
    q = q.contains('modes', [mode])

    if (therapistFilter && therapistFilter.length) {
      q = q.in('therapist_id', therapistFilter)
    }

    // uniquement profils publiés
    // (filtre via la jointure inner déjà, mais on s’assure)
    const { data: locs, error: locErr } = await q
    if (locErr) throw locErr

    // 5) mise en forme
    const results: Row[] = (locs ?? [])
      .filter((r: any) => r.therapists?.is_published) // sécurité
      .map((r: any) => ({
        therapist_id: r.therapist_id,
        slug: r.therapists.slug,
        full_name: r.therapists.full_name,
        headline: r.therapists.headline,
        booking_url: r.therapists.booking_url,
        location_id: r.id,
        address: r.address,
        city: r.city,
        postal_code: r.postal_code,
        modes: r.modes ?? null,
        lon: typeof r.lon === 'number' ? r.lon : null,
        lat: typeof r.lat === 'number' ? r.lat : null,
        languages: null, // (optionnel: on peut les recharger si besoin)
      }))

    return NextResponse.json({ ok: true, results })
  } catch (e) {
    // Log côté serveur pour que tu voies l'erreur exacte dans Vercel/terminal
    console.error('[API /api/search] Fatal:', e)
    const message = e instanceof Error ? e.message : 'Server error'
    return NextResponse.json({ ok: false, error: message, results: [] }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/search' }, { status: 405 })
}
