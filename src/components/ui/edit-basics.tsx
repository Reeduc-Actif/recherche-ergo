'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export type TherapistBasics = {
    id: string
    full_name: string | null
    headline: string | null
    phone: string | null
    booking_url: string | null
    is_published: boolean | null
}

export default function EditBasics({ therapist }: { therapist: TherapistBasics }) {
    const sb = supabaseBrowser()
    const [form, setForm] = useState({
        full_name: therapist.full_name ?? '',
        headline: therapist.headline ?? '',
        phone: therapist.phone ?? '',
        booking_url: therapist.booking_url ?? '',
        is_published: Boolean(therapist.is_published),
    })
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    const onSave = async () => {
        setSaving(true); setMsg(null)
        const { error } = await sb.from('therapists').update({
            full_name: form.full_name || null,
            headline: form.headline || null,
            phone: form.phone || null,
            booking_url: form.booking_url || null,
            is_published: form.is_published,
        }).eq('id', therapist.id)
        setSaving(false)
        setMsg(error ? error.message : 'Enregistré.')
    }

    return (
        <section className="space-y-4 rounded-2xl border p-4">
            <h2 className="text-lg font-medium">Informations de base</h2>
            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm">Nom complet</label>
                    <input className="input" value={form.full_name} onChange={e => setForm(v => ({ ...v, full_name: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Titre / headline</label>
                    <input className="input" value={form.headline} onChange={e => setForm(v => ({ ...v, headline: e.target.value }))} />
                </div>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm">Téléphone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm">Lien de RDV</label>
                    <input className="input" value={form.booking_url} onChange={e => setForm(v => ({ ...v, booking_url: e.target.value }))} />
                </div>
            </div>
            <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={form.is_published} onChange={e => setForm(v => ({ ...v, is_published: e.target.checked }))} />
                Rendre mon profil public
            </label>

            <button className="btn" onClick={onSave} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
            {msg && <p className="text-sm text-neutral-700">{msg}</p>}
        </section>
    )
}
