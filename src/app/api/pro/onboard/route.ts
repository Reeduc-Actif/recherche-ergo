import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

// --------- Zod ---------
// Cabinets = adresse complète (Mapbox/BeSt)
const CabinetZ = z.object({
  id: z.number().optional(),
  mode: z.literal('cabinet'),
  address: z.string().min(1),
  postal_code: z.string().min(1),
  city: z.string().min(1),
  country: z.literal('BE'),
  lon: z.number().optional(),
  lat: z.number().optional(),
  street: z.string().optional().nullable(),
  house_number: z.string().optional().nullable(),
  place_name: z.string().optional().nullable(),
  mapbox_id: z.string().optional().nullable(),
  bbox: z.array(z.number()).length(4).optional().nullable(),
})

// Domicile = liste de communes (NIS), pas d’adresses
const NisCode = z.union([z.number().int().nonnegative(), z.string().regex(/^\d+$/)])
const DomicileZ = z.object({
  id: z.number().optional(), // ignoré désormais (on ne stocke plus de "location domicile")
  mode: z.literal('domicile'),
  country: z.literal('BE'),
  cities: z.array(NisCode).nonempty(), // NIS list
})

const LocationZ = z.discriminatedUnion('mode', [CabinetZ, DomicileZ])

const Payload = z.object({
  full_name: z.string().min(2),
  headline: z.string().optional(),
  bio: z.string().optional(),
  phone: z.string().optional(),
  website: z.string().optional(),
  booking_url: z.string().optional(),
  languages: z.array(z.enum(['fr', 'nl', 'de', 'en'])).nonempty(),
  specialties: z.array(z.string().min(1)).nonempty(),
  price_min: z.number().optional(),
  price_max: z.number().optional(),
  price_unit: z.enum(['hour', 'session']).optional(),
  locations: z.array(LocationZ).min(1),
})

type Cabinet = z.infer<typeof CabinetZ>
type Domicile = z.infer<typeof DomicileZ>
type Location = z.infer<typeof LocationZ>

