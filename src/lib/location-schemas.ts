import { z } from 'zod'

// Schéma pour les locations
export const LocationInputZ = z.object({
  street: z.string().min(1),
  house_number: z.string().min(1),
  postal_code: z.string().min(1),
  city: z.string().min(1),
  country: z.string().min(1),
  modes: z.array(z.string()).min(1),
  lon: z.number().optional(),
  lat: z.number().optional(),
})

export const LocationUpdateZ = LocationInputZ.partial().extend({
  id: z.number().int().positive(),
})

// Types
export type LocationInput = z.infer<typeof LocationInputZ>
export type LocationUpdate = z.infer<typeof LocationUpdateZ>

// Réponses API
export interface LocationResponse {
  geocode_status: 'geocoded' | 'pending'
  id?: number
}

// Géocodage
export interface GeocodeResult {
  lon: number
  lat: number
  place_name?: string
  bbox?: number[]
}

// Job de géocodage
export interface GeocodeJob {
  id: number
  location_id: number
  full_address: string
  tries: number
  status: 'queued' | 'processing' | 'done' | 'failed'
  error?: string
  created_at: string
  updated_at: string
}
