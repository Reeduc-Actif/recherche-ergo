import { GeocodeResult } from './location-schemas'

// Client BeSt (Belgique)
export async function geocodeWithBeSt(fullAddress: string): Promise<GeocodeResult | null> {
  try {
    console.log('🔍 BeSt geocoding:', fullAddress)
    
    const response = await fetch(
      `https://api.best.irisnet.be/geocoding/v1/search?` +
      `query=${encodeURIComponent(fullAddress)}&` +
      `limit=1&` +
      `country=BE`
    )

    if (!response.ok) {
      console.warn('⚠️ BeSt API error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      console.log('📍 BeSt: No results found')
      return null
    }

    const feature = data.features[0]
    const [lon, lat] = feature.geometry.coordinates

    return {
      lon,
      lat,
      place_name: feature.properties.label,
      bbox: feature.bbox
    }
  } catch (error) {
    console.error('❌ BeSt geocoding error:', error)
    return null
  }
}

// Client Mapbox (fallback)
export async function geocodeWithMapbox(fullAddress: string): Promise<GeocodeResult | null> {
  try {
    const token = process.env.MAPBOX_TOKEN
    if (!token) {
      console.error('❌ MAPBOX_TOKEN not found')
      return null
    }

    console.log('🔍 Mapbox geocoding:', fullAddress)
    
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?` +
      `access_token=${token}&` +
      `country=BE&` +
      `limit=1`
    )

    if (!response.ok) {
      console.warn('⚠️ Mapbox API error:', response.status)
      return null
    }

    const data = await response.json()
    
    if (!data.features || data.features.length === 0) {
      console.log('📍 Mapbox: No results found')
      return null
    }

    const feature = data.features[0]
    const [lon, lat] = feature.geometry.coordinates

    return {
      lon,
      lat,
      place_name: feature.place_name,
      bbox: feature.bbox
    }
  } catch (error) {
    console.error('❌ Mapbox geocoding error:', error)
    return null
  }
}

// Fonction principale de géocodage
export async function geocodeAddress(fullAddress: string): Promise<GeocodeResult | null> {
  // Essayer BeSt d'abord
  let result = await geocodeWithBeSt(fullAddress)
  
  if (result) {
    console.log('✅ BeSt geocoding successful')
    return result
  }

  // Fallback vers Mapbox
  console.log('🔄 Falling back to Mapbox...')
  result = await geocodeWithMapbox(fullAddress)
  
  if (result) {
    console.log('✅ Mapbox geocoding successful')
    return result
  }

  console.log('❌ No geocoding service found results')
  return null
}
