'use client'
import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!

export default function OnboardingLocation() {
    const mapDiv = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const markerRef = useRef<mapboxgl.Marker | null>(null)
    const [latlng, setLatLng] = useState<{ lat: number; lng: number }>({ lat: 50.8503, lng: 4.3517 })

    useEffect(() => {
        if (!mapDiv.current || mapRef.current) return
        const initial = { lat: 50.8503, lng: 4.3517 } // centre d’amorçage uniquement

        const m = new mapboxgl.Map({
            container: mapDiv.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [initial.lng, initial.lat],
            zoom: 12,
        })
        mapRef.current = m

        const mk = new mapboxgl.Marker({ color: 'red', draggable: true })
            .setLngLat([initial.lng, initial.lat])
            .addTo(m)
        markerRef.current = mk

        mk.on('dragend', () => {
            const p = mk.getLngLat()
            setLatLng({ lat: p.lat, lng: p.lng })
        })

        return () => m.remove()
    }, [])

    const save = async () => {
        await fetch('/api/therapists/me/locations', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({
                address: (document.getElementById('addr') as HTMLInputElement).value,
                city: (document.getElementById('city') as HTMLInputElement).value,
                postal_code: (document.getElementById('zip') as HTMLInputElement).value,
                country: 'BE',
                modes: ['cabinet'],
                lat: latlng.lat,
                lng: latlng.lng,
            }),
        })
        // ensuite step suivante
    }

    return (
        <div className="grid gap-4">
            <div className="grid gap-2">
                <input id="addr" className="border rounded p-2" placeholder="Adresse" />
                <div className="flex gap-2">
                    <input id="zip" className="border rounded p-2 flex-1" placeholder="Code postal" />
                    <input id="city" className="border rounded p-2 flex-1" placeholder="Ville" />
                </div>
            </div>
            <div ref={mapDiv} className="h-72 w-full rounded border" />
            <div className="text-sm text-neutral-600">Lat: {latlng.lat.toFixed(5)} / Lng: {latlng.lng.toFixed(5)}</div>
            <button onClick={save} className="rounded border px-4 py-2">Enregistrer l’adresse</button>
        </div>
    )
}
