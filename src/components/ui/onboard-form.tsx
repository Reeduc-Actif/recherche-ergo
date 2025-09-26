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

// --- composant léger d’autocomplétion sur la table communes_be ---
function CommunePicker({
  value,
  onChange,
}: {
  value: string[]
  onChange: (codes: string[]) => void
}) {
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
      <input
        className="input w-full"
        placeholder="Rechercher une commune…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
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
              <button
                type="button"
                className="ml-1 text-neutral-500"
                onClick={() => onChange(value.filter(c => c !== code))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

type LocationDraft =
  | {
      id?: number
      mode: 'cabinet'
      address: string
      postal_code: string
      city: string
      country: 'BE'
      communes?: never
    }
  | {
      id?: number
      mode: 'domicile'
      address?: string
      postal_code?: string
      city?: string
      country: 'BE'
      communes: string[]          // codes NIS
    }

export default function OnboardForm() {
  const sb = supabaseBrowser()

  // --- spécialités depuis la DB ---
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

  const [loading, setLoading] = useState(false)
  const [ok, setOk] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const [form, setForm] = useState({
    full_name: '',
    headline: '',
    bio: '',
    phone: '',
    website: '',
    booking_url: '',
    languages: [] as string[],
    specialties: [] as string[],
    price_min: '',
    price_max: '',
    price_unit: 'hour' as 'hour' | 'session',
  })

  // --- nouvelles localisations (multi) ---
  const [locations, setLocations] = useState<LocationDraft[]>([
    { mode: 'cabinet', address: '', postal_code: '', city: '', country: 'BE' },
  ])

  const addLocation = (mode: Mode) => {
    setLocations(v => [
      ...v,
      mode === 'cabinet'
        ? { mode, address: '', postal_code: '', city: '', country: 'BE' }
        : { mode, country: 'BE', communes: [] },
    ])
  }
  const removeLocation = (idx: number) => setLocations(v => v.filter((_, i) => i !== idx))
  const updateLoc = (idx: number, patch: Partial<LocationDraft>) =>
    setLocations(v => v.map((l, i) => (i === idx ? { ...l, ...patch } as LocationDraft : l)))

  const toggle = (key: 'languages' | 'specialties', value: string) =>
    setForm(v => ({ ...v, [key]: v[key].includes(value) ? v[key].filter(x => x !== value) : [...v[key], value] }))

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setOk(null); setErr(null)

    if (!form.full_name.trim()) return setErr('Nom complet requis.')
    if (!form.languages.length) return setErr('Sélectionnez au moins une langue.')
    if (!form.specialties.length) return setErr('Sélectionnez au moins une spécialité.')

    // validation localisations
    if (locations.length === 0) return setErr('Ajoutez au moins une localisation.')
    for (const loc of locations) {
      if (loc.mode === 'cabinet') {
        if (!loc.address || !loc.city || !loc.postal_code) {
          return setErr('Chaque cabinet doit avoir adresse, ville et code postal.')
        }
      } else {
        if (!loc.communes || loc.communes.length === 0) {
          return setErr('Chaque zone à domicile doit contenir au moins une commune.')
        }
      }
    }

    const min = form.price_min ? Number(form.price_min) : undefined
    const max = form.price_max ? Number(form.price_max) : undefined
    if (min && max && min > max) return setErr('Le tarif min. ne peut pas dépasser le max.')

    setLoading(true)
    try {
      // IMPORTANT: ton endpoint doit accepter `locations` et gérer:
      // - INSERT therapist (si nouveau) + relations languages/specialties
      // - UPSERT therapist_locations
      // - UPSERT therapist_location_communes pour les entités 'domicile'
      const res = await fetch('/api/pro/onboard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...form,
          price_min: min,
          price_max: max,
          locations, // <— NOUVEAU
        }),
      })
      const json = await res.json()
      if (!res.ok || !json.ok) throw new Error(json?.error || 'Erreur API')
      setOk('Profil créé ! Vous pouvez maintenant voir votre fiche publique.')
      // window.location.assign(`/ergo/${json.slug}`)
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm">Nom complet</label>
          <input className="input" value={form.full_name} onChange={e => setForm(v => ({ ...v, full_name: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Titre / headline</label>
          <input className="input" placeholder="Pédiatrie, troubles DYS…" value={form.headline} onChange={e => setForm(v => ({ ...v, headline: e.target.value }))} />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm">Bio</label>
        <textarea className="input h-28 w-full" value={form.bio} onChange={e => setForm(v => ({ ...v, bio: e.target.value }))} />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">Téléphone</label>
          <input className="input" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Site web</label>
          <input className="input" placeholder="https://…" value={form.website} onChange={e => setForm(v => ({ ...v, website: e.target.value }))} />
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
            <button type="button" className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" onClick={() => addLocation('cabinet')}>Ajouter un cabinet</button>
            <button type="button" className="rounded-lg border px-3 py-1 text-sm hover:bg-neutral-50" onClick={() => addLocation('domicile')}>Ajouter une zone à domicile</button>
          </div>
        </div>

        {locations.map((loc, idx) => (
          <div key={idx} className="rounded-xl border p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                {loc.mode === 'cabinet' ? 'Cabinet' : 'À domicile'}
              </div>
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

      {/* Tarifs */}
      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-sm">Tarif min (€)</label>
          <input className="input" inputMode="numeric" value={form.price_min} onChange={e => setForm(v => ({ ...v, price_min: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Tarif max (€)</label>
          <input className="input" inputMode="numeric" value={form.price_max} onChange={e => setForm(v => ({ ...v, price_max: e.target.value }))} />
        </div>
        <div>
          <label className="mb-1 block text-sm">Unité</label>
          <select className="input" value={form.price_unit} onChange={e => setForm(v => ({ ...v, price_unit: e.target.value as 'hour' | 'session' }))}>
            <option value="hour">Par heure</option>
            <option value="session">Par séance</option>
          </select>
        </div>
      </div>

      <button disabled={loading} className="btn">{loading ? 'Enregistrement…' : 'Créer mon profil'}</button>
      {ok && <p className="text-sm text-green-700">{ok}</p>}
      {err && <p className="text-sm text-red-700">{err}</p>}
    </form>
  )
}
