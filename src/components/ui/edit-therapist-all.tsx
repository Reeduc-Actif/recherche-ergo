'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import CityAutocomplete from '@/components/ui/CityAutocomplete'
import CityAutocompleteMulti from '@/components/ui/CityAutocompleteMulti'

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
  first_name: string | null
  last_name: string | null
  full_name: string | null // Keep for backward compatibility
  inami_number: string | null
  email: string | null
  bio: string | null
  phone: string | null
  booking_url: string | null
  price_hint: string | null
  is_published: boolean | null
  is_approved: boolean | null
  price_min: number | null
  price_max: number | null
  price_unit: string | null
}

/* --- Tables côté lecture --- */
type LocationRow = {
  id: number
  address: string | null
  postal_code: string | null
  city: string | null
  country: string | null
  modes: string[] | null
}


/* --- Brouillons de localisation (discriminated union) --- */
type CabinetDraft = {
  id?: number
  mode: 'cabinet'
  address: string
  postal_code: string
  city: string
  country: 'BE'
  lon?: number
  lat?: number
  street?: string
  house_number?: string
  place_name?: string
  mapbox_id?: string
  bbox?: number[]
}
type DomicileDraft = {
  id?: number
  mode: 'domicile'
  country: 'BE'
  cities: (number | string)[]
}
type LocationDraft = CabinetDraft | DomicileDraft

