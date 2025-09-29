// Exemples d'utilisation des endpoints de géolocalisation

// 1. Créer une location avec coordonnées (géocodage immédiat)
export const createLocationWithCoords = async () => {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      street: 'Rue de la Loi',
      house_number: '16',
      postal_code: '1000',
      city: 'Bruxelles',
      country: 'BE',
      modes: ['cabinet'],
      lon: 4.3676,
      lat: 50.8467
    })
  })

  const result = await response.json()
  // Réponse: { ok: true, geocode_status: 'geocoded', id: 123 }
  return result
}

// 2. Créer une location sans coordonnées (géocodage différé)
export const createLocationWithoutCoords = async () => {
  const response = await fetch('/api/locations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      street: 'Rue du Ménil',
      house_number: '141',
      postal_code: '1420',
      city: 'Braine-l\'Alleud',
      country: 'BE',
      modes: ['cabinet']
    })
  })

  const result = await response.json()
  // Réponse: { ok: true, geocode_status: 'pending', id: 124 }
  return result
}

// 3. Mettre à jour une location
export const updateLocation = async (id: number) => {
  const response = await fetch(`/api/locations/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      street: 'Avenue Louise',
      house_number: '123',
      postal_code: '1050',
      city: 'Bruxelles',
      country: 'BE',
      modes: ['cabinet']
    })
  })

  const result = await response.json()
  // Réponse: { ok: true, geocode_status: 'pending' }
  return result
}

// 4. Appeler le cron de géocodage (depuis Vercel Cron)
export const triggerGeocodeCron = async () => {
  const response = await fetch('/api/_cron/geocode', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-cron-secret': process.env.CRON_SECRET!
    }
  })

  const result = await response.json()
  // Réponse: { ok: true, processed: 5, successful: 4, failed: 1 }
  return result
}
