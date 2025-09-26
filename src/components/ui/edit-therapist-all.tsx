'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Mode = 'cabinet' | 'domicile'

const LANGS = [
  { value: 'fr', label: 'Français' },
  { value: 'nl', label: 'Néerlandais' },
  { value: 'de', label: 'Allemand' },
  { value: 'en', label: 'Anglais' },
]

type Therapist = {
  id: string
  slug: string | null
  profile_id: string
  full_name: string | null
  headline: string | null
  bio: string | null
  email: string | null
  phone: string | null
  website: string | null
  booking_url: string | null
  price_hint: string | null
  is_published: boolean | null
  is_approved: boolean | null
  price_min: number | null
  price_max: number | null
  price_unit: string | null
}

type LocationRow = {
  id: number
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  modes: string[] | null
}

type TLCRow = { commune_code: string }

function CommunePicker({
  value,
  onChange,
}: { value: string[]; onChange: (codes: string[]) => void }) {
  const sb = supabaseBrowser()
  const [q, setQ] = useState('')
  const [options, setOptions] = useState<{ code_nis: string; name_fr: string }[]>([])
  useEffect(() => {
    let active = true
    const load = async () => {
      if (!q || q.trim().length < 2) { setOptions([]); return }
      const { data } = await sb
        .from('communes_be')
        .select('code_nis,name_fr')
        .ilike('name_fr', `%${q.trim()}%`)
        .limit(8)
      if (active) setOptions(data ?? [])
    }
    load()
    return () => { active = false }
  }, [q, sb])

  return (
    <div className="space-y-2">
      <input className="input w-full" placeholder="Rechercher une commune…" value={q} onChange={(e) => setQ(e.target.value)} />
      {options.length > 0 && (
        <div className="rounded-lg border">
          {options.map(opt => {
            const checked = value.includes(opt.code_nis)
            return (
              <label key={opt.code_nis} className="flex items-center gap-2 px-3 py-2 border-b last:border-b-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    onChange(
                      e.target.checked
                        ? [...value, opt.code_nis]
                        : value.filter(c => c !== opt.code_nis),
                    )
                  }}
                />
                <span className="text-sm">{opt.name_fr}</span>
              </label>
            )
          })}
        </div>
      )}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map(code => (
            <span key={code} className="rounded-full border px-2 py-0.5 text-xs">
              {code}
              <button type="button" className="ml-1 text-neutral-500" onClick={() => onChange(value.filter(c => c !== code))}>×</button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type LocationDraft =
  | { id?: number; mode: 'cabinet'; address: string; postal_code: string; city: string; country: 'BE'; communes?: never }
  | { id?: number; mode: 'domicile'; address?: string; postal_code?: string; city?: string; country: 'BE'; communes: string[] }

export default function EditTherapistAll({ therapist }: { therapist: Therapist }) {
  const sb = supabaseBrowser()

  // --- état profil ---
  const [fullName, setFullName] = useState(therapist.full_name ?? '')
  const [headline, setHeadline] = useState(therapist.headline ?? '')
  const [bio, setBio] = useState(therapist.bio ?? '')
  const [phone, setPhone] = useState(therapist.phone ?? '')
  const [website, setWebsite] = useState(therapist.website ?? '')
  const [bookingUrl, setBookingUrl] = useState(therapist.booking_url ?? '')
  const [isPublished, setIsPublished] = useState(Boolean(therapist.is_published))
  const [priceMin, setPriceMin] = useState<string>(therapist.price_min?.toString() ?? '')
  const [priceMax, setPriceMax] = useState<string>(therapist.price_max?.toString() ?? '')
  const [priceUnit, setPriceUnit] = useState<string>(therapist.price_unit ?? '')

  const [languages, setLanguages] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])

  // --- référentiel spécialités ---
  const [specs, setSpecs] = useState<{ slug: string; label: string; parent_slug: string | null }[]>([])
  useEffect(() => {
    sb.from('specialties').select('slug,label,parent_slug').then(({ data }) => setSpecs(data ?? []))
  }, [sb])
  const roots = useMemo(() => specs.filter(s => !s.parent_slug), [specs])
  const childrenBy = useMemo(() => {
    const m: Record<string, { slug: string; label: string }[]> = {}
    specs.forEach(s => { if (s.parent_slug) (m[s.parent_slug] ||= []).push({ slug: s.slug, label: s.label }) })
    Object.values(m).forEach(arr => arr.sort((a, b) => a.label.localeCompare(b.label, 'fr')))
    return m
  }, [specs])

  // --- localisations ---
  const [locations, setLocations] = useState<LocationDraft[]>([])
  const addLocation = (mode: Mode) =>
    setLocations(v => [
      ...v,
      mode === 'cabinet'
        ? { mode, address: '', postal_code: '', city: '', country: 'BE' }
        : { mode, country: 'BE', communes: [] },
    ])
  const removeLocation = (idx: number) => setLocations(v => v.filter((_, i) => i !== idx))
  const updateLoc = (idx: number, patch: Partial<LocationDraft>) =>
    setLocations(v => v.map((l, i) => (i === idx ? { ...l, ...patch } as LocationDraft : l)))

  // --- préchargement depuis DB ---
  useEffect(() => {
    const load = async () => {
      // langues
      const { data: langs } = await sb.from('therapist_languages').select('language_code').eq('therapist_id', therapist.id)
      setLanguages((langs ?? []).map(l => l.language_code as string))

      // spécialités
      const { data: sps } = await sb.from('therapist_specialties').select('specialty_slug').eq('therapist_id', therapist.id)
      setSpecialties((sps ?? []).map(s => s.specialty_slug as string))

      // localisations
      const { data: locs } = await sb
        .from('therapist_locations')
        .select('id,address,postal_code,city,country,modes')
        .eq('therapist_id', therapist.id)
        .order('id', { ascending: true }) as { data: LocationRow[] | null }

      const drafts: LocationDraft[] = []
      for (const l of locs ?? []) {
        const isDomicile = (l.modes ?? []).includes('domicile')
        if (isDomicile) {
          const { data: tlc } = await sb
            .from('therapist_location_communes')
            .select('commune_code')
            .eq('location_id', l.id) as { data: TLCRow[] | null }
          drafts.push({
            id: l.id,
            mode: 'domicile',
            country: (l.country as any) ?? 'BE',
            communes: (tlc ?? []).map(x => x.commune_code),
          })
        }
        if ((l.modes ?? []).includes('cabinet')) {
          drafts.push({
            id: l.id,
            mode: 'cabinet',
            address: l.address ?? '',
            postal_code: l.postal_code ?? '',
            city: l.city ?? '',
            country: (l.country as any) ?? 'BE',
          })
        }
      }
      setLocations(drafts)
    }
    load()
  }, [sb, therapist.id])

  const toggle = (key: 'languages' | 'specialties', value: string) => {
    if (key === 'languages') setLanguages(v => v.includes(value) ? v.filter(x => x !== value) : [...v, value])
    if (key === 'specialties') setSpecialties(v => v.includes(value) ? v.filter(x => x !== value) : [...v, value])
  }

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null); setErr(null)

    if (!fullName || fullName.trim().length < 2) return setErr('Le nom complet est requis.')
    if (!languages.length) return setErr('Sélectionnez au moins une langue.')
    if (!specialties.length) return setErr('Sélectionnez au moins une spécialité.')
    if (locations.length === 0) return setErr('Ajoutez au moins une localisation.')

    for (const loc of locations) {
      if (loc.mode === 'cabinet') {
        if (!loc.address || !loc.city || !loc.postal_code) return setErr('Chaque cabinet doit avoir adresse, ville et code postal.')
      } else {
        if (!loc.communes || loc.communes.length === 0) return setErr('Chaque zone à domicile doit contenir au moins une commune.')
      }
    }

    const minNum = priceMin ? Number(priceMin) : undefined
    const maxNum = priceMax ? Number(priceMax) : undefined
    if (minNum && maxNum && minNum > maxNum) return setErr('price_min ne peut pas dépasser price_max.')

    setSaving(true)
    try {
      // 1) Update colonnes therapist
      const payloadTherapist = {
        full_name: fullName.trim(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        booking_url: bookingUrl.trim() || null,
        is_published: isPublished,
        price_min: minNum,
        price_max: maxNum,
        price_unit: priceUnit || null,
      }
      const { error: upErr } = await sb.from('therapists').update(payloadTherapist).eq('id', therapist.id).select('id').single()
      if (upErr) throw upErr

      // 2) Sync relations + localisations (idempotent)
      const res = await fetch('/api/pro/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(), // requis par la route
          headline: headline.trim() || undefined,
          phone: phone.trim() || undefined,
          booking_url: bookingUrl.trim() || undefined,
          languages,
          specialties,
          locations, // <— NOUVEAU
          price_min: minNum,
          price_max: maxNum,
          price_unit: priceUnit || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json?.error || 'Erreur API (onboard)')

      setMsg('Profil ergothérapeute mis à jour !')
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Mise à jour impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border p-4">
      <form onSubmit={onSubmit} className="space-y-6">
        {/* Identité */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Nom complet</label>
            <input className="input w-full" value={fullName} onChange={e => setFullName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Titre (headline)</label>
            <input className="input w-full" value={headline} onChange={e => setHeadline(e.target.value)} placeholder="Ergothérapeute…" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Bio</label>
          <textarea className="input w-full h-28" value={bio} onChange={e => setBio(e.target.value)} placeholder="Parlez de votre pratique…" />
        </div>

        {/* Coordonnées rapides */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Téléphone</label>
            <input className="input w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32..." />
          </div>
          <div>
            <label className="mb-1 block text-sm">Site web</label>
            <input type="url" className="input w-full" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Lien RDV</label>
            <input type="url" className="input w-full" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="https://cal.com/…" />
          </div>
        </div>

        {/* Tarifs */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Prix min (€)</label>
            <input type="number" min={1} className="input w-full" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Prix max (€)</label>
            <input type="number" min={1} className="input w-full" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Unité</label>
            <select className="input w-full" value={priceUnit} onChange={e => setPriceUnit(e.target.value)}>
              <option value="">—</option>
              <option value="hour">Heure</option>
              <option value="session">Séance</option>
            </select>
          </div>
        </div>

        {/* Langues */}
        <div>
          <div className="mb-1 text-sm">Langues</div>
          <div className="flex flex-wrap gap-2">
            {LANGS.map(l => (
              <label key={l.value} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                <input type="checkbox" checked={languages.includes(l.value)} onChange={() => toggle('languages', l.value)} />
                {l.label}
              </label>
            ))}
          </div>
        </div>

        {/* Spécialités */}
        <div className="space-y-2">
          <div className="text-sm">Spécialités</div>
          <div className="space-y-3">
            {roots.map(root => (
              <div key={root.slug} className="rounded-lg border p-3">
                <div className="mb-2 font-medium">{root.label}</div>
                <div className="flex flex-wrap gap-2">
                  {(childrenBy[root.slug] ?? []).map(sub => (
                    <label key={sub.slug} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                      <input type="checkbox" checked={specialties.includes(sub.slug)} onChange={() => toggle('specialties', sub.slug)} />
                      {sub.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Localisations */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm font-medium">Localisations</div>
            <div className="flex gap-2">
              <button type="button" className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" onClick={() => addLocation('cabinet')}>Ajouter un cabinet</button>
              <button type="button" className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" onClick={() => addLocation('domicile')}>Ajouter une zone à domicile</button>
            </div>
          </div>

          {locations.map((loc, idx) => (
            <div key={`${loc.mode}-${idx}-${loc.id ?? 'new'}`} className="rounded-xl border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{loc.mode === 'cabinet' ? 'Cabinet' : 'À domicile'}</div>
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeLocation(idx)}>Supprimer</button>
              </div>

              {loc.mode === 'cabinet' ? (
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm">Adresse</label>
                    <input className="input" value={loc.address} onChange={e => updateLoc(idx, { address: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Code postal</label>
                    <input className="input" value={loc.postal_code} onChange={e => updateLoc(idx, { postal_code: e.target.value })} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm">Ville</label>
                    <input className="input" value={loc.city} onChange={e => updateLoc(idx, { city: e.target.value })} />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-1 text-sm text-neutral-600">Communes couvertes</div>
                  <CommunePicker
                    value={loc.communes ?? []}
                    onChange={(codes) => updateLoc(idx, { communes: codes } as any)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between">
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isPublished} onChange={e => setIsPublished(e.target.checked)} />
            Rendre ma fiche publique
          </label>
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}
      </form>

      <p className="text-xs text-neutral-500">Slug public : <code>{therapist.slug ?? '—'}</code></p>
    </section>
  )
}
