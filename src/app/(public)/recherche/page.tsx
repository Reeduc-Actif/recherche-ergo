'use client'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { useEffect, useMemo, useRef, useState } from 'react'

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
}

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function SearchPage() {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const mapDiv = useRef<HTMLDivElement | null>(null)
    const [center, setCenter] = useState<[number, number]>([4.3517, 50.8503]) // Bruxelles
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)

    // Fetch résultats
    const fetchResults = async (lat?: number, lng?: number) => {
        setLoading(true)
        const res = await fetch('/api/search', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ lat, lng, radius_km: 25 }),
        })
        const json = await res.json()
        setResults(json.results ?? [])
        setLoading(false)
    }

    // Init carte
    useEffect(() => {
        if (mapRef.current || !mapDiv.current) return

        const m = new mapboxgl.Map({
            container: mapDiv.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center,
            zoom: 11,
        })
        mapRef.current = m

        m.addControl(new mapboxgl.NavigationControl(), 'top-right')
        m.addControl(new mapboxgl.GeolocateControl({
            positionOptions: { enableHighAccuracy: true },
            trackUserLocation: false
        }), 'top-right')

        m.on('load', async () => {
            await fetchResults(center[1], center[0])
        })

        return () => m.remove()
    }, [])

    // Marqueurs
    useEffect(() => {
        const m = mapRef.current
        if (!m) return

            // Remove existing markers (we keep a simple approach)
            ; (m as any)._markers?.forEach((mk: mapboxgl.Marker) => mk.remove())
            ; (m as any)._markers = []

        results.forEach((r) => {
            // Pas de coords directes dans la réponse -> on recalcule depuis la distance ? (non)
            // Ici on utilise l’adresse comme popup + city. Les coords sont dans la table, mais la RPC n’expose pas le point.
            // Pour afficher correctement, modifie la RPC si tu veux renvoyer ST_X/ST_Y. Version simple: on recentre la carte sur Bruxelles et affiche la liste.
        })
    }, [results])

    // Version simple : on affiche la liste + bouton pour ouvrir le lien RDV
    const items = useMemo(() => results.map((r) => ({
        key: r.location_id,
        title: r.full_name,
        subtitle: r.headline ?? '',
        address: [r.address, r.postal_code, r.city].filter(Boolean).join(', '),
        booking: r.booking_url ?? undefined,
        km: r.distance_m ? (r.distance_m / 1000).toFixed(1) : undefined,
        slug: r.slug
    })), [results])

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
                                    {it.km && <div className="text-xs text-neutral-500 mt-1">{it.km} km</div>}
                                </div>
                                <div className="flex flex-col gap-2">
                                    {it.booking && (
                                        <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                                            href={it.booking} target="_blank" rel="noreferrer">Prendre RDV</a>
                                    )}
                                    <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                                        href={`/ergo/${it.slug}`}>Voir le profil</a>
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
