// src/app/(public)/recherche/page.tsx
'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'

/** Centre par défaut : Bruxelles */
const INITIAL_CENTER: [number, number] = [4.3517, 50.8503]

type Result = {
    therapist_id: string
    slug: string
    full_name: string
    headline: string | null
    booking_url: string | null
    location_id: number
    address: string | null
    city: string | null
    postal_code: string | null
    modes: string[] | null
    distance_m: number | null
    lon?: number | null
    lat?: number | null
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function SearchPage() {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const mapDiv = useRef<HTMLDivElement | null>(null)
    const markersRef = useRef<mapboxgl.Marker[]>([])
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)

    // Fetch résultats
    const fetchResults = async (lat?: number, lng?: number) => {
        try {
            setLoading(true)
            const res = await fetch('/api/search', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ lat, lng, radius_km: 25 }),
            })
            const json = (await res.json()) as { results?: Result[] }
            setResults(json.results ?? [])
        } catch {
            setResults([])
        } finally {
            setLoading(false)
        }
    }

    // Init carte
    useEffect(() => {
        if (mapRef.current || !mapDiv.current) return

        const m = new mapboxgl.Map({
            container: mapDiv.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: INITIAL_CENTER,
            zoom: 11,
        })
        mapRef.current = m

        m.addControl(new mapboxgl.NavigationControl(), 'top-right')
        m.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: false,
            }),
            'top-right',
        )

        m.on('load', async () => {
            await fetchResults(INITIAL_CENTER[1], INITIAL_CENTER[0])
        })

        return () => m.remove()
    }, [])

    // Marqueurs (sans "any")
    useEffect(() => {
        const m = mapRef.current
        if (!m) return

        markersRef.current.forEach((mk) => mk.remove())
        markersRef.current = []

        const bounds = new mapboxgl.LngLatBounds()
        let count = 0

        results.forEach((r) => {
            if (r.lon != null && r.lat != null) {
                const mk = new mapboxgl.Marker()
                    .setLngLat([r.lon, r.lat])
                    .setPopup(
                        new mapboxgl.Popup().setHTML(
                            `<strong>${r.full_name}</strong><br/>${[r.address, r.postal_code, r.city]
                                .filter(Boolean)
                                .join(', ')}`,
                        ),
                    )
                    .addTo(m)
                markersRef.current.push(mk)
                bounds.extend([r.lon, r.lat])
                count++
            }
        })

        if (count > 0) {
            m.fitBounds(bounds, { padding: 40, maxZoom: 12, duration: 0 })
        }
    }, [results])

    // Liste affichée à gauche
    const items = useMemo(
        () =>
            results.map((r) => ({
                key: r.location_id,
                title: r.full_name,
                subtitle: r.headline ?? '',
                address: [r.address, r.postal_code, r.city].filter(Boolean).join(', '),
                booking: r.booking_url ?? undefined,
                km: r.distance_m ? (r.distance_m / 1000).toFixed(1) : undefined,
                slug: r.slug,
            })),
        [results],
    )

    return (
        <main className="grid gap-6 md:grid-cols-2">
            <section className="space-y-3">
                <h2 className="text-2xl font-semibold">Ergothérapeutes à proximité</h2>
                <div className="text-sm text-neutral-600">
                    {loading ? 'Chargement…' : `${items.length} résultat(s)`}
                </div>
                <ul className="divide-y rounded-xl border">
                    {items.map((it) => (
                        <li key={it.key} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    <div className="text-sm text-neutral-600">{it.subtitle}</div>
                                    <div className="text-sm text-neutral-600">{it.address}</div>
                                    {it.km && (
                                        <div className="mt-1 text-xs text-neutral-500">{it.km} km</div>
                                    )}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {it.booking && (
                                        <a
                                            className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                                            href={it.booking}
                                            target="_blank"
                                            rel="noreferrer"
                                        >
                                            Prendre RDV
                                        </a>
                                    )}
                                    <a
                                        className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                                        href={`/ergo/${it.slug}`}
                                    >
                                        Voir le profil
                                    </a>
                                </div>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="rounded-xl border">
                <div ref={mapDiv} className="h-[520px] w-full rounded-xl" />
            </section>
        </main>
    )
}
