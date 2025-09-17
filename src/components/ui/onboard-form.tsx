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

type Props = { userId: string; userEmail: string }

export default function OnboardForm({ userId, userEmail }: Props) {
    // On continue à charger dynamiquement les spécialités
    const sb = supabaseBrowser()
    const [loading, setLoading] = useState(false)
    const [ok, setOk] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)

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

    const [form, setForm] = useState({
        full_name: '',
        headline: '',
        phone: '',
        booking_url: '',

        languages: [] as string[],
        specialties: [] as string[],
        modes: [] as string[],

        address: 'Cabinet principal',
        city: '',
        postal_code: '',
        country: 'BE',

        price_min: '',
        price_max: '',
        price_unit: 'hour' as 'hour' | 'session',
    })

    const toggle = (key: 'languages' | 'specialties' | 'modes', value: string) =>
        setForm(v => ({
            ...v,
            [key]: v[key as keyof typeof v].includes(value)
                ? (v[key as keyof typeof v] as string[]).filter(x => x !== value)
                : [...(v[key as keyof typeof v] as string[]), value],
        }))

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setOk(null); setErr(null)

        if (!form.full_name) return setErr('Nom complet requis.')
        if (!form.languages.length) return setErr('Sélectionnez au moins une langue.')
        if (!form.specialties.length) return setErr('Sélectionnez au moins une spécialité.')
        if (!form.city || !form.postal_code) return setErr('Ville et code postal requis.')

        setLoading(true)
        try {
            const payload = {
                full_name: form.full_name,
                headline: form.headline || undefined,
                phone: form.phone || undefined,
                booking_url: form.booking_url || undefined,
                languages: form.languages,
                specialties: form.specialties,
                modes: form.modes,
                address: form.address || undefined,
                city: form.city,
                postal_code: form.postal_code,
                country: form.country || 'BE',
                price_min: form.price_min ? Number(form.price_min) : undefined,
                price_max: form.price_max ? Number(form.price_max) : undefined,
                price_unit: form.price_unit,
            }

            const r = await fetch('/api/pro/onboard', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify(payload),
            })
            const j = await r.json()
            if (!r.ok || !j.ok) throw new Error(j.error || 'Échec de création')

            setOk('Profil créé ! Il est maintenant visible dans la recherche.')
            setForm({
                full_name: '', headline: '', phone: '', booking_url: '',
                languages: [], specialties: [], modes: [],
                address: 'Cabinet principal', city: '', postal_code: '', country: 'BE',
                price_min: '', price_max: '', price_unit: 'hour',
            })
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue')
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-6 rounded-2xl border p-4">
            <h2 className="text-lg font-medium">Créer ma fiche publique</h2>

            <div className="grid gap-3 md:grid-cols-2">
                <div>
                    <label className="mb-1 block text-sm">Nom complet</label>
                    <input className="input" value={form.full_name} onChange={e => setForm(v => ({ ...v, full_name: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Titre / headline</label>
                    <input className="input" placeholder="Pédiatrie, TND, aménagement…" value={form.headline} onChange={e => setForm(v => ({ ...v, headline: e.target.value }))} />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm">Téléphone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                    <label className="mb-1 block text-sm">Lien de prise de RDV</label>
                    <input className="input" placeholder="https://cal.com/..." value={form.booking_url} onChange={e => setForm(v => ({ ...v, booking_url: e.target.value }))} />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm">Adresse</label>
                    <input className="input" value={form.address} onChange={e => setForm(v => ({ ...v, address: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Ville</label>
                    <input className="input" value={form.city} onChange={e => setForm(v => ({ ...v, city: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Code postal</label>
                    <input className="input" value={form.postal_code} onChange={e => setForm(v => ({ ...v, postal_code: e.target.value }))} />
                </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
                <div>
                    <label className="mb-1 block text-sm">Tarif min (€)</label>
                    <input inputMode="numeric" className="input" value={form.price_min} onChange={e => setForm(v => ({ ...v, price_min: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Tarif max (€)</label>
                    <input inputMode="numeric" className="input" value={form.price_max} onChange={e => setForm(v => ({ ...v, price_max: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Unité</label>
                    <select className="input" value={form.price_unit} onChange={e => setForm(v => ({ ...v, price_unit: e.target.value as 'hour' | 'session' }))}>
                        <option value="hour">€/heure</option>
                        <option value="session">€/séance</option>
                    </select>
                </div>
            </div>

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

            <div>
                <div className="mb-1 text-sm">Spécialités</div>
                <div className="space-y-3">
                    {roots.map(root => (
                        <div key={root.slug} className="rounded-lg border p-3">
                            <div className="mb-2 font-medium">{root.label}</div>
                            <div className="flex flex-wrap gap-2">
                                {(childrenBy[root.slug] ?? []).map(sub => (
                                    <label key={sub.slug} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                                        <input type="checkbox" checked={form.specialties.includes(sub.slug)} onChange={() => toggle('specialties', sub.slug)} />
                                        {sub.label}
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div>
                <div className="mb-1 text-sm">Modalités</div>
                <div className="flex flex-wrap gap-2">
                    {MODES.map(m => (
                        <label key={m.value} className="inline-flex items-center gap-2 rounded-lg border px-2 py-1 text-sm">
                            <input type="checkbox" checked={form.modes.includes(m.value)} onChange={() => toggle('modes', m.value)} />
                            {m.label}
                        </label>
                    ))}
                </div>
            </div>

            <button disabled={loading} className="btn">{loading ? 'Enregistrement…' : 'Créer mon profil'}</button>
            {ok && <p className="text-sm text-green-700">{ok}</p>}
            {err && <p className="text-sm text-red-700">{err}</p>}
        </form>
    )
}
