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
    const sb = supabaseBrowser()
    const [loading, setLoading] = useState(false)
    const [ok, setOk] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)

    // spécialités dynamiques (depuis ta table)
    const [specs, setSpecs] = useState<{ slug: string; label: string; parent_slug: string | null }[]>([])
    useEffect(() => {
        sb.from('specialties').select('slug,label,parent_slug').then(({ data }) => setSpecs(data ?? []))
    }, [sb])

    const roots = useMemo(() => specs.filter(s => !s.parent_slug), [specs])
    const childrenBy = useMemo(() => {
        const m: Record<string, { slug: string; label: string }[]> = {}
        specs.forEach(s => {
            if (s.parent_slug) { (m[s.parent_slug] ||= []).push({ slug: s.slug, label: s.label }) }
        })
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
        lat: '',
        lng: '',
        modes: [] as string[],
    })

    const toggle = (key: 'languages' | 'specialties' | 'modes', value: string) =>
        setForm(v => ({
            ...v, [key]: v[key as keyof typeof v].includes(value)
                ? (v[key as keyof typeof v] as string[]).filter(x => x !== value)
                : [...(v[key as keyof typeof v] as string[]), value]
        }))

    const geoHere = () => {
        if (!navigator.geolocation) return
        navigator.geolocation.getCurrentPosition((pos) => {
            setForm(v => ({ ...v, lat: String(pos.coords.latitude), lng: String(pos.coords.longitude) }))
        })
    }

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setOk(null); setErr(null)
        if (!form.full_name) { setErr('Nom complet requis.'); return }
        if (!form.languages.length) { setErr('Sélectionnez au moins une langue.'); return }
        if (!form.specialties.length) { setErr('Sélectionnez au moins une spécialité.'); return }
        if (!form.lat || !form.lng) { setErr('Position requise (lat/lng).'); return }

        setLoading(true)
        try {
            // 1) créer therapist
            const slugBase = slugify(form.full_name)
            const slug = await makeUniqueSlug(sb, slugBase)

            const { data: th, error: e1 } = await sb
                .from('therapists')
                .insert({
                    slug,
                    profile_id: userId,
                    full_name: form.full_name,
                    headline: form.headline || null,
                    bio: null,
                    email: userEmail,
                    phone: form.phone || null,
                    website: null,
                    booking_url: form.booking_url || null,
                    price_hint: null,
                    is_published: true,   // on publie directement (tu peux mettre false si modération)
                    is_approved: true,    // idem
                })
                .select('id')
                .single()

            if (e1) throw e1

            const therapist_id = th!.id as string

            // 2) langues
            if (form.languages.length) {
                const rows = form.languages.map(code => ({ therapist_id, language_code: code }))
                const { error: e2 } = await sb.from('therapist_languages').insert(rows)
                if (e2) throw e2
            }

            // 3) spécialités
            if (form.specialties.length) {
                const rows = form.specialties.map(slug => ({ therapist_id, specialty_slug: slug }))
                const { error: e3 } = await sb.from('therapist_specialties').insert(rows)
                if (e3) throw e3
            }

            // 4) localisation
            const lat = Number(form.lat), lng = Number(form.lng)
            const { error: e4 } = await sb.from('therapist_locations').insert({
                therapist_id,
                address: 'Cabinet principal',
                city: null,
                postal_code: null,
                country: 'BE',
                modes: form.modes as any,
                // on stocke coords via WKT côté SQL (Supabase accepte le cast text->geography si tu as un trigger; sinon laisse null)
                coords: null,
                lon: lng,
                lat: lat,
            })
            if (e4) throw e4

            setOk('Profil créé ! Il est maintenant visible dans la recherche.')
            setForm({
                full_name: '', headline: '', phone: '', booking_url: '',
                languages: [], specialties: [], lat: '', lng: '', modes: []
            })
        } catch (e: any) {
            setErr(e?.message ?? 'Erreur inconnue')
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

            <div className="space-y-2">
                <div className="text-sm">Spécialités</div>
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

            <div className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                <div>
                    <label className="mb-1 block text-sm">Latitude</label>
                    <input className="input" value={form.lat} onChange={e => setForm(v => ({ ...v, lat: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Longitude</label>
                    <input className="input" value={form.lng} onChange={e => setForm(v => ({ ...v, lng: e.target.value }))} />
                </div>
                <button type="button" className="btn mt-6" onClick={geoHere}>📍 Ma position</button>
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

function slugify(s: string) {
    return s
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
}

async function makeUniqueSlug(sb: ReturnType<typeof supabaseBrowser>, base: string) {
    let candidate = base
    for (let i = 0; i < 5; i++) {
        const { data } = await sb.from('therapists').select('id').eq('slug', candidate).maybeSingle()
        if (!data) return candidate
        candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`
    }
    return candidate
}
