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

/** Belgique */
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const BE_BOUNDS: [[number, number], [number, number]] = [[2.5, 49.4], [6.4, 51.6]]
const MAX_BOUNDS: [[number, number], [number, number]] = [[2.0, 49.0], [7.0, 52.2]]
const RADIUS_KM = 300 // plein pays (rayon large pour tout couvrir)

type Mode = 'cabinet' | 'domicile'

type Result = {
  therapist_id: string
  slug: string
  first_name: string
  last_name: string
  booking_url: string | null
  location_id: number
  address: string | null
  city: string | null
  postal_code: string | null
  distance_m: number | null
  lon?: number | null
  lat?: number | null
  languages?: string[] | null
}

type MapboxWithTelemetry = typeof mapboxgl & { setTelemetryEnabled?: (enabled: boolean) => void }
const mb: MapboxWithTelemetry = mapboxgl
if (typeof mb.setTelemetryEnabled === 'function') mb.setTelemetryEnabled(false)

// Hiérarchie des spécialités (inchangé)
const SPECIALTIES = [
  {
    slug: 'pediatrie',
    label: 'Pédiatrie',
    children: [
      { slug: 'troubles-ecriture', label: "Troubles de l’écriture" },
      { slug: 'troubles-calculs', label: 'Troubles des calculs' },
      { slug: 'apprentissage-outils-numeriques', label: 'Apprentissage outils numériques' },
      { slug: 'troubles-autistiques', label: 'Troubles autistiques' },
      { slug: 'psychomotricite-relationnelle', label: 'Psychomotricité relationnelle' },
    ],
  },
  {
    slug: 'adulte',
    label: 'Adulte',
    children: [
      { slug: 'reeducation-adulte', label: 'Rééducation' },
      { slug: 'conseils-amenagement-domicile-adulte', label: 'Conseils en aménagement du domicile' },
      { slug: 'conseils-aide-mobilite-adulte', label: 'Conseils aide à la mobilité' },
      { slug: 'apprentissage-aides-techniques-adulte', label: 'Apprentissage à l’utilisation des aides techniques' },
      { slug: 'apprentissage-transferts-adulte', label: 'Apprentissage aux transferts' },
    ],
  },
  {
    slug: 'geriatrie',
    label: 'Gériatrie',
    children: [
      { slug: 'reeducation-geriatrie', label: 'Rééducation' },
      { slug: 'conseils-amenagement-domicile-geriatrie', label: 'Conseils en aménagement du domicile' },
      { slug: 'conseils-aide-mobilite-geriatrie', label: 'Conseils aide à la mobilité' },
      { slug: 'apprentissage-aides-techniques-geriatrie', label: 'Apprentissage à l’utilisation des aides techniques' },
      { slug: 'apprentissage-transferts-geriatrie', label: 'Apprentissage aux transferts' },
      { slug: 'accompagnement-demence', label: 'Accompagnement démence' },
    ],
  },
]

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

  // --- URL state
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const urlLat = Number(searchParams.get('lat'))
  const urlLng = Number(searchParams.get('lng'))
  const urlMode = (searchParams.get('mode') as Mode) || 'cabinet'

  // Filtres depuis l’URL
  const urlSpecs = (searchParams.get('spec') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const urlLangs = (searchParams.get('langs') || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const [selectedLangs, setSelectedLangs] = useState<string[]>(urlLangs)
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(urlSpecs)
  const [mode, setMode] = useState<Mode>(urlMode === 'domicile' ? 'domicile' : 'cabinet')
  const [selectedCity, setSelectedCity] = useState<string>(searchParams.get('city') || '')

  // Accordéons
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    pediatrie: false,
    adulte: false,
    geriatrie: false,
  })
  const toggleCat = (slug: string) => setOpenCats((prev) => ({ ...prev, [slug]: !prev[slug] }))

  // Helpers URL
  const updateUrl = useCallback(() => {
    const m = mapRef.current
    if (!m) return
    const c = m.getCenter()
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    sp.set('mode', mode)
    sp.set('lat', c.lat.toFixed(6))
    sp.set('lng', c.lng.toFixed(6))
    // on garde le param r=RADIUS_KM pour compat éventuelle
    sp.set('r', String(RADIUS_KM))
    if (selectedSpecs.length) sp.set('spec', selectedSpecs.join(','))
    else sp.delete('spec')
    if (selectedLangs.length) sp.set('langs', selectedLangs.join(','))
    else sp.delete('langs')
    if (selectedCity) sp.set('city', selectedCity)
    else sp.delete('city')
    router.replace(`${pathname}?${sp.toString()}`)
  }, [mode, pathname, router, selectedLangs, selectedSpecs, selectedCity])

  // Fetch résultats (rayon constant plein pays)
  const fetchResults = useCallback(async () => {
    try {
      const m = mapRef.current
      if (!m) return
      setLoading(true)
      const c = m.getCenter()
      const url = new URL('/api/search', window.location.origin)
      url.searchParams.set('mode', mode)
      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          lat: c.lat,
          lng: c.lng,
          radius_km: RADIUS_KM,
          specialties_filter: selectedSpecs.length ? selectedSpecs : undefined,
          languages_filter: selectedLangs.length ? selectedLangs : undefined,
          city: selectedCity || undefined,
        }),
      })
      const json = (await res.json()) as { ok?: boolean; results?: Result[] }
      setResults(json.ok && json.results ? json.results : [])
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [mode, selectedLangs, selectedSpecs, selectedCity])

  // Init carte — une seule fois
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return
    if (!MAPBOX_TOKEN) {
      console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN manquant')
      return
    }
    mapboxgl.accessToken = MAPBOX_TOKEN

    const center: [number, number] =
      Number.isFinite(urlLat) && Number.isFinite(urlLng) ? [urlLng, urlLat] : [4.3517, 50.8503]

    const m = new mapboxgl.Map({
      container: mapDiv.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center,
      zoom: 7,
    })
    mapRef.current = m
    m.setMaxBounds(MAX_BOUNDS)

    m.addControl(new mapboxgl.NavigationControl(), 'top-right')

    m.on('dragstart', () => { userMovedRef.current = true })
    m.on('zoomstart', () => { userMovedRef.current = true })

    m.on('error', (ev: mapboxgl.ErrorEvent | { error?: unknown }) => {
      const err: unknown = 'error' in ev ? ev.error : ev
      console.error('[Mapbox error]', err)
    })

    const onLoad = async () => {
      m.resize()
      const hasUrlCenter = Number.isFinite(urlLat) && Number.isFinite(urlLng)
      if (!hasUrlCenter) {
        ignoreNextMoveRef.current = true
        m.fitBounds(BE_BOUNDS, { padding: 48, duration: 0 })
      }
      await fetchResults()
      updateUrl()
    }

    const onMoveEnd = () => {
      if (ignoreNextMoveRef.current) { ignoreNextMoveRef.current = false; return }
      if (moveTimerRef.current) window.clearTimeout(moveTimerRef.current)
      moveTimerRef.current = window.setTimeout(() => {
        fetchResults()
        updateUrl()
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
  }, []) // init unique

  // Relances quand filtres/langues/mode changent
  useEffect(() => {
    const m = mapRef.current
    if (!m) return
    fetchResults()
    updateUrl()
  }, [selectedSpecs, selectedLangs, mode, fetchResults, updateUrl])

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
        const displayName = r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : 'Ergothérapeute'
        const popupHtml = `
          <div style="font-weight:600;margin-bottom:4px;">${escapeHtml(displayName)}</div>
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
      results.map((r) => {
        const displayName = r.first_name && r.last_name ? `${r.first_name} ${r.last_name}` : 'Ergothérapeute'
        return {
          key: r.location_id,
          title: displayName,
          subtitle: 'Ergothérapeute',
          address: [r.address, r.postal_code, r.city].filter(Boolean).join(', '),
          booking: r.booking_url ?? undefined,
          km: r.distance_m ? (r.distance_m / 1000).toFixed(1) : undefined,
          slug: r.slug,
        }
      }),
    [results],
  )

  return (
    <main className="grid gap-6 md:grid-cols-[360px_1fr]">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Ergothérapeutes en Belgique</h2>

          {/* Toggle mode exclusif */}
          <div className="flex rounded-xl border p-0.5">
            <button
              type="button"
              onClick={() => setMode('cabinet')}
              className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'cabinet' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}
            >
              Au cabinet
            </button>
            <button
              type="button"
              onClick={() => setMode('domicile')}
              className={`px-3 py-1.5 text-sm rounded-lg ${mode === 'domicile' ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}
            >
              À domicile
            </button>
          </div>

        </div>

        {/* Filtres */}
        <div className="rounded-xl border p-3 space-y-3">
          <div className="text-sm font-medium">Filtres</div>

          {/* Champ ville pour mode domicile */}
          {mode === 'domicile' && (
            <div>
              <div className="text-xs text-neutral-500 mb-2">Ville</div>
              <input
                type="text"
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                placeholder="Entrez le nom de votre ville..."
                className="w-full px-3 py-2 border border-neutral-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
              />
            </div>
          )}

          {/* Spécialités */}
          <div className="space-y-2">
            <div className="text-xs text-neutral-500">Spécialités</div>
            <div className="space-y-2">
              {SPECIALTIES.map((cat) => {
                const selectedInCat = cat.children.filter((sub) => selectedSpecs.includes(sub.slug)).length
                return (
                  <div key={cat.slug} className="rounded-lg border">
                    <button
                      type="button"
                      onClick={() => toggleCat(cat.slug)}
                      className="flex w-full items-center justify-between px-3 py-2"
                    >
                      <span className="font-medium">
                        {cat.label}
                        {selectedInCat > 0 && (
                          <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
                            {selectedInCat}
                          </span>
                        )}
                      </span>
                      <span className={`transition-transform ${openCats[cat.slug] ? 'rotate-90' : ''}`} aria-hidden>
                        ▶
                      </span>
                    </button>

                    <div className={`overflow-hidden transition-[max-height] duration-300 ease-in-out ${openCats[cat.slug] ? 'max-h-80' : 'max-h-0'}`}>
                      <div className="flex flex-wrap gap-2 px-3 pb-3">
                        <button
                          type="button"
                          onClick={() => {
                            const allSlugs = cat.children.map((c) => c.slug)
                            const allSelected = allSlugs.every((s) => selectedSpecs.includes(s))
                            setSelectedSpecs((prev) =>
                              allSelected ? prev.filter((s) => !allSlugs.includes(s)) : Array.from(new Set([...prev, ...allSlugs])),
                            )
                          }}
                          className="rounded-lg border px-2 py-1 text-xs hover:bg-neutral-50"
                        >
                          {cat.children.every((s) => selectedSpecs.includes(s.slug)) ? 'Tout désélectionner' : 'Tout sélectionner'}
                        </button>

                        {cat.children.map((sub) => {
                          const checked = selectedSpecs.includes(sub.slug)
                          return (
                            <label key={sub.slug} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) =>
                                  setSelectedSpecs((prev) =>
                                    e.target.checked ? [...prev, sub.slug] : prev.filter((x) => x !== sub.slug),
                                  )
                                }
                              />
                              {sub.label}
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Langues */}
          <LanguagesFilter selectedLangs={selectedLangs} setSelectedLangs={setSelectedLangs} />
        </div>

      </section>

      <section className="space-y-3">
        <div className="text-sm text-neutral-600">
          {loading ? 'Chargement…' : `${items.length} résultat(s)`}
        </div>

        {!loading && items.length === 0 && (
          <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-700">
            {mode === 'domicile' && !selectedCity 
              ? 'Entrez le nom de votre ville dans les filtres pour voir les ergothérapeutes qui s\'y déplacent.'
              : 'Aucun ergothérapeute trouvé. Modifiez les filtres ou déplacez la carte.'
            }
          </div>
        )}

        <ul className="divide-y rounded-xl border">
          {items.map((it) => (
            <li key={it.key} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{it.title}</div>
                  {it.subtitle && <div className="text-sm text-neutral-600">{it.subtitle}</div>}
                  <div className="text-sm text-neutral-600">{it.address}</div>
                  {it.km && <div className="mt-1 text-xs text-neutral-500">{it.km} km</div>}
                </div>
                <div className="flex flex-col gap-2">
                  <a className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href={`/ergo/${it.slug}`}>
                    Voir le profil
                  </a>
                </div>
              </div>
            </li>
          ))}
        </ul>

        {mode === 'cabinet' && (
          <div className="rounded-xl border">
            <div ref={mapDiv} className="h-[400px] min-h-[400px] w-full rounded-xl" />
          </div>
        )}
      </section>
    </main>
  )
}

function LanguagesFilter(props: {
  selectedLangs: string[]
  setSelectedLangs: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { selectedLangs, setSelectedLangs } = props
  const list = [
    { value: 'fr', label: 'Français' },
    { value: 'nl', label: 'Néerlandais' },
    { value: 'de', label: 'Allemand' },
    { value: 'en', label: 'Anglais' },
  ]
  return (
    <div className="space-y-2">
      <div className="text-xs text-neutral-500">Langues</div>
      <div className="flex flex-wrap gap-2">
        {list.map((l) => {
          const checked = selectedLangs.includes(l.value)
          return (
            <label key={l.value} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) =>
                  setSelectedLangs((prev) => (e.target.checked ? [...prev, l.value] : prev.filter((x) => x !== l.value)))
                }
              />
              {l.label}
            </label>
          )
        })}
      </div>
    </div>
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
