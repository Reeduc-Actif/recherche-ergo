// components/ui/edit-therapist-all.tsx
'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

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

  const [fullName, setFullName] = useState(therapist.full_name ?? '')
  const [headline, setHeadline] = useState(therapist.headline ?? '')
  const [bio, setBio] = useState(therapist.bio ?? '')
  const [email, setEmail] = useState(therapist.email ?? '')
  const [phone, setPhone] = useState(therapist.phone ?? '')
  const [website, setWebsite] = useState(therapist.website ?? '')
  const [bookingUrl, setBookingUrl] = useState(therapist.booking_url ?? '')
  const [priceHint, setPriceHint] = useState(therapist.price_hint ?? '')
  const [isPublished, setIsPublished] = useState(Boolean(therapist.is_published))
  const [priceMin, setPriceMin] = useState<string>(therapist.price_min?.toString() ?? '')
  const [priceMax, setPriceMax] = useState<string>(therapist.price_max?.toString() ?? '')
  const [priceUnit, setPriceUnit] = useState<string>(therapist.price_unit ?? '')

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
    const minNum = priceMin ? Number(priceMin) : null
    const maxNum = priceMax ? Number(priceMax) : null
    if (minNum && maxNum && minNum > maxNum) {
      setErr('price_min ne peut pas dépasser price_max.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        full_name: fullName.trim(),
        headline: headline.trim() || null,
        bio: bio.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        website: website.trim() || null,
        booking_url: bookingUrl.trim() || null,
        price_hint: priceHint.trim() || null,
        is_published: isPublished,
        price_min: minNum,
        price_max: maxNum,
        price_unit: priceUnit || null,
      }

      const { error } = await sb.from('therapists')
        .update(payload)
        .eq('id', therapist.id)
        .select('id')
        .single()

      if (error) throw error
      setMsg('Profil ergothérapeute mis à jour ✅')
    } catch (e) {
      setErr((e as { message?: string })?.message ?? 'Mise à jour impossible.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="space-y-4 rounded-2xl border p-4">
      <form onSubmit={onSubmit} className="space-y-4">
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

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">E-mail affiché</label>
            <input type="email" className="input w-full" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Téléphone</label>
            <input className="input w-full" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+32..." />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Site web</label>
            <input type="url" className="input w-full" value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://…" />
          </div>
          <div>
            <label className="mb-1 block text-sm">Lien RDV</label>
            <input type="url" className="input w-full" value={bookingUrl} onChange={e => setBookingUrl(e.target.value)} placeholder="https://cal.com/…" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm">Infos tarifaires (texte libre)</label>
          <input className="input w-full" value={priceHint} onChange={e => setPriceHint(e.target.value)} placeholder="Ex. première séance 60–80€" />
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <label className="mb-1 block text-sm">Prix min</label>
            <input type="number" min={1} max={1000} className="input w-full" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Prix max</label>
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
