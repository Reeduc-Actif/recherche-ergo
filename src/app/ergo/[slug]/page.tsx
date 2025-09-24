import { supabaseServer } from '@/lib/supabase'
import Link from 'next/link'
import MapCard from '@/components/ui/map-card'


type Params = { slug: string }

type SpecRow = {
  specialty_slug: string
  specialties: { slug: string; label: string; parent_slug: string | null }[] // Supabase renvoie un array
}

export default async function ErgoPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const supabase = await supabaseServer()

  // 1) Thérapeute (profil de base + tarifs)
  const { data: t, error: tErr } = await supabase
    .from('therapists')
    .select('id, slug, full_name, headline, bio, booking_url, website, email, phone, is_published, price_min, price_max, price_unit')
    .eq('slug', slug)
    .maybeSingle()

  if (tErr) return <div className="text-sm text-red-600">Erreur chargement profil.</div>
  if (!t?.id) return <div className="text-sm text-neutral-600">Profil introuvable.</div>
  if (!t.is_published) return <div className="text-sm text-neutral-600">Ce profil n’est pas publié.</div>

  // 2) Localisations (adresses + modes + coords)
  const { data: locs } = await supabase
    .from('therapist_locations')
    .select('address, city, postal_code, country, modes, coords')
    .eq('therapist_id', t.id)
    .order('id', { ascending: true })

  const firstLoc = (locs ?? [])[0] ?? null
  const firstCoords = parseWktPoint(firstLoc?.coords ?? null) // {lon,lat} | null

  // 3) Spécialités (jointes pour labels + parent_slug)
  const { data: specsRaw } = await supabase
    .from('therapist_specialties')
    .select('specialty_slug, specialties ( slug, label, parent_slug )')
    .eq('therapist_id', t.id)

  // mise en forme par catégorie
  const byCategory = new Map<string, { catSlug: string; catLabel: string; subs: { slug: string; label: string }[] }>()
  const ensureCat = (catSlug: string, catLabel: string) => {
    if (!byCategory.has(catSlug)) byCategory.set(catSlug, { catSlug, catLabel, subs: [] })
    return byCategory.get(catSlug)!
  }

  ;(specsRaw as SpecRow[] | null)?.forEach((row) => {
    const s = row.specialties?.[0]
    if (!s) return
    const isCategory = !s.parent_slug
    if (isCategory) {
      ensureCat(s.slug, s.label)
    } else {
      const parentSlug = s.parent_slug!
      const cat = ensureCat(parentSlug, slugToLabelFallback(parentSlug))
      cat.subs.push({ slug: s.slug, label: s.label })
    }
  })

  // Labels de catégories manquants (éventuel)
  if (byCategory.size > 0) {
    const missingCatSlugs = [...byCategory.values()]
      .filter((c) => c.catLabel === slugToLabelFallback(c.catSlug))
      .map((c) => c.catSlug)
    if (missingCatSlugs.length) {
      const { data: cats } = await supabase
        .from('specialties')
        .select('slug,label')
        .in('slug', missingCatSlugs)
      cats?.forEach((c) => {
        const bucket = byCategory.get(c.slug)
        if (bucket) bucket.catLabel = c.label
      })
    }
  }

  // 4) Langues
  const LANG_LABELS: Record<string, string> = { fr: 'Français', nl: 'Néerlandais', de: 'Allemand', en: 'Anglais' }
  const { data: langs } = await supabase
    .from('therapist_languages')
    .select('language_code')
    .eq('therapist_id', t.id)
    .order('language_code', { ascending: true })
  const languages: string[] = Array.from(new Set((langs ?? []).map(l => LANG_LABELS[l.language_code]).filter(Boolean) as string[]))

  // 5) Prix (joli rendu)
  const price = formatPriceRange(t.price_min, t.price_max, t.price_unit)

  // 6) JSON-LD (SEO) — schema.org
  const ld = buildJsonLd({
    name: t.full_name,
    headline: t.headline ?? undefined,
    phone: t.phone ?? undefined,
    email: t.email ?? undefined,
    url: t.website ?? undefined,
    address: firstLoc ? {
      streetAddress: firstLoc.address ?? '',
      addressLocality: firstLoc.city ?? '',
      postalCode: firstLoc.postal_code ?? '',
      addressCountry: firstLoc.country ?? 'BE',
    } : undefined,
    geo: firstCoords ?? undefined,
    languages,
    price,
    bookingUrl: t.booking_url ?? undefined,
  })

  // 7) Rendu
  return (
    <main className="mx-auto max-w-5xl space-y-8">
      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }} />

      {/* Hero */}
      <section className="rounded-2xl border p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{t.full_name}</h1>
            {t.headline && <p className="text-neutral-700">{t.headline}</p>}
            {languages?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {languages.map((l, i) => (
                  <span key={`${l}-${i}`} className="rounded-full border px-2 py-0.5 text-xs">
                    {l}
                  </span>
                ))}
              </div>
            )}
            {price && <p className="text-sm text-neutral-600">{price}</p>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {t.booking_url && (
              <a href={t.booking_url} target="_blank" rel="noreferrer" className="btn">
                Prendre RDV
              </a>
            )}
            {t.phone && (
              <a href={`tel:${t.phone}`} className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50">
                Appeler
              </a>
            )}
            {t.email && (
              <a href={`mailto:${t.email}`} className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50">
                Écrire un e-mail
              </a>
            )}
            {t.website && (
              <a href={t.website} target="_blank" rel="noreferrer" className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50">
                Site web
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Bio */}
      {t.bio && (
        <section className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium">À propos</h2>
          </div>
          <div className="md:col-span-3">
            <p className="whitespace-pre-line text-neutral-800 leading-relaxed">{t.bio}</p>
          </div>
        </section>
      )}

      {/* Spécialités */}
      {byCategory.size > 0 && (
        <section className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium">Spécialités</h2>
          </div>
          <div className="md:col-span-3 space-y-4">
            {[...byCategory.values()].map((bucket) => (
              <div key={bucket.catSlug}>
                <div className="text-sm font-semibold">{bucket.catLabel}</div>
                {bucket.subs.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-2">
                    {bucket.subs.map((sub) => (
                      <span key={sub.slug} className="rounded-full border px-2 py-0.5 text-sm">
                        {sub.label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="mt-1">
                    <span className="rounded-full border px-2 py-0.5 text-sm">{bucket.catLabel}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Lieux + carte */}
      {locs && locs.length > 0 && (
        <section className="grid gap-6 md:grid-cols-5">
          <div className="md:col-span-2">
            <h2 className="text-lg font-medium">Lieux de consultation</h2>
            <div className="mt-3 space-y-2 text-sm text-neutral-700">
              {locs.map((l, i) => (
                <div key={i}>
                  {[l.address, [l.postal_code, l.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')}
                  {l.modes?.length ? (
                    <span className="ml-1 text-neutral-500">— {l.modes.map(modeLabel).join(', ')}</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
          <div className="md:col-span-3">
            {firstCoords ? (
              <MapCard lon={firstCoords.lon} lat={firstCoords.lat} label={displayAddress(firstLoc)} />
            ) : (
              <div className="rounded-2xl border p-6 text-sm text-neutral-600">
                Carte indisponible pour cette adresse.
              </div>
            )}
          </div>
        </section>
      )}

      {/* Pied de page simple */}
      <div className="flex items-center justify-between border-t pt-6">
        <Link className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" href="/recherche">
          ← Retour
        </Link>
        {t.slug && (
          <Link className="text-sm underline" href={`/ergo/${t.slug}`}>Permalien</Link>
        )}
      </div>
    </main>
  )
}

/** Helpers */

function slugToLabelFallback(slug: string) {
  return slug.split('-').map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
}

function modeLabel(m: string) {
  if (m === 'cabinet') return 'Au cabinet'
  if (m === 'domicile') return 'À domicile'
  if (m === 'visio') return 'En visio'
  return m
}

// WKT "SRID=4326;POINT(lon lat)" -> { lon, lat }
function parseWktPoint(wkt: string | null): { lon: number; lat: number } | null {
  if (!wkt) return null
  const m = /POINT\s*\(\s*([-\d\.]+)\s+([-\d\.]+)\s*\)/i.exec(wkt)
  if (!m) return null
  return { lon: Number(m[1]), lat: Number(m[2]) }
}

function formatPriceRange(min?: number | null, max?: number | null, unit?: string | null) {
  if (!min && !max) return ''
  const u = unit === 'session' ? 'par séance' : 'par heure'
  if (min && max && min !== max) return `Tarifs : ${min}–${max} € ${u}`
  const value = (min ?? max)!
  return `Tarif : ${value} € ${u}`
}

function displayAddress(loc?: { address?: string | null; postal_code?: string | null; city?: string | null; country?: string | null } | null) {
  if (!loc) return ''
  return [loc.address, [loc.postal_code, loc.city].filter(Boolean).join(' ')].filter(Boolean).join(', ')
}

function buildJsonLd(input: {
  name: string
  headline?: string
  phone?: string
  email?: string
  url?: string
  address?: { streetAddress: string; addressLocality: string; postalCode: string; addressCountry: string }
  geo?: { lon: number; lat: number }
  languages?: string[]
  price?: string
  bookingUrl?: string
}) {
  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: input.name,
  }
  if (input.headline) ld.description = input.headline
  if (input.url) ld.url = input.url
  if (input.phone) ld.telephone = input.phone
  if (input.email) ld.email = input.email
  if (input.address) ld.address = { '@type': 'PostalAddress', ...input.address }
  if (input.geo) ld.geo = { '@type': 'GeoCoordinates', latitude: input.geo.lat, longitude: input.geo.lon }
  if (input.languages?.length) ld.knowsLanguage = input.languages
  if (input.price) ld.priceRange = input.price.replace('Tarifs : ', '').replace('Tarif : ', '')
  if (input.bookingUrl) ld.hasOfferCatalog = { '@type': 'OfferCatalog', name: 'Prise de rendez-vous', url: input.bookingUrl }
  return ld
}
