'use client'

import { useEffect, useRef, useState } from 'react'

export type AddressSuggestion = {
  label: string
  address: string
  city: string
  postal_code: string
  country: 'BE'
  lon: number
  lat: number
}

export type AddressAutocompleteProps = {
  value: string
  onChange: (v: string) => void
  onSelect: (s: AddressSuggestion) => void
  placeholder?: string
}

type MapboxFeature = {
  place_name: string
  center: [number, number]
  context?: Array<{ id: string; text: string }>
  properties?: Record<string, unknown>
}

export default function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = 'Search an address…',
}: AddressAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<AddressSuggestion[]>([])
  const ref = useRef<HTMLDivElement | null>(null)
  const timer = useRef<number | null>(null)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!ref.current) return
      if (!ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    if (!token) return
    if (timer.current) window.clearTimeout(timer.current)
    const term = value.trim()
    timer.current = window.setTimeout(async () => {
      if (term.length < 3) { setOpts([]); return }
      const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(term)}.json`)
      url.searchParams.set('country', 'BE')
      url.searchParams.set('language', 'fr')
      url.searchParams.set('limit', '8')
      url.searchParams.set('autocomplete', 'true')
      url.searchParams.set('types', 'address,place,locality,neighborhood,postcode,poi')
      url.searchParams.set('access_token', token)

      const res = await fetch(url.toString())
      const json = await res.json() as { features?: MapboxFeature[] }
      const features = json.features ?? []

      const out: AddressSuggestion[] = features.map((f) => {
        const [lon, lat] = f.center
        const ctx = f.context ?? []
        const city = ctx.find(c => c.id.startsWith('place'))?.text
          ?? ctx.find(c => c.id.startsWith('locality'))?.text
          ?? ''
        const postal = ctx.find(c => c.id.startsWith('postcode'))?.text ?? ''
        const label = f.place_name
        const address = label.split(',')[0]?.trim() || label

        return {
          label,
          address,
          city,
          postal_code: postal,
          country: 'BE',
          lon,
          lat,
        }
      })

      setOpts(out)
      setOpen(true)
    }, 300)
    return () => { if (timer.current) window.clearTimeout(timer.current) }
  }, [value, token])

  return (
    <div className="relative" ref={ref}>
      <input
        className="input w-full"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { if (opts.length > 0) setOpen(true) }}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={open}
      />
      {open && opts.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border bg-white shadow">
          {opts.map((s, i) => (
            <button
              key={`${s.lon},${s.lat},${i}`}
              type="button"
              onClick={() => { onSelect(s); setOpen(false) }}
              className="block w-full px-3 py-2 text-left hover:bg-neutral-50"
            >
              <div className="text-sm">{s.label}</div>
              <div className="text-xs text-neutral-500">
                {s.postal_code ? `${s.postal_code} ` : ''}{s.city}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