export default function EditTherapistAll({ therapist }: { therapist: Therapist }) {
  const sb = supabaseBrowser()

  // --- état profil ---
  const [firstName, setFirstName] = useState(therapist.first_name ?? '')
  const [lastName, setLastName] = useState(therapist.last_name ?? '')
  const [inamiNumber, setInamiNumber] = useState(therapist.inami_number ?? '')
  const [email, setEmail] = useState(therapist.email ?? '')
  const [bio, setBio] = useState(therapist.bio ?? '')
  const [phone, setPhone] = useState(therapist.phone ?? '')
  const [bookingUrl, setBookingUrl] = useState(therapist.booking_url ?? '')
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
        : { mode, country: 'BE', cities: [] },
    ])

  const removeLocation = (idx: number) => setLocations(v => v.filter((_, i) => i !== idx))

  // surcharges pour éviter tout `any` au patch
  function updateLoc(idx: number, patch: Partial<CabinetDraft>): void
  function updateLoc(idx: number, patch: Partial<DomicileDraft>): void
  function updateLoc(idx: number, patch: Partial<LocationDraft>): void {
    setLocations(v =>
      v.map((l, i) => (i === idx ? ({ ...l, ...patch } as LocationDraft) : l)),
    )
  }

  // Helper pour construire l'adresse complète
  const buildAddress = (street: string, houseNumber: string) => {
    return [street, houseNumber].filter(Boolean).join(' ')
  }

  // --- préchargement depuis DB ---
  useEffect(() => {
    const load = async () => {
      // langues
      const { data: langs } = await sb
        .from('therapist_languages')
        .select('language_code')
        .eq('therapist_id', therapist.id)
      setLanguages((langs ?? []).map(l => l.language_code))

      // spécialités
      const { data: sps } = await sb
        .from('therapist_specialties')
        .select('specialty_slug')
        .eq('therapist_id', therapist.id)
      setSpecialties((sps ?? []).map(s => s.specialty_slug))

      // localisations
      const { data: locs } = await sb
        .from('therapist_locations')
        .select('id,address,postal_code,city,country,modes')
        .eq('therapist_id', therapist.id)
        .order('id', { ascending: true })

      const drafts: LocationDraft[] = []
      for (const l of (locs ?? []) as LocationRow[]) {
        const modes = l.modes ?? []
        const countryBE = 'BE' as const

        if (modes.includes('domicile')) {
          const { data: homeCities } = await sb
            .from('therapist_home_municipalities')
            .select('nis_code')
            .eq('therapist_id', therapist.id)

          const nisList = (homeCities ?? []).map((r: { nis_code: number }) => r.nis_code)

          drafts.push({
            mode: 'domicile',
            country: 'BE',
            cities: nisList,     // NIS list
          })
        }
        if (modes.includes('cabinet')) {
          // Parser l'adresse existante pour extraire rue et numéro
          const address = l.address ?? ''
          const addressParts = address.split(' ')
          const street = addressParts.slice(0, -1).join(' ') || ''
          const houseNumber = addressParts[addressParts.length - 1] || ''
          
          drafts.push({
            id: l.id,
            mode: 'cabinet',
            address,
            street,
            house_number: houseNumber,
            postal_code: l.postal_code ?? '',
            city: l.city ?? '',
            country: countryBE,
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

    if (!firstName.trim()) return setErr('Prénom requis.')
    if (!lastName.trim()) return setErr('Nom requis.')
    if (!email.trim()) return setErr('Email professionnel requis.')
    if (!languages.length) return setErr('Sélectionnez au moins une langue.')
    if (!specialties.length) return setErr('Sélectionnez au moins une spécialité.')
    if (locations.length === 0) return setErr('Ajoutez au moins une localisation.')
    
    // Validation INAMI
    if (inamiNumber && !/^\d{8,}$/.test(inamiNumber)) {
      return setErr('Le numéro INAMI doit contenir au moins 8 chiffres.')
    }

    for (const loc of locations) {
      if (loc.mode === 'cabinet') {
        if (!loc.street || !loc.house_number || !loc.city || !loc.postal_code)
          return setErr('Chaque cabinet doit avoir rue, numéro, ville et code postal.')
        } else {
        if (!('cities' in loc) || !loc.cities || loc.cities.length === 0)
          return setErr('Chaque zone à domicile doit contenir au moins une commune.')
      }
    }

    const minNum = priceMin ? Number(priceMin) : undefined
    const maxNum = priceMax ? Number(priceMax) : undefined
    if (minNum && maxNum && minNum > maxNum) return setErr('price_min ne peut pas dépasser price_max.')

    setSaving(true)
    try {
      // 1) Update colonnes therapist
      const payloadTherapist = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        inami_number: inamiNumber.trim() || null,
        email: email.trim(),
        bio: bio.trim() || null,
        phone: phone.trim() || null,
        booking_url: bookingUrl.trim() || null,
        price_min: minNum,
        price_max: maxNum,
        price_unit: priceUnit || null,
        // Generate full_name for backward compatibility
        full_name: `${firstName.trim()} ${lastName.trim()}`,
      }
      const { error: upErr } = await sb
        .from('therapists')
        .update(payloadTherapist)
        .eq('id', therapist.id)
        .select('id')
        .single()
      if (upErr) throw upErr

      // 2) Sync relations + localisations (idempotent côté route)
      // Transform locations to match new API contract
      const transformedLocations = locations.map(loc => {
        if (loc.mode === 'cabinet') {
          return {
            mode: 'cabinet',
            address: loc.address,
            postal_code: loc.postal_code,
            city: loc.city,
            country: 'BE' as const,
            coords: loc.lon && loc.lat ? {
              type: 'Point' as const,
              coordinates: [loc.lon, loc.lat]
            } : undefined,
            // Keep meta data for reference
            ...(loc.place_name && { place_name: loc.place_name }),
            ...(loc.mapbox_id && { mapbox_id: loc.mapbox_id }),
            ...(loc.street && { street: loc.street }),
            ...(loc.house_number && { house_number: loc.house_number }),
            ...(loc.bbox && { bbox: loc.bbox }),
          }
        } else {
          return {
            mode: 'domicile',
            country: 'BE' as const,
            cities: loc.cities.map(String)
          }
        }
      })

      const res = await fetch('/api/pro/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          inami_number: inamiNumber.trim() || undefined,
          email: email.trim(),
          bio: bio.trim() || undefined,
          phone: phone.trim() || undefined,
          booking_url: bookingUrl.trim() || undefined,
          languages,
          specialties,
          locations: transformedLocations,
          price_min: minNum,
          price_max: maxNum,
          price_unit: priceUnit || undefined,
        }),
      })
      const json: { ok?: boolean; error?: string } = await res.json()
      if (!res.ok || !json.ok) throw new Error(json?.error || 'Erreur API (onboard)')

      setMsg('Profil ergothérapeute mis à jour !')
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Mise à jour impossible.'
      setErr(message)
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
            <label className="mb-1 block text-sm">Prénom <span className="text-red-500">*</span></label>
            <input className="input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Nom <span className="text-red-500">*</span></label>
            <input className="input w-full" value={lastName} onChange={e => setLastName(e.target.value)} required />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Email professionnel <span className="text-red-500">*</span></label>
            <input type="email" className="input w-full" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm">Numéro INAMI (8+ chiffres)</label>
            <input 
              className="input w-full" 
              placeholder="12345678"
              maxLength={15}
              value={inamiNumber} 
              onChange={e => {
                const value = e.target.value.replace(/\D/g, '') // Only digits
                setInamiNumber(value)
              }}
            />
            {inamiNumber && !/^\d{8,}$/.test(inamiNumber) && (
              <div className="mt-1 text-xs text-red-600">
                Le numéro INAMI doit contenir au moins 8 chiffres
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Bio</label>
          <textarea className="input w-full h-28" value={bio} onChange={e => setBio(e.target.value)} placeholder="Parlez de votre pratique…" />
        </div>

        {/* Coordonnées rapides */}
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Téléphone</label>
            <input className="input w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32..." />
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
              <button
                type="button"
                className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                onClick={() => addLocation('cabinet')}
              >
                Ajouter un cabinet
              </button>
              <button
                type="button"
                className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50"
                onClick={() => addLocation('domicile')}
              >
                Ajouter une zone à domicile
              </button>
            </div>
          </div>

          {locations.map((loc, idx) => (
            <div key={`${loc.mode}-${idx}-${loc.id ?? 'new'}`} className="rounded-xl border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{loc.mode === 'cabinet' ? 'Cabinet' : 'À domicile'}</div>
                <button type="button" className="text-sm text-red-600 hover:underline" onClick={() => removeLocation(idx)}>
                  Supprimer
                </button>
              </div>

              {loc.mode === 'cabinet' ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm">Rue</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={loc.street || ''}
                        onChange={(e) => {
                          const street = e.target.value
                          updateLoc(idx, {
                            street,
                            address: buildAddress(street, loc.house_number || '')
                          } as Partial<CabinetDraft>)
                        }}
                        placeholder="Rue de la Paix"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Numéro</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={loc.house_number || ''}
                        onChange={(e) => {
                          const houseNumber = e.target.value
                          updateLoc(idx, {
                            house_number: houseNumber,
                            address: buildAddress(loc.street || '', houseNumber)
                          } as Partial<CabinetDraft>)
                        }}
                        placeholder="123"
                      />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm">Code postal</label>
                      <input
                        type="text"
                        className="input w-full"
                        value={loc.postal_code || ''}
                        onChange={(e) => updateLoc(idx, { postal_code: e.target.value } as Partial<CabinetDraft>)}
                        placeholder="1000"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm">Ville</label>
                      <CityAutocomplete
                        value={loc.city || ''}
                        onChange={(city) => updateLoc(idx, { city } as Partial<CabinetDraft>)}
                        placeholder="Bruxelles"
                        locale="fr"
                      />
                    </div>
                  </div>
                  <div className="text-xs text-neutral-500 bg-neutral-50 p-2 rounded">
                    <strong>Adresse complète :</strong> {loc.address || 'Rue + Numéro'} {loc.postal_code && loc.city ? `, ${loc.postal_code} ${loc.city}` : ''}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-1 text-sm text-neutral-600">Villes couvertes</div>
                  <CityAutocompleteMulti
                    value={loc.cities}
                    onChange={(codes) => updateLoc(idx, { cities: codes.map(String) } as Partial<DomicileDraft>)}
                    placeholder="Rechercher une ville…"
                    locale="fr"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end">
          <button type="submit" className="btn" disabled={saving}>
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}
      </form>
    </section>
  )
}
