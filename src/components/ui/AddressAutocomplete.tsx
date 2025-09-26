'use client'

import { useEffect, useState } from 'react'

/** ---------- Types Mapbox (réponse geocoding) ---------- */
type BBox = [number, number, number, number]

type MbContextItem = {
  id: string
  text: string
  short_code?: string
}

type MbFeature = {
  id: string
  place_type: string[]
  place_name: string
  text: string
  address?: string
  center: [number, number]               // [lon, lat]
  bbox?: BBox
  geometry: { type: 'Point'; coordinates: [number, number] }
  properties?: { mapbox_id?: string }    // champ présent sur certaines réponses
  context?: MbContextItem[]
}

type MbResponse = {
  type: 'FeatureCollection'
  query: string[]
  features: MbFeature[]
}

/** ---------- Ce que l’UI renvoie au parent ---------- */
export type AddressSuggestion = {
  label: string
  address: string
  city: string
  postal_code: string
  country: 'BE'
  lon: number
  lat: number
  // métadonnées facultatives
  mapbox_id?: string | null
  place_name?: string | null
  street?: string | null
  house_number?: string | null
  bbox?: BBox | null
}

type Props = {
  value: string
  onChange: (v: string) => void
  onSelect: (s: AddressSuggestion) => void
  placeholder?: string
}

/** ---------- Helpers d’extraction depuis les features ---------- */
function pickFromContext(
  ctx: MbContextItem[] | undefined,
  startsWith: string,
): string | null {
  if (!ctx) return null
  const it = ctx.find((c) => c.id.startsWith(startsWith))
  return it?.text ?? null
}

function featureToSuggestion(f: MbFeature): AddressSuggestion | null {
  const [lon, lat] = f.center ?? f.geometry.coordinates
  if (typeof lon !== 'number' || typeof lat !== 'number') return null

  // ville: priorité place/locality
  const city =
    pickFromContext(f.context, 'place') ??
    pickFromContext(f.context, 'locality') ??
    ''

  // code postal
  const postal =
    pickFromContext(f.context, 'postcode') ?? ''

  // rue + numéro si disponibles
  const street = f.text || null
  const house = f.address ?? null

  // adresse “courte”
  const address = [house, street].filter(Boolean).join(' ') || f.place_name

  return {
    label: f.place_name,
    address,
    city,
    postal_code: postal,
    country: 'BE',
    lon,
    lat,
    mapbox_id: f.properties?.mapbox_id ?? null,
    place_name: f.place_name ?? null,
    street,
    house_number: house,
    bbox: f.bbox ?? null,
  }
}

/** ---------- Composant ---------- */
export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Saisir une adresse…',
}: Props) {
  const [loading, setLoading] = useState(false)
  const [options, setOptions] = useState<AddressSuggestion[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    const term = value.trim()
    if (!term || term.length < 2) {
      setOptions([])
      setError(null)
      return
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    if (!token) {
      setError('Token Mapbox manquant')
      return
    }

    const ctrl = new AbortController()
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
        url.searchParams.set('country', 'BE')
        url.searchParams.set('language', 'fr')
        url.searchParams.set('limit', '8')
        url.searchParams.set('autocomplete', 'true')
        url.searchParams.set('access_token', token)

        const res = await fetch(url.toString(), { signal: ctrl.signal })
        const json: MbResponse = await res.json()
        const out = (json.features ?? [])
          .map(featureToSuggestion)
          .filter((x): x is AddressSuggestion => Boolean(x))

        if (alive) setOptions(out)
      } catch (e) {
        if (alive) setError('Adresse introuvable')
      } finally {
        if (alive) setLoading(false)
      }
    }

    run()
    return () => { alive = false; ctrl.abort() }
  }, [value])

  return (
    <div className="space-y-2">
      <input
        className="input w-full"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />

      {loading && <div className="text-xs text-neutral-500">Recherche…</div>}
      {error && <div className="text-xs text-red-600">{error}</div>}

      {!loading && !error && options.length > 0 && (
        <div className="rounded-lg border">
          {options.map((opt) => (
            <button
              type="button"
              key={`${opt.lon}-${opt.lat}-${opt.label}`}
              className="block w-full text-left px-3 py-2 border-b last:border-b-0 hover:bg-neutral-50"
              onClick={() => onSelect(opt)}
            >
              <div className="text-sm">{opt.label}</div>
              <div className="text-xs text-neutral-500">
                {[opt.postal_code, opt.city].filter(Boolean).join(' ')}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
