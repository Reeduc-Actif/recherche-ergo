import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase'
import { LocationInputZ, LocationResponse } from '@/lib/location-schemas'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Helper pour construire l'adresse complète
function buildFullAddress(street: string, houseNumber: string, postalCode: string, city: string, country: string): string {
  return `${street} ${houseNumber}, ${postalCode} ${city}, ${country}`.trim()
}

// Helper pour créer les coordonnées WKT
function toWKT(lon: number, lat: number): string {
  return `SRID=4326;POINT(${lon} ${lat})`
}

export async function POST(req: NextRequest) {
  const sb = await supabaseServer()

  try {
    const body = await req.json()
    const parsed = LocationInputZ.safeParse(body)
    
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error)
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const data = parsed.data
    const fullAddress = buildFullAddress(data.street, data.house_number, data.postal_code, data.city, data.country)

    // Si lon/lat fournis → calculer coords et insérer direct
    if (data.lon && data.lat) {
      const coords = toWKT(data.lon, data.lat)
      
      const { data: location, error } = await sb
        .from('therapist_locations')
        .insert({
          street: data.street,
          house_number: data.house_number,
          postal_code: data.postal_code,
          city: data.city,
          country: data.country,
          modes: data.modes,
          coords,
          lon: data.lon,
          lat: data.lat,
        })
        .select('id')
        .single()

      if (error) {
        console.error('❌ Location insert failed:', error)
        return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 })
      }

      console.log('✅ Location created with coords:', location.id)
      return NextResponse.json({ 
        ok: true, 
        geocode_status: 'geocoded' as const,
        id: location.id 
      }, { status: 201 })
    }

    // Sinon → insérer sans coords + créer un job queued
    const { data: location, error: locError } = await sb
      .from('therapist_locations')
      .insert({
        street: data.street,
        house_number: data.house_number,
        postal_code: data.postal_code,
        city: data.city,
        country: data.country,
        modes: data.modes,
        coords: null,
        lon: null,
        lat: null,
      })
      .select('id')
      .single()

    if (locError) {
      console.error('❌ Location insert failed:', locError)
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 })
    }

    // Créer le job de géocodage
    const { error: jobError } = await sb
      .from('address_geocode_jobs')
      .insert({
        location_id: location.id,
        full_address: fullAddress,
        tries: 0,
        status: 'queued',
      })

    if (jobError) {
      console.error('❌ Geocode job creation failed:', jobError)
      // Ne pas échouer la création de location si le job échoue
    }

    console.log('✅ Location created without coords, job queued:', location.id)
    return NextResponse.json({ 
      ok: true, 
      geocode_status: 'pending' as const,
      id: location.id 
    }, { status: 202 })

  } catch (error) {
    console.error('❌ POST /api/locations error:', error)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
