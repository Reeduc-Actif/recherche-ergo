'use client'
export const dynamic = 'force-dynamic'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import {
    Suspense,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

/** Centre par défaut : Bruxelles [lng, lat] */
const INITIAL_CENTER: [number, number] = [4.3517, 50.8503]
const DEFAULT_RADIUS_KM = 25
const MIN_R = 5
const MAX_R = 50
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

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

type MapboxWithTelemetry = typeof mapboxgl & {
    setTelemetryEnabled?: (enabled: boolean) => void
}
const mb: MapboxWithTelemetry = mapboxgl
if (typeof mb.setTelemetryEnabled === 'function') {
    mb.setTelemetryEnabled(false)
}

/**
 * Page exportée : on met l'intérieur dans une <Suspense> pour satisfaire Next
 * quand on utilise useSearchParams/useRouter dans un composant client.
 */
export default function SearchPage() {
    return (
        <Suspense fallback={<div className="p-6 text-sm text-neutral-600">Chargement…</div>}>
            <SearchPageInner />
        </Suspense>
    )
}

function SearchPageInner() {
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const mapDiv = useRef<HTMLDivElement | null>(null)
    const markersRef = useRef<mapboxgl.Marker[]>([])
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)

    // --- URL state
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const urlLat = Number(searchParams.get('lat'))
    const urlLng = Number(searchParams.get('lng'))
    const urlR = Number(searchParams.get('r'))

    // ⚠️ Memo pour stabiliser la dépendance
    const initialCenter = useMemo<[number, number]>(() => {
        return Number.isFinite(urlLat) && Number.isFinite(urlLng)
            ? [urlLng, urlLat]
            : INITIAL_CENTER
    }, [urlLat, urlLng])

    const [radiusKm, setRadiusKm] = useState<number>(
        Number.isFinite(urlR) ? clamp(Math.round(urlR), MIN_R, MAX_R) : DEFAULT_RADIUS_KM,
    )
    const radiusRef = useRef(radiusKm)
    useEffect(() => {
        radiusRef.current = radiusKm
    }, [radiusKm])

    // Helpers URL
    const updateUrl = useCallback(
        (lat: number, lng: number, r: number) => {
            const sp = new URLSearchParams(Array.from(searchParams.entries()))
            sp.set('lat', lat.toFixed(6))
            sp.set('lng', lng.toFixed(6))
            sp.set('r', String(r))
            router.replace(`${pathname}?${sp.toString()}`)
        },
        [pathname, router, searchParams],
    )

    // Fetch résultats
    const fetchResults = useCallback(
        async (lat?: number, lng?: number, r: number = radiusRef.current) => {
            try {
                setLoading(true)
                const res = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        lat,
                        lng,
                        radius_km: r,
                        // specialties_filter / modes_filter à brancher ici plus tard
                    }),
                })
                const json = (await res.json()) as { ok?: boolean; results?: Result[] }
                setResults(json.ok && json.results ? json.results : [])
            } catch {
                setResults([])
            } finally {
                setLoading(false)
            }
        },
        [],
    )

    // Init carte
    useEffect(() => {
        if (mapRef.current || !mapDiv.current) return

        // 0) Vérif du token côté client
        if (!MAPBOX_TOKEN) {
            console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN manquant')
            return
        }
        mapboxgl.accessToken = MAPBOX_TOKEN

        // 1) Créer la carte
        let destroyed = false
        const m = new mapboxgl.Map({
            container: mapDiv.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialCenter,
            zoom: 11,
        })
        mapRef.current = m

        // 2) Contrôles + écoute des erreurs (utile pour débug)
        m.addControl(new mapboxgl.NavigationControl(), 'top-right')
        m.addControl(
            new mapboxgl.GeolocateControl({
                positionOptions: { enableHighAccuracy: true },
                trackUserLocation: false,
            }),
            'top-right',
        )
        m.on('error', (e) => {
            console.error('[Mapbox error]', e?.error || e)
        })

        // 3) S’assurer que la carte se dessine bien
        const onLoad = async () => {
            if (destroyed) return
            // Petit resize pour forcer le rendu si le container vient d’apparaître
            m.resize()
            await fetchResults(m.getCenter().lat, m.getCenter().lng, radiusRef.current)
            updateUrl(m.getCenter().lat, m.getCenter().lng, radiusRef.current)
        }
        m.on('load', onLoad)

        // 4) Déplacements => nouvelle recherche
        const onMoveEnd = () => {
            const c = m.getCenter()
            fetchResults(c.lat, c.lng, radiusRef.current)
            updateUrl(c.lat, c.lng, radiusRef.current)
        }
        m.on('moveend', onMoveEnd)

        // 5) Nettoyage
        return () => {
            destroyed = true
            m.off('load', onLoad)
            m.off('moveend', onMoveEnd)
            m.remove()
        }
    }, [fetchResults, initialCenter, updateUrl])

    // Si on change le rayon → relancer
    useEffect(() => {
        const m = mapRef.current
        if (!m) return
        const c = m.getCenter()
        fetchResults(c.lat, c.lng, radiusKm)
        updateUrl(c.lat, c.lng, radiusKm)
    }, [radiusKm, fetchResults, updateUrl])

    // Marqueurs + popups + fitBounds
    useEffect(() => {
        const m = mapRef.current
        if (!m) return

        markersRef.current.forEach((mk) => mk.remove())
        markersRef.current = []

        const bounds = new mapboxgl.LngLatBounds()
        let count = 0

        results.forEach((r) => {
            if (r.lon != null && r.lat != null) {
                const lngLat: [number, number] = [r.lon, r.lat]
                const popupHtml = `
          <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(r.full_name)}</div>
          <div style="font-size:12px;color:#555;margin-bottom:6px;">
            ${escapeHtml([r.address, r.postal_code, r.city].filter(Boolean).join(', '))}
          </div>
          <div style="display:flex;gap:6px;">
            ${r.booking_url ? `<a href="${escapeAttr(r.booking_url)}" target="_blank" rel="noreferrer" style="font-size:12px;text-decoration:underline;">Prendre RDV</a>` : ''}
            <a href="/ergo/${escapeAttr(r.slug)}" style="font-size:12px;text-decoration:underline;">Voir le profil</a>
          </div>
        `
                const mk = new mapboxgl.Marker()
                    .setLngLat(lngLat)
                    .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML(popupHtml))
                    .addTo(m)

                markersRef.current.push(mk)
                bounds.extend(lngLat)
                count++
            }
        })

        if (count >= 2) {
            m.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 600 })
        } else if (count === 1) {
            const c = bounds.getCenter()
            m.easeTo({ center: c, zoom: 12, duration: 600 })
        }
    }, [results])

    // Liste
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

    // “Utiliser ma position”
    const useMyLocation = useCallback(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                const m = mapRef.current
                if (!m) return
                m.easeTo({ center: [longitude, latitude], zoom: 12, duration: 600 })
                fetchResults(latitude, longitude, radiusRef.current)
                updateUrl(latitude, longitude, radiusRef.current)
            },
            () => { },
            { enableHighAccuracy: true, timeout: 8000 },
        )
    }, [fetchResults, updateUrl])

    return (
        <main className="grid gap-6 md:grid-cols-2">
            <section className="space-y-3">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold">Ergothérapeutes à proximité</h2>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={useMyLocation}
                            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
                            type="button"
                        >
                            🧭 Utiliser ma position
                        </button>
                        <div className="flex items-center gap-2 text-sm">
                            <label htmlFor="radius">Rayon</label>
                            <input
                                id="radius"
                                type="range"
                                min={MIN_R}
                                max={MAX_R}
                                step={5}
                                value={radiusKm}
                                onChange={(e) => setRadiusKm(Number(e.target.value))}
                            />
                            <span className="w-10 text-right">{radiusKm} km</span>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-neutral-600">
                    {loading ? 'Chargement…' : `${items.length} résultat(s)`}
                </div>

                {!loading && items.length === 0 && (
                    <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-700">
                        Aucun ergothérapeute trouvé dans ce rayon. Essayez d’élargir la zone
                        ou de déplacer la carte.
                    </div>
                )}

                <ul className="divide-y rounded-xl border">
                    {items.map((it) => (
                        <li key={it.key} className="p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <div className="font-medium">{it.title}</div>
                                    {it.subtitle && (
                                        <div className="text-sm text-neutral-600">{it.subtitle}</div>
                                    )}
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
                <div ref={mapDiv} className="h-[520px] min-h-[520px] w-full rounded-xl" />
            </section>
        </main>
    )
}

/** Utilitaires */
function escapeHtml(input: string) {
    return input
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}
function escapeAttr(input: string) {
    return escapeHtml(input)
}
function clamp(n: number, a: number, b: number) {
    return Math.max(a, Math.min(b, n))
}
