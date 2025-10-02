'use client'

import { useEffect, useMemo, useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'
import CityAutocompleteMulti from '@/components/ui/CityAutocompleteMulti'
import AddressAutocomplete from '@/components/ui/AddressAutocomplete'

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
  inami_number: string | null
  email: string | null
  bio: string | null
  phone: string | null
  booking_url: string | null
  is_published: boolean | null
  is_approved: boolean | null
  price_min: number | null
  price_max: number | null
  price_unit: string | null
}

/* --- Tables côté lecture --- */
type CabinetRow = {
  id: number
  therapist_id: string
  street: string | null
  city: string | null
  postal_code: string | null
  country: string | null
  coords: string | null
  mapbox_id: string | null
  bbox: number[] | null
  lon: number | null
  lat: number | null
  house_number: string | null
}

type HomeMunicipalityRow = {
  therapist_id: string
  nis_code: number
}

type CityRow = {
  nis_code: number
  name_fr: string
}


/* ---------- Localisations (unions discriminées) ---------- */
type CabinetDraft = {
  id?: number
  mode: 'cabinet'
  address: string
  postal_code: string
  city: string
  country: 'BE'
  // méta géo (remplies par l'autocomplete)
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
  cities: (number | string)[] // NIS
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
  const [phone, setPhone] = useState(() => {
    const existingPhone = therapist.phone ?? ''
    return existingPhone.startsWith('+32') ? existingPhone : `+32${existingPhone.replace(/^\+32/, '')}`
  })
  const [bookingUrl, setBookingUrl] = useState(therapist.booking_url ?? '')
  const [priceMin, setPriceMin] = useState<string>(therapist.price_min?.toString() ?? '')
  const [priceMax, setPriceMax] = useState<string>(therapist.price_max?.toString() ?? '')
  const [priceUnit, setPriceUnit] = useState<string>(therapist.price_unit ?? '')

  const [languages, setLanguages] = useState<string[]>([])
  const [specialties, setSpecialties] = useState<string[]>([])
  const [cityNames, setCityNames] = useState<Record<number, string>>({}) // NIS code -> city name

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

  const addLocation = (mode: Mode) => {
    setLocations(v => [
      ...v,
      mode === 'cabinet'
        ? { mode, address: '', street: '', house_number: '', postal_code: '', city: '', country: 'BE' }
        : { mode, country: 'BE', cities: [] },
    ])
  }

  const removeLocation = (idx: number) => setLocations(v => v.filter((_, i) => i !== idx))

  // surcharges pour patch strict typé
  function updateLoc(idx: number, patch: Partial<CabinetDraft>): void
  function updateLoc(idx: number, patch: Partial<DomicileDraft>): void
  function updateLoc(idx: number, patch: Partial<LocationDraft>): void {
    setLocations(v => v.map((l, i) => (i === idx ? ({ ...l, ...patch } as LocationDraft) : l)))
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

      // Charger les cabinets
      const { data: cabinets } = await sb
        .from('therapist_locations')
        .select('id, therapist_id, street, city, postal_code, country, coords, mapbox_id, bbox, lon, lat, house_number')
        .eq('therapist_id', therapist.id)
        .order('id', { ascending: true })

      // Charger les zones à domicile
      const { data: homeCities } = await sb
        .from('therapist_home_municipalities')
        .select('therapist_id, nis_code')
        .eq('therapist_id', therapist.id)

      const drafts: LocationDraft[] = []

      // Ajouter les cabinets
      for (const cabinet of (cabinets ?? []) as CabinetRow[]) {
        // Construire l'adresse complète avec rue, numéro, code postal et ville
        const streetParts = [cabinet.street, cabinet.house_number].filter(Boolean)
        const streetAddress = streetParts.join(' ')
        const cityParts = [cabinet.postal_code, cabinet.city].filter(Boolean)
        const cityAddress = cityParts.join(' ')
        const fullAddress = [streetAddress, cityAddress].filter(Boolean).join(', ')

        drafts.push({
          id: cabinet.id,
          mode: 'cabinet',
          address: fullAddress,
          street: cabinet.street ?? '',
          house_number: cabinet.house_number ?? '',
          postal_code: cabinet.postal_code ?? '',
          city: cabinet.city ?? '',
          country: 'BE',
          lon: cabinet.lon ?? undefined,
          lat: cabinet.lat ?? undefined,
          mapbox_id: cabinet.mapbox_id ?? undefined,
          bbox: cabinet.bbox ?? undefined,
        })
      }

      // Ajouter la zone à domicile (s'il y en a une)
      if (homeCities && homeCities.length > 0) {
        const nisList = (homeCities as HomeMunicipalityRow[]).map(r => r.nis_code)
        
        // Récupérer les noms des villes à partir des codes NIS
        if (nisList.length > 0) {
          const { data: cities } = await sb
            .from('cities_be')
            .select('nis_code, name_fr')
            .in('nis_code', nisList)
          
          // Créer un mapping NIS -> nom de ville
          const cityMapping: Record<number, string> = {}
          if (cities) {
            cities.forEach((city: CityRow) => {
              cityMapping[city.nis_code] = city.name_fr
            })
          }
          setCityNames(cityMapping)
        }
        
        drafts.push({
          mode: 'domicile',
          country: 'BE',
          cities: nisList,
        })
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

    // Validations minimales côté frontend
    if (!firstName.trim()) return setErr('Le prénom est requis.')
    if (!lastName.trim()) return setErr('Le nom est requis.')
    if (!email.trim()) return setErr('L\'email est requis.')
    if (!specialties.length) return setErr('Veuillez sélectionner au moins une spécialité.')
    if (!languages.length) return setErr('Veuillez sélectionner au moins une langue.')
    if (locations.length === 0) return setErr('Veuillez ajouter au moins une localisation.')
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return setErr('L\'email n\'est pas valide.')
    
    // Validation INAMI (optionnel mais si rempli, doit avoir 8+ caractères)
    if (inamiNumber && inamiNumber.length < 8) {
      return setErr('Le numéro INAMI doit contenir au moins 8 caractères.')
    }

    setSaving(true)

    try {
      // Préparer toutes les données à envoyer au webhook n8n
      const payload = {
        // ID du thérapeute pour la mise à jour
        therapist_id: therapist.id,
        
        // Données personnelles
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        inami_number: inamiNumber.trim() || undefined,
        email: email.trim(),
        bio: bio.trim() || undefined,
        phone: phone.trim() || undefined,
        booking_url: bookingUrl.trim() || undefined,
        
        // Tarifs
        price_min: priceMin.trim() || undefined,
        price_max: priceMax.trim() || undefined,
        price_unit: priceUnit,
        
        // Sélections
        languages: languages,
        specialties: specialties,
        
        // Localisations (données brutes)
        locations: locations,
      }

      console.log('📤 Sending to n8n webhook:', payload)
      
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_UPDATE_FORMULAIRE
      if (!webhookUrl) {
        throw new Error('URL du webhook n8n non configurée')
      }

      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await res.json()
      
      if (!res.ok) {
        throw new Error(result?.error || result?.message || 'Erreur lors de la mise à jour')
      }

      // Gérer la réponse du webhook n8n
      if (result.success) {
        setMsg(result.message || 'Profil mis à jour avec succès !')
        // Optionnel: recharger les données ou rediriger
      } else {
        setErr(result.error || result.message || 'Erreur lors de la mise à jour du profil')
      }

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
            <label className="mb-1 block text-sm">Prénom</label>
            <input className="input w-full" value={firstName} onChange={e => setFirstName(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Nom</label>
            <input className="input w-full" value={lastName} onChange={e => setLastName(e.target.value)} />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Email professionnel</label>
            <input type="email" className="input w-full" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Numéro INAMI</label>
            <input 
              className="input w-full" 
              placeholder="12345678"
              value={inamiNumber} 
              onChange={e => setInamiNumber(e.target.value)}
            />
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
            <div className="relative">
              <input 
                className="input w-full pl-12" 
                placeholder="123456789"
                value={phone.replace('+32', '')} 
                onChange={e => {
                  const phoneNumber = e.target.value.replace(/\D/g, '') // Only digits
                  setPhone(`+32${phoneNumber}`)
                }}
                maxLength={12}
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+32</span>
            </div>
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
                  <div>
                    <label className="mb-1 block text-sm">Adresse du cabinet</label>
                    <AddressAutocomplete
                      value={loc.address || ''}
                      onChange={(addressData) => {
                        console.log('🏠 AddressAutocomplete onChange:', addressData)
                        updateLoc(idx, {
                          address: addressData.address,
                          postal_code: addressData.postal_code,
                          city: addressData.city,
                          country: addressData.country,
                          lon: addressData.lon,
                          lat: addressData.lat,
                          place_name: addressData.place_name,
                          mapbox_id: addressData.mapbox_id,
                          street: addressData.street,
                          house_number: addressData.house_number,
                          bbox: addressData.bbox,
                        } as Partial<CabinetDraft>)
                      }}
                      placeholder="Tapez une adresse et sélectionnez une suggestion..."
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <div className="mb-1 text-sm text-neutral-600">Villes couvertes</div>
                  
                  {/* Affichage des villes actuellement sélectionnées */}
                  {(loc as DomicileDraft).cities && (loc as DomicileDraft).cities.length > 0 && (
                    <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-sm font-medium text-blue-800 mb-2">
                        Villes actuellement sélectionnées :
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(loc as DomicileDraft).cities.map((nisCode) => (
                          <span 
                            key={nisCode} 
                            className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {cityNames[Number(nisCode)] || `NIS: ${nisCode}`}
                            <button
                              type="button"
                              onClick={() => {
                                const currentCities = (loc as DomicileDraft).cities
                                const newCities = currentCities.filter(c => c !== nisCode)
                                updateLoc(idx, ({ cities: newCities } as Partial<DomicileDraft>))
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <CityAutocompleteMulti
                    value={(loc as DomicileDraft).cities ?? []}
                    onChange={(codes) => updateLoc(idx, ({ cities: codes } as Partial<DomicileDraft>))}
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
