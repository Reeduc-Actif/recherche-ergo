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
const INITIAL_CENTER: [number, number] = [4.3517, 50.8503]
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const BE_BOUNDS: [[number, number], [number, number]] = [[2.5, 49.4], [6.4, 51.6]]
const MAX_BOUNDS: [[number, number], [number, number]] = [[2.0, 49.0], [7.0, 52.2]]

type Mode = 'cabinet' | 'domicile'

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
  languages?: string[] | null
}

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

const LANGUAGES = [
  { value: 'fr', label: 'Français' },
  { value: 'nl', label: 'Néerlandais' },
  { value: 'de', label: 'Allemand' },
  { value: 'en', label: 'Anglais' },
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

  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  // mode par URL, défaut: cabinet
  const urlMode = (searchParams.get('mode') as Mode) || 'cabinet'
  const urlSpecs = (searchParams.get('spec') || '').split(',').map(s => s.trim()).filter(Boolean)
  const urlLangs = (searchParams.get('langs') || '').split(',').map(s => s.trim()).filter(Boolean)

  const [selectedLangs, setSelectedLangs] = useState<string[]>(urlLangs)
  const [selectedSpecs, setSelectedSpecs] = useState<string[]>(urlSpecs)
  const [mode, setMode] = useState<Mode>(urlMode === 'domicile' ? 'domicile' : 'cabinet')

  const updateUrl = useCallback(() => {
    const m = mapRef.current
    if (!m) return
    const c = m.getCenter()
    const sp = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
    sp.set('mode', mode)
    sp.set('lat', c.lat.toFixed(6))
    sp.set('lng', c.lng.toFixed(6))
    sp.set('r', String(radiusRef.current))
    if (selectedSpecs.length) sp.set('spec', selectedSpecs.join(','))
    else sp.delete('spec')
    if (selectedLangs.length) sp.set('langs', selectedLangs.join(','))
    else sp.delete('langs')
    router.replace(`${pathname}?${sp.toString()}`)
  }, [mode, pathname, router, selectedLangs, selectedSpecs])

  // Fetch résultats
  const fetchResults = useCallback(
    async () => {
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
            radius_km: radiusRef.current,
            specialties_filter: selectedSpecs.length ? selectedSpecs : undefined,
            languages_filter: selectedLangs.length ? selectedLangs : undefined,
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
    [mode, selectedLangs, selectedSpecs],
  )

  // Init carte
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return
    if (!MAPBOX_TOKEN) { console.error('[Mapbox] NEXT_PUBLIC_MAPBOX_TOKEN manquant'); return }
    mapboxgl.accessToken = MAPBOX_TOKEN

    const m = new mapboxgl.Map({
      container: mapDiv.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: INITIAL_CENTER,
      zoom: 7,
    })
    mapRef.current = m
    m.setMaxBounds(MAX_BOUNDS)
    m.addControl(new mapboxgl.NavigationControl(), 'top-right')

    const onLoad = async () => {
      m.resize()
      m.fitBounds(BE_BOUNDS, { padding: 48, duration: 0 }) // Belgique
      await fetchResults()
      updateUrl()
    }

    m.on('load', onLoad)

    return () => {
      m.off('load', onLoad)
      m.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Filtres / mode → relance (pas de moveend/refetch)
  useEffect(() => {
    fetchResults()
    updateUrl()
  }, [mode, selectedSpecs, selectedLangs, fetchResults, updateUrl])

  // Marqueurs + popups
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

  const items = useMemo(
    () => results.map((r) => ({
      key: r.location_id,
      title: r.full_name,
      subtitle: r.headline ?? '',
      address: [r.address, r.postal_code, r.city].filter(Boolean).join(', '),
      booking: r.booking_url ?? undefined,
      slug: r.slug,
    })),
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

          {/* Spécialités */}
          <SpecialtiesFilter selectedSpecs={selectedSpecs} setSelectedSpecs={setSelectedSpecs} />

          {/* Langues */}
          <LanguagesFilter selectedLangs={selectedLangs} setSelectedLangs={setSelectedLangs} />
        </div>

        <div className="text-sm text-neutral-600">
          {loading ? 'Chargement…' : `${items.length} résultat(s)`}
        </div>

        {!loading && items.length === 0 && (
          <div className="rounded-lg border bg-neutral-50 p-4 text-sm text-neutral-700">
            Aucun ergothérapeute trouvé. Modifiez les filtres (mode / spécialités / langues).
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
      </section>

      <section className="rounded-xl border">
        <div ref={mapDiv} className="h-[560px] min-h-[560px] w-full rounded-xl" />
      </section>
    </main>
  )
}

function SpecialtiesFilter(props: {
  selectedSpecs: string[]
  setSelectedSpecs: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { selectedSpecs, setSelectedSpecs } = props
  const [openCats, setOpenCats] = useState<Record<string, boolean>>({
    pediatrie: false,
    adulte: false,
    geriatrie: false,
  })
  const toggleCat = (slug: string) => setOpenCats((prev) => ({ ...prev, [slug]: !prev[slug] }))

  return (
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
                    <span className="ml-2 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{selectedInCat}</span>
                  )}
                </span>
                <span className={`transition-transform ${openCats[cat.slug] ? 'rotate-90' : ''}`} aria-hidden>▶</span>
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
                            setSelectedSpecs((prev) => e.target.checked ? [...prev, sub.slug] : prev.filter((x) => x !== sub.slug))
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
  )
}

function LanguagesFilter(props: {
  selectedLangs: string[]
  setSelectedLangs: React.Dispatch<React.SetStateAction<string[]>>
}) {
  const { selectedLangs, setSelectedLangs } = props
  return (
    <div className="space-y-2">
      <div className="text-xs text-neutral-500">Langues</div>
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'fr', label: 'Français' },
          { value: 'nl', label: 'Néerlandais' },
          { value: 'de', label: 'Allemand' },
          { value: 'en', label: 'Anglais' },
        ].map((l) => {
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
