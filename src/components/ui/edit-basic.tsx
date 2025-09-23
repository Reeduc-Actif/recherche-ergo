// src/components/ui/edit-basics.tsx
'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

type TherapistBasics = {
  id: string
  slug: string | null
  full_name: string | null
  headline: string | null
  phone: string | null
  booking_url: string | null
  is_published: boolean | null
}

export default function EditBasics({ therapist }: { therapist: TherapistBasics }) {
  const sb = supabaseBrowser()

  // form state
  const [fullName, setFullName] = useState(therapist.full_name ?? '')
  const [headline, setHeadline] = useState(therapist.headline ?? '')
  const [phone, setPhone] = useState(therapist.phone ?? '')
  const [bookingUrl, setBookingUrl] = useState(therapist.booking_url ?? '')
  const [published, setPublished] = useState(Boolean(therapist.is_published))

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

    setSaving(true)
    try {
      const { error } = await sb
        .from('therapists')
        .update({
          full_name: fullName.trim(),
          headline: headline.trim() || null,
          phone: phone.trim() || null,
          booking_url: bookingUrl.trim() || null,
          is_published: published,
        })
        .eq('id', therapist.id)
        .select('id')
        .single()

      if (error) throw error
      setMsg('Profil mis à jour ✅')
    } catch (e: unknown) {
      const m =
        (e as { message?: string })?.message ??
        'Mise à jour impossible. Vérifiez vos droits (RLS) et les champs.'
      setErr(m)
    } finally {
      setSaving(false)
    }
  }

  // toggle publication (bouton dédié si tu veux une action rapide)
  const togglePublish = async () => {
    setErr(null); setMsg(null)
    setSaving(true)
    try {
      const next = !published
      const { error } = await sb
        .from('therapists')
        .update({ is_published: next })
        .eq('id', therapist.id)
        .select('id')
        .single()
      if (error) throw error
      setPublished(next)
      setMsg(next ? 'Votre fiche est publiée.' : 'Votre fiche est masquée.')
    } catch (e: unknown) {
      const m = (e as { message?: string })?.message ?? 'Action impossible.'
      setErr(m)
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
            <input
              className="input w-full"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Titre (headline)</label>
            <input
              className="input w-full"
              value={headline}
              onChange={e => setHeadline(e.target.value)}
              placeholder="Ergothérapeute pédiatrique, adulte…"
            />
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Téléphone</label>
            <input
              className="input w-full"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="+32..."
            />
          </div>
          <div>
            <label className="mb-1 block text-sm">Lien de prise de rendez-vous</label>
            <input
              type="url"
              className="input w-full"
              value={bookingUrl}
              onChange={e => setBookingUrl(e.target.value)}
              placeholder="https://cal.com/… ou https://calendly.com/…"
            />
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={published}
              onChange={e => setPublished(e.target.checked)}
            />
            Rendre ma fiche publique
          </label>

          <div className="flex items-center gap-2">
            <button type="button" className="btn" onClick={togglePublish} disabled={saving}>
              {published ? 'Masquer la fiche' : 'Publier la fiche'}
            </button>
            <button type="submit" className="btn" disabled={saving}>
              {saving ? 'Enregistrement…' : 'Enregistrer'}
            </button>
          </div>
        </div>

        {msg && <p className="text-sm text-green-700">{msg}</p>}
        {err && <p className="text-sm text-red-700">{err}</p>}
      </form>

      {/* Petit rappel du slug (lecture seule) */}
      <p className="text-xs text-neutral-500">
        Slug public : <code>{therapist.slug ?? '—'}</code>
      </p>
    </section>
  )
}
