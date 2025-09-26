import { NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'

// --------- Zod ---------
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

const DomicileZ = z.object({
  id: z.number().optional(),
  mode: z.literal('domicile'),
  country: z.literal('BE'),
  cities: z.array(z.string().min(1)).nonempty(), // codes INSEE
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
  // NEW
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

// --------- Route ---------
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const sb = await supabaseServer()

  const body = await req.json().catch(() => ({}))
  const parsed = Payload.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
  }
  const p = parsed.data

  try {
    // 1) Upsert therapist (par full_name + profil courant)
    //    -> si tu as l’auth, récupère l’user/profile_id pour sécuriser.
    const { data: th } = await sb
      .from('therapists')
      .select('id')
      .ilike('full_name', p.full_name)
      .limit(1)
      .maybeSingle()

    const therapistId =
      th?.id ??
      (await sb
        .from('therapists')
        .insert({
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
        })
        .select('id')
        .single()).data?.id

    if (!therapistId) throw new Error('Therapist upsert failed')

    // 2) Sync langues
    await sb.from('therapist_languages').delete().eq('therapist_id', therapistId)
    if (p.languages?.length) {
      await sb.from('therapist_languages').insert(
        p.languages.map((code: string) => ({ therapist_id: therapistId, language_code: code }))
      )
    }

    // 3) Sync spécialités
    await sb.from('therapist_specialties').delete().eq('therapist_id', therapistId)
    if (p.specialties?.length) {
      await sb.from('therapist_specialties').insert(
        p.specialties.map((slug: string) => ({ therapist_id: therapistId, specialty_slug: slug }))
      )
    }

    // 4) Localisations : on *remplace* l’existant pour simplifier
    const { data: oldLocs } = await sb
      .from('therapist_locations')
      .select('id')
      .eq('therapist_id', therapistId)

  const oldIds = ((oldLocs ?? []) as { id: number }[]).map((l: { id: number }) => l.id)
    if (oldIds.length) {
      await sb.from('therapist_location_cities').delete().in('location_id', oldIds)
      await sb.from('therapist_locations').delete().eq('therapist_id', therapistId)
    }

    // 4.1 Insert cabinets
  const cabinets = (p.locations.filter((l: Location) => l.mode === 'cabinet') as Cabinet[])
    if (cabinets.length) {
      const { data: ins } = await sb
        .from('therapist_locations')
        .insert(
          cabinets.map((c: Cabinet) => ({
            therapist_id: therapistId,
            address: c.address,
            postal_code: c.postal_code,
            city: c.city,
            country: c.country,
            modes: ['cabinet'],
            // IMPORTANT: on renseigne *coords* (lon/lat peuvent être GENERATED)
            coords: toWKT(c.lon, c.lat),
            // méta
            place_name: c.place_name ?? null,
            mapbox_id: c.mapbox_id ?? null,
            street: c.street ?? null,
            house_number: c.house_number ?? null,
            bbox: c.bbox ?? null,
          }))
        )
        .select('id')
      // we don't need the inserted ids for now; avoid unused var
      void ins
    }

    // 4.2 Insert zones à domicile
  const domiciles = p.locations.filter((l: Location): l is Domicile => l.mode === 'domicile')
    if (domiciles.length) {
      // une ligne par zone
      const { data: insLocs } = await sb
        .from('therapist_locations')
        .insert(
          domiciles.map((d: Domicile) => ({
            therapist_id: therapistId,
            address: null,
            postal_code: null,
            city: null,
            country: d.country,
            modes: ['domicile'],
            coords: null,
          }))
        )
        .select('id')
      const ins = (insLocs ?? []) as { id: number }[]
      const domicileIds = ins.map((x: { id: number }, i: number) => ({ id: x.id, cities: domiciles[i].cities }))
      // cities (INSEE) pour chaque location
      const rows = domicileIds.flatMap((d: { id: number; cities: string[] }) =>
        d.cities.map((code: string) => ({ location_id: d.id, city_insee: code }))
      )
      if (rows.length) {
        await sb.from('therapist_location_cities').insert(rows)
      }
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Server error'
    // eslint-disable-next-line no-console
    console.error('[onboard]', msg)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: false, error: 'Use POST /api/pro/onboard' }, { status: 405 })
}