// --------- Helpers ---------
function toWKT(lon?: number, lat?: number): string | null {
  if (typeof lon === 'number' && typeof lat === 'number') {
    return `SRID=4326;POINT(${lon} ${lat})`
  }
  return null
}

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// --------- Route ---------
export async function POST(req: Request) {
  const sb = await supabaseServer()

  const body = await req.json().catch(() => ({}))
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }
  const p = parsed.data

  try {
    // 0) Auth obligatoire (RLS)
    const { data: { user }, error: authErr } = await sb.auth.getUser()
    if (authErr) {
      console.error('❌ supabase.auth.getUser error:', authErr)
      return NextResponse.json({ ok: false, error: 'Auth error' }, { status: 401 })
    }
    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
    }

    // 1) Upsert therapist PAR profile_id (unique) → évite le SELECT bloqué par RLS
    const upsertPayload = {
      profile_id: user.id, // 🔑 essentiel pour passer la policy INSERT
      full_name: p.full_name,
      headline: p.headline ?? null,
      bio: p.bio ?? null,
      phone: p.phone ?? null,
      website: p.website ?? null,
      booking_url: p.booking_url ?? null,
      price_min: p.price_min ?? null,
      price_max: p.price_max ?? null,
      price_unit: p.price_unit ?? null,
      is_published: false,
    } as const

    const { data: thRow, error: upsertErr } = await sb
      .from('therapists')
      .upsert(upsertPayload, { onConflict: 'profile_id' })
      .select('id') // nécessite policy SELECT (using profile_id = auth.uid())
      .single()

    if (upsertErr) {
      console.error('❌ Upsert therapists error:', upsertErr)
      return NextResponse.json({ ok: false, error: `Therapist upsert failed: ${upsertErr.message}` }, { status: 500 })
    }

    const therapistId = thRow?.id
    if (!therapistId) {
      return NextResponse.json({ ok: false, error: 'Therapist upsert failed: no id' }, { status: 500 })
    }

    // 2) Sync langues (delete puis insert) — policies JOIN sur therapists.profile_id = auth.uid()
    const langDel = await sb.from('therapist_languages').delete().eq('therapist_id', therapistId)
    if (langDel.error) {
      console.error('❌ Language delete failed:', langDel.error)
      return NextResponse.json({ ok: false, error: `Language delete failed: ${langDel.error.message}` }, { status: 500 })
    }
    if (p.languages?.length) {
      const langIns = await sb.from('therapist_languages').insert(
        p.languages.map(code => ({ therapist_id: therapistId, language_code: code }))
      )
      if (langIns.error) {
        console.error('❌ Language insert failed:', langIns.error)
        return NextResponse.json({ ok: false, error: `Language insert failed: ${langIns.error.message}` }, { status: 500 })
      }
    }

    // 3) Sync spécialités
    const specDel = await sb.from('therapist_specialties').delete().eq('therapist_id', therapistId)
    if (specDel.error) {
      console.error('❌ Specialty delete failed:', specDel.error)
      return NextResponse.json({ ok: false, error: `Specialty delete failed: ${specDel.error.message}` }, { status: 500 })
    }
    if (p.specialties?.length) {
      const specIns = await sb.from('therapist_specialties').insert(
        p.specialties.map(slug => ({ therapist_id: therapistId, specialty_slug: slug }))
      )
      if (specIns.error) {
        console.error('❌ Specialty insert failed:', specIns.error)
        return NextResponse.json({ ok: false, error: `Specialty insert failed: ${specIns.error.message}` }, { status: 500 })
      }
    }

    // 4) Localisations (on purge et on réinsère uniquement les cabinets)
    const locDel = await sb.from('therapist_locations').delete().eq('therapist_id', therapistId)
    if (locDel.error) {
      console.error('❌ Location delete failed:', locDel.error)
      return NextResponse.json({ ok: false, error: `Location delete failed: ${locDel.error.message}` }, { status: 500 })
    }

    const cabinets = (p.locations.filter((l: Location) => l.mode === 'cabinet') as Cabinet[])
    if (cabinets.length) {
      const locIns = await sb
        .from('therapist_locations')
        .insert(
          cabinets.map(c => ({
            therapist_id: therapistId,
            address: c.address,
            postal_code: c.postal_code,
            city: c.city,
            country: c.country,
            modes: ['cabinet'],
            coords: toWKT(c.lon, c.lat), // geography(Point,4326)
            place_name: c.place_name ?? null,
            mapbox_id: c.mapbox_id ?? null,
            street: c.street ?? null,
            house_number: c.house_number ?? null,
            bbox: c.bbox ?? null,
          }))
        )
      if (locIns.error) {
        console.error('❌ Location insert failed:', locIns.error)
        return NextResponse.json({ ok: false, error: `Location insert failed: ${locIns.error.message}` }, { status: 500 })
      }
    }

    // 5) Domicile (NIS) → therapist_home_municipalities (sync différentiel)
    const domiciles = (p.locations.filter((l: Location): l is Domicile => l.mode === 'domicile'))
    const wantedNis = Array.from(
      new Set(
        domiciles.flatMap(d => d.cities.map(n => Number(n)).filter(n => Number.isFinite(n)))
      )
    )

    const { data: existingRows, error: homeReadError } = await sb
      .from('therapist_home_municipalities')
      .select('nis_code')
      .eq('therapist_id', therapistId)

    if (homeReadError) {
      console.error('❌ Home municipalities read failed:', homeReadError)
      return NextResponse.json({ ok: false, error: `Home municipalities read failed: ${homeReadError.message}` }, { status: 500 })
    }

    const haveNis = new Set((existingRows ?? []).map(r => Number(r.nis_code)))
    const wantSet = new Set(wantedNis)

    const toInsert = [...wantSet].filter(nis => !haveNis.has(nis)).map(nis => ({ therapist_id: therapistId, nis_code: nis }))
    const toDelete = [...haveNis].filter(nis => !wantSet.has(nis))

    if (toInsert.length) {
      const homeIns = await sb.from('therapist_home_municipalities').insert(toInsert)
      if (homeIns.error) {
        console.error('❌ Home municipalities insert failed:', homeIns.error)
        return NextResponse.json({ ok: false, error: `Home municipalities insert failed: ${homeIns.error.message}` }, { status: 500 })
      }
    }
    if (toDelete.length) {
      const homeDel = await sb
        .from('therapist_home_municipalities')
        .delete()
        .in('nis_code', toDelete)
        .eq('therapist_id', therapistId)
      if (homeDel.error) {
        console.error('❌ Home municipalities delete failed:', homeDel.error)
        return NextResponse.json({ ok: false, error: `Home municipalities delete failed: ${homeDel.error.message}` }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    console.error('❌ [onboard] ERROR:', msg)
    console.error('❌ Full error:', e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/pro/onboard' }, { status: 405 })
}
