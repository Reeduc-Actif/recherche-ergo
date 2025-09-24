// src/components/ui/edit-therapist-all.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

const LANGS = [
  { value: 'fr', label: 'Français' },
  { value: 'nl', label: 'Néerlandais' },
  { value: 'de', label: 'Allemand' },
  { value: 'en', label: 'Anglais' },
]
const MODES = [
  { value: 'cabinet', label: 'Au cabinet' },
  { value: 'domicile', label: 'À domicile' },
  { value: 'visio', label: 'En visio' },
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
  price_unit: string | null // 'hour' | 'session' | null
}

export default function EditTherapistAll({ therapist }: { therapist: Therapist }) {
  const sb = supabaseBrowser()

  // --- état du formulaire (thérapeute) ---
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

  // --- état du formulaire (localisation + relations) ---
  const [address, setAddress] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [city, setCity] = useState('')
  const [country, setCountry] = useState('BE')
  const [languages, setLanguages] = useState<string[]>([])
  const [modes, setModes] = useState<string[]>([])
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

  // --- préchargement des valeurs relations + localisation ---
  useEffect(() => {
    const load = async () => {
      // languages
      const { data: langs } = await sb.from('therapist_languages').select('language_code').eq('therapist_id', therapist.id)
      setLanguages((langs ?? []).map(l => l.language_code as string))

      // specialties
      const { data: specs } = await sb.from('therapist_specialties').select('specialty_slug').eq('therapist_id', therapist.id)
      setSpecialties((specs ?? []).map(s => s.specialty_slug as string))

      // location (1 principale)
      const { data: loc } = await sb
        .from('therapist_locations')
        .select('address,postal_code,city,country,modes')
        .eq('therapist_id', therapist.id)
        .limit(1)
      if (loc && loc[0]) {
        setAddress(loc[0].address ?? '')
        setPostalCode(loc[0].postal_code ?? '')
        setCity(loc[0].city ?? '')
        setCountry(loc[0].country ?? 'BE')
        setModes(Array.isArray(loc[0].modes) ? loc[0].modes as string[] : [])
      }
    }
    load()
  }, [sb, therapist.id])

  const toggle = (key: 'languages' | 'specialties' | 'modes', value: string) => {
    if (key === 'languages') setLanguages(v => v.includes(value) ? v.filter(x => x !== value) : [...v, value])
    if (key === 'specialties') setSpecialties(v => v.includes(value) ? v.filter(x => x !== value) : [...v, value])
    if (key === 'modes') setModes(v => v.includes(value) ? v.filter(x => x !== value) : [...v, value])
  }

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null); setErr(null)

    if (!fullName || fullName.trim().length < 2) {
      setErr('Le nom complet est requis (min. 2 caractères).')
      return
    }
    if (!address || !city || !postalCode) {
      setErr('Adresse complète requise.')
      return
    }
    if (!languages.length) {
      setErr('Sélectionnez au moins une langue.')
      return
    }
    if (!specialties.length) {
      setErr('Sélectionnez au moins une spécialité.')
      return
    }

    const minNum = priceMin ? Number(priceMin) : null
    const maxNum = priceMax ? Number(priceMax) : null
    if (minNum && maxNum && minNum > maxNum) {
      setErr('price_min ne peut pas dépasser price_max.')
      return
    }

    setSaving(true)
    try {
      // 1) Update colonnes therapist (direct DB)
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

      // 2) Sync relations + localisation via /api/pro/onboard (idempotent)
      const res = await fetch('/api/pro/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim(),          // requis par la route
          headline: headline.trim() || undefined,
          phone: phone.trim() || undefined,
          booking_url: bookingUrl.trim() || undefined,
          languages,
          specialties,
          modes,
          address,
          postal_code: postalCode,
          city,
          country,
          price_min: minNum ?? undefined,
          price_max: maxNum ?? undefined,
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

        {/* Coordonnées */}
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

        {/* Adresse */}
        <div className="grid gap-3 md:grid-cols-4">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm">Adresse</label>
            <input className="input w-full" value={address} onChange={e => setAddress(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Code postal</label>
            <input className="input w-full" value={postalCode} onChange={e => setPostalCode(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Ville</label>
            <input className="input w-full" value={city} onChange={e => setCity(e.target.value)} />
          </div>
        </div>

        {/* Tarifs */}
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Prix min (€)</label>
            <input type="number" min={1} max={1000} className="input w-full" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Prix max (€)</label>
            <input type="number" min={1} max={1000} className="input w-full" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
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

        {/* Modalités + publication */}
        <div className="flex flex-col gap-3">
          <div>
            <div className="mb-1 text-sm">Modalités</div>
            <div className="flex flex-wrap gap-2">
              {MODES.map(m => (
                <label key={m.value} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                  <input type="checkbox" checked={modes.includes(m.value)} onChange={() => toggle('modes', m.value)} />
                  {m.label}
                </label>
              ))}
            </div>
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
        </div>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}
      </form>

      <p className="text-xs text-neutral-500">Slug public : <code>{therapist.slug ?? '—'}</code></p>
    </section>
  )
}
