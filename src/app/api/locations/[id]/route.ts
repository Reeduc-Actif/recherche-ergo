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

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const sb = await supabaseServer()

  try {
    const locationId = parseInt(params.id)
    if (isNaN(locationId)) {
      return NextResponse.json({ ok: false, error: 'Invalid location ID' }, { status: 400 })
    }

    const body = await req.json()
    const parsed = LocationInputZ.safeParse(body)
    
    if (!parsed.success) {
      console.error('❌ Validation failed:', parsed.error)
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 })
    }

    const data = parsed.data
    const fullAddress = buildFullAddress(data.street, data.house_number, data.postal_code, data.city, data.country)

    // Vérifier que la location existe
    const { data: existingLocation, error: fetchError } = await sb
      .from('therapist_locations')
      .select('id, street, house_number, postal_code, city, country')
      .eq('id', locationId)
      .single()

    if (fetchError || !existingLocation) {
      return NextResponse.json({ ok: false, error: 'Location not found' }, { status: 404 })
    }

    // Si lon/lat fournis → calculer coords et update direct
    if (data.lon && data.lat) {
      const coords = toWKT(data.lon, data.lat)
      
      const { error } = await sb
        .from('therapist_locations')
        .update({
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
        .eq('id', locationId)

      if (error) {
        console.error('❌ Location update failed:', error)
        return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 })
      }

      console.log('✅ Location updated with coords:', locationId)
      return NextResponse.json({ 
        ok: true, 
        geocode_status: 'geocoded' as const 
      }, { status: 200 })
    }

    // Sinon → update sans coords
    const { error } = await sb
      .from('therapist_locations')
      .update({
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
      .eq('id', locationId)

    if (error) {
      console.error('❌ Location update failed:', error)
      return NextResponse.json({ ok: false, error: 'Database error' }, { status: 500 })
    }

    // Vérifier si l'adresse a changé pour créer un nouveau job
    const addressChanged = 
      existingLocation.street !== data.street ||
      existingLocation.house_number !== data.house_number ||
      existingLocation.postal_code !== data.postal_code ||
      existingLocation.city !== data.city ||
      existingLocation.country !== data.country

    if (addressChanged) {
      // Annuler les jobs existants pour cette location
      await sb
        .from('address_geocode_jobs')
        .update({ status: 'cancelled' })
        .eq('location_id', locationId)
        .eq('status', 'queued')

      // Créer un nouveau job
      const { error: jobError } = await sb
        .from('address_geocode_jobs')
        .insert({
          location_id: locationId,
          full_address: fullAddress,
          tries: 0,
          status: 'queued',
        })

      if (jobError) {
        console.error('❌ Geocode job creation failed:', jobError)
        // Ne pas échouer l'update si le job échoue
      }
    }

    console.log('✅ Location updated without coords:', locationId)
    return NextResponse.json({ 
      ok: true, 
      geocode_status: 'pending' as const 
    }, { status: 200 })

  } catch (error) {
    console.error('❌ PUT /api/locations/[id] error:', error)
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 })
  }
}
