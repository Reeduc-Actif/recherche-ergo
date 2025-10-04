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
  city: z.string().min(1).optional(),
})

type Mode = 'cabinet' | 'domicile'

type JoinedTherapist = {
  id: string
  slug: string
  first_name: string
  last_name: string
  booking_url: string | null
  is_published: boolean | null
}

// type JoinedLocation = {
//   id: number
//   therapist_id: string
//   address: string | null
//   city: string | null
//   postal_code: string | null
//   country: string | null
//   modes: string[] | null
//   lon: number | null
//   lat: number | null
//   therapists: JoinedTherapist | null
// }


type ApiRow = {
  therapist_id: string
  slug: string
  first_name: string
  last_name: string
  booking_url: string | null
  location_id: number
  address: string | null
  city: string | null
  postal_code: string | null
  distance_m: number | null
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
    const { lat, lng, radius_km, specialties_filter, languages_filter, city } = parsed.data

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

    // 4) Requête selon le mode
    let results: ApiRow[] = []
    
    if (mode === 'cabinet') {
      // Mode cabinet : recherche par localisation géographique
      let q = supabase
        .from('therapist_locations')
        .select(`
          id,
          therapist_id,
          street,
          house_number,
          city,
          postal_code,
          country,
          lon,
          lat,
          therapists!inner (
            id,
            slug,
            first_name,
            last_name,
            booking_url,
            is_published
          )
        `)
        .eq('country', 'BE')
        .eq('therapists.is_published', true)
        .not('lon', 'is', null)
        .not('lat', 'is', null)

      if (therapistFilter && therapistFilter.length) {
        q = q.in('therapist_id', therapistFilter)
      }

      const { data: locsData, error: locErr } = await q
      if (locErr) throw locErr

      // Normaliser et calculer les distances si lat/lng fournis
      type CabinetLocationRow = {
        id: number
        therapist_id: string
        street: string | null
        house_number: string | null
        city: string | null
        postal_code: string | null
        country: string | null
        lon: number | null
        lat: number | null
        therapists: JoinedTherapist | JoinedTherapist[] | null
      }
      const locs = (locsData ?? []) as CabinetLocationRow[]
      results = locs
        .filter((r) => {
          const t = Array.isArray(r.therapists) ? r.therapists[0] : r.therapists
          return t !== null && t !== undefined
        })
        .map((r) => {
          const t = Array.isArray(r.therapists) ? r.therapists[0]! : r.therapists!
          
          let distance_m: number | null = null
          
          if (lat && lng && r.lon && r.lat) {
            // Calcul distance approximatif (formule haversine simplifiée)
            const R = 6371000 // Rayon de la Terre en mètres
            const dLat = (r.lat - lat) * Math.PI / 180
            const dLng = (r.lon - lng) * Math.PI / 180
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(lat * Math.PI / 180) * Math.cos(r.lat * Math.PI / 180) *
                      Math.sin(dLng/2) * Math.sin(dLng/2)
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
            distance_m = R * c
          }
          
          // Construire l'adresse complète
          const addressParts = [r.street, r.house_number].filter(Boolean)
          const address = addressParts.length > 0 ? addressParts.join(' ') : null
          
          return {
            therapist_id: r.therapist_id,
            slug: t.slug,
            first_name: t.first_name,
            last_name: t.last_name,
            booking_url: t.booking_url,
            location_id: r.id,
            address: address,
            city: r.city,
            postal_code: r.postal_code,
            distance_m,
            lon: typeof r.lon === 'number' ? r.lon : null,
            lat: typeof r.lat === 'number' ? r.lat : null,
            languages: null,
          } as ApiRow
        })
      
      // Filtrer par rayon si spécifié
      if (radius_km && lat && lng) {
        const radiusM = radius_km * 1000
        results = results.filter(r => r.distance_m === null || r.distance_m <= radiusM)
      }
      
      // Trier par distance
      results.sort((a, b) => {
        if (a.distance_m === null && b.distance_m === null) return 0
        if (a.distance_m === null) return 1
        if (b.distance_m === null) return -1
        return a.distance_m - b.distance_m
      })
      
    } else {
      // Mode domicile : recherche par ville dans therapist_home_municipalities
      if (!city) {
        return NextResponse.json({ ok: true, results: [] })
      }
      
      // Trouver les NIS codes correspondant à la ville
      const { data: cityData, error: cityErr } = await supabase
        .from('cities_be')
        .select('nis_code')
        .ilike('name_fr', `%${city}%`)
        
      if (cityErr) throw cityErr
      
      const nisCodes = (cityData ?? []).map(c => c.nis_code)
      
      if (nisCodes.length === 0) {
        return NextResponse.json({ ok: true, results: [] })
      }
      
      // Trouver les thérapeutes qui travaillent dans ces villes
      let q = supabase
        .from('therapist_home_municipalities')
        .select(`
          therapist_id,
          nis_code,
          therapists!inner (
            id,
            slug,
            first_name,
            last_name,
            booking_url,
            is_published
          )
        `)
        .in('nis_code', nisCodes)
        .eq('therapists.is_published', true)
        
      if (therapistFilter && therapistFilter.length) {
        q = q.in('therapist_id', therapistFilter)
      }
      
      const { data: homeData, error: homeErr } = await q
      if (homeErr) throw homeErr
      
      // Grouper par thérapeute pour éviter les doublons
      type HomeMunicipalityRow = {
        therapist_id: string
        nis_code: number
        therapists: JoinedTherapist | JoinedTherapist[] | null
      }
      const therapistMap = new Map<string, ApiRow>()
      
      ;(homeData ?? []).forEach((r: HomeMunicipalityRow) => {
        const t = Array.isArray(r.therapists) ? r.therapists[0] : r.therapists
        if (!t || therapistMap.has(r.therapist_id)) return // Skip si pas de thérapeute ou déjà ajouté
        
        therapistMap.set(r.therapist_id, {
          therapist_id: r.therapist_id,
          slug: t.slug,
          first_name: t.first_name,
          last_name: t.last_name,
          booking_url: t.booking_url,
          location_id: 0, // Pas de location_id pour le mode domicile
          address: null,
          city: city, // La ville recherchée
          postal_code: null,
          distance_m: null,
          lon: null,
          lat: null,
          languages: null,
        })
      })
      
      results = Array.from(therapistMap.values())
    }


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
