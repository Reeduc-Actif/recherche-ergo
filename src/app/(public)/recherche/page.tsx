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
const MAX_R = 300
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

// Catalogues (⚠️ assure-toi que les slugs existent côté DB)
const SPECIALTIES = [
    { slug: 'neuro', label: 'Neuro' },
    { slug: 'pediatrie', label: 'Pédiatrie' },
    { slug: 'geriatrie', label: 'Gériatrie' },
    { slug: 'main', label: 'Main' },
    { slug: 'douleur', label: 'Douleur' },
]
const MODES = [
    { value: 'cabinet', label: 'Au cabinet' },
    { value: 'domicile', label: 'À domicile' },
    { value: 'visio', label: 'En visio' },
]

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
    const [results, setResults] = useState<Result[]>([])
    const [loading, setLoading] = useState(false)

    // debouncing + anti-boucle (fitBounds/easeTo → moveend)
    const moveTimerRef = useRef<number | null>(null)
    const ignoreNextMoveRef = useRef(false)
    const userMovedRef = useRef(false)

    // pin utilisateur/domicile
    const userMarkerRef = useRef<mapboxgl.Marker | null>(null)

    // --- URL state
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()

    const urlLat = Number(searchParams.get('lat'))
    const urlLng = Number(searchParams.get('lng'))
    const urlR = Number(searchParams.get('r'))

    // Filtres depuis l’URL
    const urlSpecs = (searchParams.get('spec') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    const urlModes = (searchParams.get('modes') || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

    // Centre initial en ref (pas de rerun de l’effet d’init)
    const initialCenterRef = useRef<[number, number]>(
        Number.isFinite(urlLat) && Number.isFinite(urlLng) ? [urlLng, urlLat] : INITIAL_CENTER,
    )

    const [radiusKm, setRadiusKm] = useState<number>(
        Number.isFinite(urlR) ? clamp(Math.round(urlR), MIN_R, MAX_R) : DEFAULT_RADIUS_KM,
    )
    const radiusRef = useRef(radiusKm)
    useEffect(() => { radiusRef.current = radiusKm }, [radiusKm])

    const [selectedSpecs, setSelectedSpecs] = useState<string[]>(urlSpecs)
    const [selectedModes, setSelectedModes] = useState<string[]>(urlModes)

    // Helpers URL
    const updateUrl = useCallback(
        (lat: number, lng: number, r: number, specs = selectedSpecs, modes = selectedModes) => {
            const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
            sp.set('lat', lat.toFixed(6))
            sp.set('lng', lng.toFixed(6))
            sp.set('r', String(r))
            if (specs.length) sp.set('spec', specs.join(','))
            else sp.delete('spec')
            if (modes.length) sp.set('modes', modes.join(','))
            else sp.delete('modes')
            router.replace(`${pathname}?${sp.toString()}`)
        },
        [pathname, router, selectedModes, selectedSpecs],
    )

    // Fetch résultats
    const fetchResults = useCallback(
        async (lat?: number, lng?: number, r: number = radiusRef.current, specs = selectedSpecs, modes = selectedModes) => {
            try {
                setLoading(true)
                const res = await fetch('/api/search', {
                    method: 'POST',
                    headers: { 'content-type': 'application/json' },
                    body: JSON.stringify({
                        lat,
                        lng,
                        radius_km: r,
                        specialties_filter: specs.length ? specs : undefined,
                        modes_filter: modes.length ? modes : undefined,
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
        [selectedModes, selectedSpecs],
    )

    // Pin utilisateur (DOM rouge + halo)
    const placeUserMarker = useCallback((lat: number, lng: number) => {
        const m = mapRef.current
        if (!m) return
        if (userMarkerRef.current) userMarkerRef.current.remove()

        const el = document.createElement('div')
        el.style.width = '18px'
        el.style.height = '18px'
        el.style.borderRadius = '50%'
        el.style.background = '#e11d48'
        el.style.boxShadow = '0 0 0 3px #fff, 0 0 0 6px rgba(225,29,72,.35)'
        el.style.border = '2px solid #fff'

        userMarkerRef.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
            .setLngLat([lng, lat])
            .setPopup(new mapboxgl.Popup({ offset: 10 }).setText('Votre position'))
            .addTo(m)
    }, [])

    const useMyLocation = useCallback(() => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords
                const m = mapRef.current
                if (!m) return
                try {
                    localStorage.setItem('homeLat', String(latitude))
                    localStorage.setItem('homeLng', String(longitude))
                } catch { }
                placeUserMarker(latitude, longitude)
                userMovedRef.current = false
                ignoreNextMoveRef.current = true
                m.easeTo({ center: [longitude, latitude], zoom: 12, duration: 600 })
                fetchResults(latitude, longitude, radiusRef.current)
                updateUrl(latitude, longitude, radiusRef.current)
            },
            () => { },
            { enableHighAccuracy: true, timeout: 8000 },
        )
    }, [fetchResults, placeUserMarker, updateUrl])

    const setHomeHere = useCallback(() => {
        const m = mapRef.current
        if (!m) return
        const c = m.getCenter()
        try {
            localStorage.setItem('homeLat', String(c.lat))
            localStorage.setItem('homeLng', String(c.lng))
        } catch { }
        placeUserMarker(c.lat, c.lng)
    }, [placeUserMarker])

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

        // marquer le premier geste utilisateur
        m.on('dragstart', () => { userMovedRef.current = true })
        m.on('zoomstart', () => { userMovedRef.current = true })

        m.on('error', (ev: unknown) => {
            const err = (ev as { error?: unknown })?.error ?? ev
            console.error('[Mapbox error]', err)
        })

        // Charger un domicile (URL ou localStorage)
        const maybePlaceHome = () => {
            const homeLatStr = searchParams.get('home_lat') ?? (typeof window !== 'undefined' ? localStorage.getItem('homeLat') : null)
            const homeLngStr = searchParams.get('home_lng') ?? (typeof window !== 'undefined' ? localStorage.getItem('homeLng') : null)
            const hLat = homeLatStr ? Number(homeLatStr) : NaN
            const hLng = homeLngStr ? Number(homeLngStr) : NaN
            if (Number.isFinite(hLat) && Number.isFinite(hLng)) {
                placeUserMarker(hLat, hLng)
            }
        }

        const onLoad = async () => {
            m.resize()
            maybePlaceHome()
            const c = m.getCenter()
            await fetchResults(c.lat, c.lng, radiusRef.current)
            updateUrl(c.lat, c.lng, radiusRef.current)
        }

        const onMoveEnd = () => {
            if (ignoreNextMoveRef.current) {
                ignoreNextMoveRef.current = false
                return
            }
            // debounce 300ms
            if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current)
            moveTimerRef.current = window.setTimeout(() => {
                const c = m.getCenter()
                fetchResults(c.lat, c.lng, radiusRef.current)
                updateUrl(c.lat, c.lng, radiusRef.current)
            }, 300)
        }

        m.on('load', onLoad)
        m.on('moveend', onMoveEnd)

        return () => {
            m.off('load', onLoad)
            m.off('moveend', onMoveEnd)
            if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current)
            m.remove()
            mapRef.current = null
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []) // pas de re-création → la carte ne "disparaît" plus

    // Rayon changé → relance
    useEffect(() => {
        const m = mapRef.current
        if (!m) return
        userMovedRef.current = false
        const c = m.getCenter()
        fetchResults(c.lat, c.lng, radiusKm)
        updateUrl(c.lat, c.lng, radiusKm)
    }, [radiusKm, fetchResults, updateUrl])

    // Filtres changés → relance (et maj URL)
    useEffect(() => {
        const m = mapRef.current
        if (!m) return
        const c = m.getCenter()
        fetchResults(c.lat, c.lng, radiusRef.current, selectedSpecs, selectedModes)
        updateUrl(c.lat, c.lng, radiusRef.current, selectedSpecs, selectedModes)
    }, [selectedSpecs, selectedModes, fetchResults, updateUrl])

    // Marqueurs + popups + fitBounds (auto-fit si l’utilisateur n’a pas bougé)
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

        if (!userMovedRef.current) {
            if (count >= 2) {
                ignoreNextMoveRef.current = true
                m.fitBounds(bounds, { padding: 48, maxZoom: 12, duration: 600 })
            } else if (count === 1) {
                const c = bounds.getCenter()
                ignoreNextMoveRef.current = true
                m.easeTo({ center: c, zoom: 12, duration: 600 })
            }
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

    return (
        <main className="grid gap-6 md:grid-cols-[360px_1fr]">
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
                        <button
                            onClick={setHomeHere}
                            className="rounded-lg border px-3 py-1.5 text-sm hover:bg-neutral-50"
                            type="button"
                        >
                            📍 Définir mon domicile ici
                        </button>
                    </div>
                </div>

                {/* Filtres */}
                <div className="rounded-xl border p-3 space-y-3">
                    <div className="text-sm font-medium">Filtres</div>
                    <div className="space-y-2">
                        <div className="text-xs text-neutral-500">Spécialités</div>
                        <div className="flex flex-wrap gap-2">
                            {SPECIALTIES.map((s) => {
                                const checked = selectedSpecs.includes(s.slug)
                                return (
                                    <label key={s.slug} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) =>
                                                setSelectedSpecs((prev) =>
                                                    e.target.checked ? [...prev, s.slug] : prev.filter((x) => x !== s.slug),
                                                )
                                            }
                                        />
                                        {s.label}
                                    </label>
                                )
                            })}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-xs text-neutral-500">Modes</div>
                        <div className="flex flex-wrap gap-2">
                            {MODES.map((m) => {
                                const checked = selectedModes.includes(m.value)
                                return (
                                    <label key={m.value} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                                        <input
                                            type="checkbox"
                                            checked={checked}
                                            onChange={(e) =>
                                                setSelectedModes((prev) =>
                                                    e.target.checked ? [...prev, m.value] : prev.filter((x) => x !== m.value),
                                                )
                                            }
                                        />
                                        {m.label}
                                    </label>
                                )
                            })}
                        </div>
                    </div>

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

                <div className="text-sm text-neutral-600">
                    {loading ? 'Chargement…' : `${items.length} résultat(s)`}
                </div>

                {!loading && items.length === 0 && (
                    <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-700">
                        Aucun ergothérapeute trouvé. Essayez un autre rayon, déplacez la carte ou modifiez les filtres.
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
                <div ref={mapDiv} className="h-[560px] min-h-[560px] w-full rounded-xl" />
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
