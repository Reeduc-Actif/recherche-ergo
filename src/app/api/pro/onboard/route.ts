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
    console.log('🔍 Starting onboard process for:', p.full_name)
    
    // 1) Upsert therapist (simplifié par full_name).
    //    Idéalement : sécuriser via l'auth (profile_id = user.id).
    console.log('🔍 Searching for existing therapist...')
    const { data: th, error: searchError } = await sb
      .from('therapists')
      .select('id')
      .ilike('full_name', p.full_name)
      .limit(1)
      .maybeSingle()

    if (searchError) {
      console.error('❌ Error searching therapist:', searchError)
      throw new Error(`Search failed: ${searchError.message}`)
    }

    console.log('🔍 Existing therapist found:', th?.id || 'None')

    let therapistId = th?.id
    
    if (!therapistId) {
      console.log('🔍 Creating new therapist...')
      const insertResult = await sb
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
        .single()

      if (insertResult.error) {
        console.error('❌ Error inserting therapist:', insertResult.error)
        throw new Error(`Therapist insert failed: ${insertResult.error.message}`)
      }

      therapistId = insertResult.data?.id
      console.log('✅ New therapist created with ID:', therapistId)
    }

    if (!therapistId) throw new Error('Therapist upsert failed - no ID returned')

    // 2) Sync langues
    console.log('🔍 Syncing languages...')
    const langDeleteResult = await sb.from('therapist_languages').delete().eq('therapist_id', therapistId)
    if (langDeleteResult.error) {
      console.error('❌ Error deleting languages:', langDeleteResult.error)
      throw new Error(`Language delete failed: ${langDeleteResult.error.message}`)
    }
    
    if (p.languages?.length) {
      console.log('🔍 Inserting languages:', p.languages)
      const langInsertResult = await sb.from('therapist_languages').insert(
        p.languages.map(code => ({ therapist_id: therapistId, language_code: code }))
      )
      if (langInsertResult.error) {
        console.error('❌ Error inserting languages:', langInsertResult.error)
        throw new Error(`Language insert failed: ${langInsertResult.error.message}`)
      }
    }

    // 3) Sync spécialités
    console.log('🔍 Syncing specialties...')
    const specDeleteResult = await sb.from('therapist_specialties').delete().eq('therapist_id', therapistId)
    if (specDeleteResult.error) {
      console.error('❌ Error deleting specialties:', specDeleteResult.error)
      throw new Error(`Specialty delete failed: ${specDeleteResult.error.message}`)
    }
    
    if (p.specialties?.length) {
      console.log('🔍 Inserting specialties:', p.specialties)
      const specInsertResult = await sb.from('therapist_specialties').insert(
        p.specialties.map(slug => ({ therapist_id: therapistId, specialty_slug: slug }))
      )
      if (specInsertResult.error) {
        console.error('❌ Error inserting specialties:', specInsertResult.error)
        throw new Error(`Specialty insert failed: ${specInsertResult.error.message}`)
      }
    }

    // 4) Localisations
    // On REPART SAIN : on supprime toutes les anciennes locations (cabinet/legacy)
    // et on réinsère uniquement les CABINETS.
    console.log('🔍 Syncing locations...')
    const locDeleteResult = await sb.from('therapist_locations').delete().eq('therapist_id', therapistId)
    if (locDeleteResult.error) {
      console.error('❌ Error deleting locations:', locDeleteResult.error)
      throw new Error(`Location delete failed: ${locDeleteResult.error.message}`)
    }

    const cabinets = (p.locations.filter((l: Location) => l.mode === 'cabinet') as Cabinet[])
    console.log('🔍 Found cabinets:', cabinets.length)
    
    if (cabinets.length) {
      console.log('🔍 Inserting cabinet locations...')
      const locInsertResult = await sb
        .from('therapist_locations')
        .insert(
          cabinets.map(c => ({
            therapist_id: therapistId,
            address: c.address,
            postal_code: c.postal_code,
            city: c.city,
            country: c.country,
            modes: ['cabinet'],
            coords: toWKT(c.lon, c.lat),
            place_name: c.place_name ?? null,
            mapbox_id: c.mapbox_id ?? null,
            street: c.street ?? null,
            house_number: c.house_number ?? null,
            bbox: c.bbox ?? null,
          }))
        )
      
      if (locInsertResult.error) {
        console.error('❌ Error inserting locations:', locInsertResult.error)
        throw new Error(`Location insert failed: ${locInsertResult.error.message}`)
      }
    }

    // 5) Zones à domicile (communes NIS) -> therapist_home_municipalities
    //    On synchronise l'ensemble (insert manquants / delete retirés).
    console.log('🔍 Syncing home municipalities...')
    const domiciles = (p.locations.filter((l: Location): l is Domicile => l.mode === 'domicile'))
    console.log('🔍 Found domiciles:', domiciles.length)
    
    const wantedNis = Array.from(
      new Set(
        domiciles.flatMap(d => d.cities.map(n => Number(n)).filter(n => Number.isFinite(n)))
      )
    )
    console.log('🔍 Wanted NIS codes:', wantedNis)

    // Lire l'existant
    const { data: existingRows, error: homeReadError } = await sb
      .from('therapist_home_municipalities')
      .select('nis_code')
      .eq('therapist_id', therapistId)

    if (homeReadError) {
      console.error('❌ Error reading home municipalities:', homeReadError)
      throw new Error(`Home municipalities read failed: ${homeReadError.message}`)
    }

    const haveNis = new Set((existingRows ?? []).map(r => Number(r.nis_code)))
    const wantSet = new Set(wantedNis)

    const toInsert = [...wantSet].filter(nis => !haveNis.has(nis)).map(nis => ({ therapist_id: therapistId, nis_code: nis }))
    const toDelete = [...haveNis].filter(nis => !wantSet.has(nis))

    console.log('🔍 To insert:', toInsert.length, 'To delete:', toDelete.length)

    if (toInsert.length) {
      console.log('🔍 Inserting home municipalities...')
      const homeInsertResult = await sb.from('therapist_home_municipalities').insert(toInsert)
      if (homeInsertResult.error) {
        console.error('❌ Error inserting home municipalities:', homeInsertResult.error)
        throw new Error(`Home municipalities insert failed: ${homeInsertResult.error.message}`)
      }
    }
    if (toDelete.length) {
      console.log('🔍 Deleting home municipalities...')
      const homeDeleteResult = await sb
        .from('therapist_home_municipalities')
        .delete()
        .in('nis_code', toDelete)
        .eq('therapist_id', therapistId)
      
      if (homeDeleteResult.error) {
        console.error('❌ Error deleting home municipalities:', homeDeleteResult.error)
        throw new Error(`Home municipalities delete failed: ${homeDeleteResult.error.message}`)
      }
    }

    console.log('✅ Onboard process completed successfully!')
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
