'use client'

import { useEffect, useRef } from 'react'

export default function MapCard({
  lon,
  lat,
  label,
}: { lon: number; lat: number; label?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  useEffect(() => {
    if (!token) return

    const el = ref.current
    if (!el) return

    let map: import('mapbox-gl').Map | undefined

    ;(async () => {
      const mapboxgl = (await import('mapbox-gl')).default
      mapboxgl.accessToken = token

      // ✅ TS comprend que `el` n'est pas null
      map = new mapboxgl.Map({
        container: el,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [lon, lat],
        zoom: 13,
      })

      const popup = label ? new mapboxgl.Popup({ offset: 12 }).setText(label) : undefined
      new mapboxgl.Marker().setLngLat([lon, lat]).setPopup(popup).addTo(map)
    })()

    // ✅ vrai cleanup de l’effet
    return () => {
      if (map) map.remove()
    }
  }, [lon, lat, token, label])

  if (!token) {
    return (
      <div className="rounded-2xl border p-6 text-sm text-neutral-600">
        Carte indisponible (token Mapbox manquant).
      </div>
    )
  }

  return <div ref={ref} className="h-64 w-full rounded-2xl border" />
}
