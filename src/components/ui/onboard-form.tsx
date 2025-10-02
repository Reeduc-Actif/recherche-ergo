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

/* use CityPicker component (cities_be repository) */

/* ---------- Spécialités (référentiel) ---------- */
type SpecRow = { slug: string; label: string; parent_slug: string | null }

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

export default function OnboardForm() {
  const sb = supabaseBrowser()

  // --- utilisateur connecté ---
  const [userId, setUserId] = useState<string | null>(null)
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await sb.auth.getUser()
      setUserId(user?.id || null)
    }
    getUser()
  }, [sb])

  // --- spécialités depuis la DB ---
  const [specs, setSpecs] = useState<SpecRow[]>([])
  useEffect(() => {
    sb.from('specialties').select('slug,label,parent_slug').then(({ data }) => setSpecs((data ?? []) as SpecRow[]))
  }, [sb])

  const roots = useMemo(() => specs.filter(s => !s.parent_slug), [specs])
  const childrenBy = useMemo(() => {
    const m: Record<string, { slug: string; label: string }[]> = {}
    specs.forEach(s => { if (s.parent_slug) (m[s.parent_slug] ||= []).push({ slug: s.slug, label: s.label }) })
    Object.values(m).forEach(arr => arr.sort((a, b) => a.label.localeCompare(b.label, 'fr')))
    return m
  }, [specs])

  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    inami_number: '',
    email: '',
    bio: '',
    phone: '',
    booking_url: '',
    languages: [] as string[],
    specialties: [] as string[],
    price_min: '',
    price_max: '',
    price_unit: 'hour' as 'hour' | 'session',
  })

  // --- nouvelles localisations (multi) ---
  const [locations, setLocations] = useState<LocationDraft[]>([
    { mode: 'cabinet', address: '', street: '', house_number: '', postal_code: '', city: '', country: 'BE' },
  ])

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


  const toggle = (key: 'languages' | 'specialties', value: string) =>
    setForm(v => ({ ...v, [key]: v[key].includes(value) ? v[key].filter(x => x !== value) : [...v[key], value] }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOk(null); setErr(null)

    // Validations minimales côté frontend
    if (!userId) return setErr('Vous devez être connecté pour créer un profil.')
    if (!form.first_name.trim()) return setErr('Le prénom est requis.')
    if (!form.last_name.trim()) return setErr('Le nom est requis.')
    if (!form.email.trim()) return setErr('L\'email est requis.')
    if (!form.specialties.length) return setErr('Veuillez sélectionner au moins une spécialité.')
    if (!form.languages.length) return setErr('Veuillez sélectionner au moins une langue.')
    if (locations.length === 0) return setErr('Veuillez ajouter au moins une localisation.')
    
    // Validation email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(form.email)) return setErr('L\'email n\'est pas valide.')
    
    // Validation INAMI (optionnel mais si rempli, doit avoir 8+ caractères)
    if (form.inami_number && form.inami_number.length < 8) {
      return setErr('Le numéro INAMI doit contenir au moins 8 caractères.')
    }

    setLoading(true)

    try {
      // Préparer toutes les données à envoyer au webhook n8n
      const payload = {
        // ID du profil utilisateur
        profile_id: userId,
        
        // Données personnelles
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        inami_number: form.inami_number.trim() || undefined,
        email: form.email.trim(),
        bio: form.bio.trim() || undefined,
        phone: form.phone.trim() || undefined,
        booking_url: form.booking_url.trim() || undefined,
        
        // Tarifs
        price_min: form.price_min.trim() || undefined,
        price_max: form.price_max.trim() || undefined,
        price_unit: form.price_unit,
        
        // Sélections
        languages: form.languages,
        specialties: form.specialties,
        
        // Localisations (données brutes)
        locations: locations,
      }

      console.log('📤 Sending to n8n webhook:', payload)
      
      const webhookUrl = process.env.NEXT_PUBLIC_N8N_WEBHOOK_VALIDATION_FORMULAIRE
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
        throw new Error(result?.error || result?.message || 'Erreur lors de la validation')
      }

      // Gérer la réponse du webhook n8n
      if (result.success) {
        setOk(result.message || 'Profil créé avec succès !')
        // Optionnel: redirection ou reset du formulaire
        // window.location.assign(`/ergo/${result.slug}`)
      } else {
        setErr(result.error || result.message || 'Erreur lors de la création du profil')
      }

    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Erreur inconnue'
      setErr(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Prénom</label>
          <input className="input" value={form.first_name} onChange={e => setForm(v => ({ ...v, first_name: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Nom</label>
          <input className="input" value={form.last_name} onChange={e => setForm(v => ({ ...v, last_name: e.target.value }))} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Email professionnel</label>
          <input type="email" className="input" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Numéro INAMI</label>
          <input 
            className="input" 
            placeholder="12345678"
            value={form.inami_number} 
            onChange={e => setForm(v => ({ ...v, inami_number: e.target.value }))}
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm">Bio</label>
        <textarea className="input h-28 w-full" value={form.bio} onChange={e => setForm(v => ({ ...v, bio: e.target.value }))} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Téléphone</label>
          <div className="relative">
            <input 
              className="input pl-12" 
              placeholder="123456789"
              value={form.phone.replace('+32', '')} 
              onChange={e => {
                const phoneNumber = e.target.value.replace(/\D/g, '') // Only digits
                setForm(v => ({ ...v, phone: `+32${phoneNumber}` }))
              }}
              maxLength={12}
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">+32</span>
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm">Lien de prise de RDV</label>
          <input className="input" placeholder="https://cal.com/..." value={form.booking_url} onChange={e => setForm(v => ({ ...v, booking_url: e.target.value }))} />
        </div>
      </div>

      {/* Langues */}
      <div>
        <div className="mb-1 text-sm">Langues</div>
        <div className="flex flex-wrap gap-2">
          {LANGS.map(l => (
            <label key={l.value} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
              <input type="checkbox" checked={form.languages.includes(l.value)} onChange={() => toggle('languages', l.value)} />
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
                    <input
                      type="checkbox"
                      checked={form.specialties.includes(sub.slug)}
                      onChange={() =>
                        setForm(v => ({
                          ...v,
                          specialties: v.specialties.includes(sub.slug)
                            ? v.specialties.filter(s => s !== sub.slug)
                            : [...v.specialties, sub.slug],
                        }))
                      }
                    />
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
              <div className="text-sm font-medium">
                {loc.mode === 'cabinet' ? 'Cabinet' : 'À domicile'}
              </div>
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

      {/* Tarifs */}
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">Tarif min (€)</label>
          <input
            className="input"
            inputMode="numeric"
            value={form.price_min}
            onChange={e => setForm(v => ({ ...v, price_min: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Tarif max (€)</label>
          <input
            className="input"
            inputMode="numeric"
            value={form.price_max}
            onChange={e => setForm(v => ({ ...v, price_max: e.target.value }))}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Unité</label>
          <select
            className="input"
            value={form.price_unit}
            onChange={e => setForm(v => ({ ...v, price_unit: e.target.value as 'hour' | 'session' }))}
          >
            <option value="hour">Par heure</option>
            <option value="session">Par séance</option>
          </select>
        </div>
      </div>

      <button disabled={loading} className="btn">
        {loading ? 'Enregistrement…' : 'Créer mon profil'}
      </button>
      {ok && <p className="text-sm text-green-700">{ok}</p>}
      {err && <p className="text-sm text-red-700">{err}</p>}
    </form>
  )
}
