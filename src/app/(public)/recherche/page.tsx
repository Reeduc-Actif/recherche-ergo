'use client'
export const dynamic = 'force-dynamic'

import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type React from 'react'
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

type MapboxWithTelemetry = typeof mapboxgl & { setTelemetryEnabled?: (enabled: boolean) => void }
const mb: MapboxWithTelemetry = mapboxgl
if (typeof mb.setTelemetryEnabled === 'function') mb.setTelemetryEnabled(false)

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
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)

    // état "zone sale" → bouton "Chercher dans cette zone"
    const [isDirty, setIsDirty] = useState(false)
    const suppressDirtyRef = useRef(false) // ne pas afficher le bouton lors des moves programmatiques

    // --- URL state
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const urlLat = Number(searchParams.get('lat'))
    const urlLng = Number(searchParams.get('lng'))
    const urlR = Number(searchParams.get('r'))

    // Centre initial en ref (pour éviter de ré-initialiser la carte)
    const initialCenterRef = useRef<[number, number]>(
        Number.isFinite(urlLat) && Number.isFinite(urlLng) ? [urlLng, urlLat] : INITIAL_CENTER,
    )

    const [radiusKm, setRadiusKm] = useState<number>(
        Number.isFinite(urlR) ? clamp(Math.round(urlR), MIN_R, MAX_R) : DEFAULT_RADIUS_KM,
    )
    const radiusRef = useRef(radiusKm)
    useEffect(() => {
        radiusRef.current = radiusKm
    }, [radiusKm])

    // Filtres
    const [modesFilter, setModesFilter] = useState<string[]>([])
    const [specFilter, setSpecFilter] = useState<string[]>([])

    // Helpers URL (stable)
    const updateUrl = useCallback(
        (lat: number, lng: number, r: number) => {
            const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
            sp.set('lat', lat.toFixed(6))
            sp.set('lng', lng.toFixed(6))
            sp.set('r', String(r))
            router.replace(`${pathname}?${sp.toString()}`)
        },
        [pathname, router],
    )

    // Fetch résultats (stable)
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
                        specialties_filter: specFilter.length ? specFilter : undefined,
                        modes_filter: modesFilter.length ? modesFilter : undefined,
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
        [modesFilter, specFilter],
    )

    // Utilitaire: placer/mettre à jour le pin utilisateur (domicile / position)
    const placeUserMarker = useCallback((lat: number, lng: number) => {
        const m = mapRef.current
        if (!m) return
        if (userMarkerRef.current) userMarkerRef.current.remove()
        userMarkerRef.current = new mapboxgl.Marker({ color: '#d32f2f' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 10 }).setText('Vous êtes ici'))
            .addTo(m)
    }, [])

    // Init carte — une seule fois
    useEffect(() => {
        if (!mapDiv.current || mapRef.current) return
        if (!MAPBOX_TOKEN) {
            console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN manquant')
            return
        }
        mapboxgl.accessToken = MAPBOX_TOKEN

        const m = new mapboxgl.Map({
            container: mapDiv.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: initialCenterRef.current,
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

        // Marquer la carte "sale" uniquement quand l’utilisateur bouge
        const markDirty = () => {
            if (suppressDirtyRef.current) {
                suppressDirtyRef.current = false
                return
            }
            setIsDirty(true)
        }
        m.on('dragend', markDirty)
        m.on('zoomend', markDirty)

        // Erreurs Mapbox
        m.on('error', (ev: mapboxgl.ErrorEvent) => {
            console.error('[Mapbox error]', ev?.error || ev)
        })

        // Au chargement: 1er fetch + pin domicile si dispo
        const onLoad = async () => {
            m.resize()
            // Domicile via URL ?home_lat&home_lng ou via localStorage 'homeLat'/'homeLng'
            let homeLat = Number(searchParams.get('home_lat'))
            let homeLng = Number(searchParams.get('home_lng'))
            if (!Number.isFinite(homeLat) || !Number.isFinite(homeLng)) {
                try {
                    const lsLat = Number(localStorage.getItem('homeLat') || '')
                    const lsLng = Number(localStorage.getItem('homeLng') || '')
                    if (Number.isFinite(lsLat) && Number.isFinite(lsLng)) {
                        homeLat = lsLat
                        homeLng = lsLng
                    }
                } catch {
                    // ignore
                }
            }
            if (Number.isFinite(homeLat) && Number.isFinite(homeLng)) {
                placeUserMarker(homeLat as number, homeLng as number)
            }

            const c = m.getCenter()
            await fetchResults(c.lat, c.lng, radiusRef.current)
            updateUrl(c.lat, c.lng, radiusRef.current)
            setIsDirty(false)
        }

        m.on('load', onLoad)

        return () => {
            m.off('dragend', markDirty)
            m.off('zoomend', markDirty)
            m.off('load', onLoad)
            m.remove()
            mapRef.current = null
            userMarkerRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [fetchResults, placeUserMarker, updateUrl]) // callbacks stables

    // Si le rayon change → on ne bouge pas la carte, on refetch directement
    useEffect(() => {
        const m = mapRef.current
        if (!m) return
        const c = m.getCenter()
        fetchResults(c.lat, c.lng, radiusKm)
        updateUrl(c.lat, c.lng, radiusKm)
        setIsDirty(false)
    }, [radiusKm, fetchResults, updateUrl])

    // Si les filtres changent → refetch immédiat au centre courant
    useEffect(() => {
        const m = mapRef.current
        if (!m) return
        const c = m.getCenter()
        fetchResults(c.lat, c.lng, radiusRef.current)
        updateUrl(c.lat, c.lng, radiusRef.current)
        setIsDirty(false)
    }, [modesFilter, specFilter, fetchResults, updateUrl])

    // Marqueurs + popups (plus d’auto-fit agressif)
    useEffect(() => {
        const m = mapRef.current
        if (!m) return

        markersRef.current.forEach((mk) => mk.remove())
        markersRef.current = []

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
            }
        })
    }, [results])

    // “Utiliser ma position” → centre + fetch + pin rouge
    const useMyLocation = useCallback(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                const m = mapRef.current
                if (!m) return
                placeUserMarker(latitude, longitude)
                suppressDirtyRef.current = true
                m.easeTo({ center: [longitude, latitude], zoom: 12, duration: 600 })
                fetchResults(latitude, longitude, radiusRef.current)
                updateUrl(latitude, longitude, radiusRef.current)
                setIsDirty(false)
            },
            () => { /* ignore */ },
            { enableHighAccuracy: true, timeout: 8000 },
        )
    }, [fetchResults, placeUserMarker, updateUrl])

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

    // Options de filtres (exemples)
    const ALL_MODES = ['cabinet', 'domicile', 'visio'] as const
    const ALL_SPECS: { slug: string; label: string }[] = [
        { slug: 'pediatrie', label: 'Pédiatrie' },
        { slug: 'neuro', label: 'Neurologie' },
        { slug: 'geriatrie', label: 'Gériatrie' },
        { slug: 'main', label: 'Main/Membre sup.' },
    ]

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
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRadiusKm(Number(e.target.value))}
                            />
                            <span className="w-10 text-right">{radiusKm} km</span>
                        </div>
                    </div>
                </div>

                {/* Filtres */}
                <div className="flex flex-col gap-2 rounded-lg border p-3 text-sm">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium">Modes</span>
                        {ALL_MODES.map((m) => (
                            <label key={m} className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={modesFilter.includes(m)}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setModesFilter((prev) => e.target.checked ? [...prev, m] : prev.filter((x) => x !== m))
                                    }
                                />
                                {m}
                            </label>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <span className="font-medium">Spécialités</span>
                        {ALL_SPECS.map((s) => (
                            <label key={s.slug} className="flex items-center gap-1">
                                <input
                                    type="checkbox"
                                    checked={specFilter.includes(s.slug)}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                        setSpecFilter((prev) => e.target.checked ? [...prev, s.slug] : prev.filter((x) => x !== s.slug))
                                    }
                                />
                                {s.label}
                            </label>
                        ))}
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

            <section className="relative rounded-xl border">
                {isDirty && (
                    <button
                        type="button"
                        onClick={async () => {
                            const m = mapRef.current
                            if (!m) return
                            const c = m.getCenter()
                            await fetchResults(c.lat, c.lng, radiusRef.current)
                            updateUrl(c.lat, c.lng, radiusRef.current)
                            setIsDirty(false)
                        }}
                        className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border bg-white px-4 py-2 text-sm shadow"
                    >
                        Chercher dans cette zone
                    </button>
                )}
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
