'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Address = {
  mapbox_id?: string
  street?: string
  house_number?: string
  postal_code?: string
  city?: string
  country?: string
  lon?: number
  lat?: number
  place_name?: string
  bbox?: number[]
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = 'Saisir une adresse…',
}: {
  value: Address
  onChange: (a: Address) => void
  placeholder?: string
}) {
  const [q, setQ] = useState(value?.place_name ?? '')
  const [opts, setOpts] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const ctrl = useRef<AbortController | null>(null)

  // Requête Mapbox (Belgique uniquement)
  useEffect(() => {
    if (!q || q.trim().length < 3) { setOpts([]); return }
    ctrl.current?.abort()
    const c = new AbortController()
    ctrl.current = c
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`)
    url.searchParams.set('access_token', process.env.NEXT_PUBLIC_MAPBOX_TOKEN || '')
    url.searchParams.set('country', 'BE')
    url.searchParams.set('language', 'fr')
    url.searchParams.set('autocomplete', 'true')
    url.searchParams.set('types', 'address,place,postcode,locality,neighborhood')
    url.searchParams.set('limit', '8')
    fetch(url.toString(), { signal: c.signal })
      .then(r => r.json())
      .then(json => setOpts(Array.isArray(json?.features) ? json.features : []))
      .catch(() => {})
  }, [q])

  const pick = (f: any) => {
    const ctx: Record<string, string> = {}
    ;(f.context || []).forEach((c: any) => { if (c.id && c.text) ctx[c.id.split('.')[0]] = c.text })
    const postal = (f.context || []).find((c: any) => c.id?.startsWith('postcode.'))?.text
    const place = (f.context || []).find((c: any) => c.id?.startsWith('place.'))?.text
    const locality = (f.context || []).find((c: any) => c.id?.startsWith('locality.'))?.text
    const city = f.properties?.locality || locality || place || ctx['place'] || ctx['locality'] || ''
    const street = f.text || f.properties?.street
    const num = f.address || f.properties?.housenumber

    const addr: Address = {
      mapbox_id: f.id,
      street: street || undefined,
      house_number: num || undefined,
      postal_code: postal || f.properties?.postcode || undefined,
      city: city || undefined,
      country: 'BE',
      lon: Array.isArray(f.center) ? Number(f.center[0]) : undefined,
      lat: Array.isArray(f.center) ? Number(f.center[1]) : undefined,
      place_name: f.place_name,
      bbox: Array.isArray(f.bbox) ? f.bbox.map(Number) : undefined,
    }
    onChange(addr)
    setQ(addr.place_name || '')
    setOpen(false)
  }

  return (
    <div className="relative">
      <input
        className="input w-full"
        value={q}
        placeholder={placeholder}
        onChange={(e) => { setQ(e.target.value); setOpen(true) }}
        onFocus={() => setOpen(true)}
      />
      {open && opts.length > 0 && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border bg-white shadow">
          {opts.map((f, i) => (
            <button
              key={f.id || i}
              type="button"
              className="block w-full px-3 py-2 text-left text-sm hover:bg-neutral-50"
              onClick={() => pick(f)}
            >
              {f.place_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
