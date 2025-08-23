'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import { createClient } from '@supabase/supabase-js'

/** ========= Types ========= */
type LocationRow = {
    id: number
    address: string | null
    city: string | null
    postal_code: string | null
    country: string | null
    modes: string[] | null
}

type TherapistRow = {
    id: string
    slug: string | null
    full_name: string
    headline: string | null
    bio: string | null
    phone: string | null
    website: string | null
    booking_url: string | null
    is_published: boolean
    is_approved: boolean
    therapist_locations: LocationRow[]
    therapist_specialties: { specialty_slug: string }[]
}

type MeResponse = { ok: boolean; me?: TherapistRow }

/** ========= Helpers ========= */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const supabaseBrowser = SUPABASE_URL && SUPABASE_ANON
    ? createClient(SUPABASE_URL, SUPABASE_ANON)
    : null

/** Onglets */
const tabs = ['Profil', 'Lieux', 'Certifications'] as const
type Tab = typeof tabs[number]

export default function DashboardPage() {
    const [active, setActive] = useState<Tab>('Profil')
    const [me, setMe] = useState<TherapistRow | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const reload = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/therapists/me', { cache: 'no-store' })
            if (res.status === 401) {
                setError('Non connecté. Merci de vous authentifier.')
                setMe(null)
            } else {
                const json = (await res.json()) as MeResponse
                if (json.ok && json.me) setMe(json.me)
                else setError('Impossible de charger votre fiche.')
            }
        } catch (e) {
            setError('Erreur réseau.')
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { void reload() }, [reload])

    return (
        <main className="mx-auto max-w-5xl space-y-6">
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">Mon espace professionnel</h1>
                <div className="text-sm text-neutral-600">
                    {me?.is_published ? 'Publié' : 'Brouillon'} · {me?.is_approved ? 'Approuvé' : 'En attente'}
                </div>
            </header>

            <nav className="flex gap-2">
                {tabs.map((t) => (
                    <button
                        key={t}
                        className={`rounded-lg border px-3 py-1.5 text-sm ${active === t ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}
                        onClick={() => setActive(t)}
                        type="button"
                    >
                        {t}
                    </button>
                ))}
            </nav>

            {loading && <div className="text-sm text-neutral-600">Chargement…</div>}
            {error && (
                <div className="rounded border bg-red-50 p-3 text-sm text-red-700">
                    {error} {error.includes('Non connecté') && <a className="underline" href="/login">Se connecter</a>}
                </div>
            )}

            {!loading && !error && me && (
                <section className="rounded-xl border p-4">
                    {active === 'Profil' && <ProfilePanel me={me} onSaved={reload} />}
                    {active === 'Lieux' && <LocationsPanel me={me} onSaved={reload} />}
                    {active === 'Certifications' && <CertificationsPanel me={me} onSaved={reload} />}
                </section>
            )}
        </main>
    )
}

/* ============== PROFIL ============== */
function ProfilePanel({ me, onSaved }: { me: TherapistRow; onSaved: () => void }) {
    const [full_name, setFullName] = useState(me.full_name ?? '')
    const [headline, setHeadline] = useState(me.headline ?? '')
    const [bio, setBio] = useState(me.bio ?? '')
    const [phone, setPhone] = useState(me.phone ?? '')
    const [website, setWebsite] = useState(me.website ?? '')
    const [booking_url, setBookingUrl] = useState(me.booking_url ?? '')
    const [specialties, setSpecialties] = useState<string[]>(
        me.therapist_specialties?.map((s) => s.specialty_slug) ?? [],
    )
    const [modes, setModes] = useState<string[]>(
        me.therapist_locations[0]?.modes ?? ['cabinet'],
    )
    const [publish, setPublish] = useState(me.is_published)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    const toggle = (list: string[], v: string) =>
        list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

    const save = useCallback(async () => {
        setSaving(true)
        setMsg(null)
        try {
            const res = await fetch('/api/therapists/me', {
                method: 'PUT',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    full_name,
                    headline,
                    bio,
                    phone,
                    website,
                    booking_url,
                    specialties,
                    modes,
                    publish,
                }),
            })
            const json = await res.json()
            if (json.ok) {
                setMsg('Profil mis à jour.')
                onSaved()
            } else {
                setMsg(json.error || 'Erreur lors de la mise à jour.')
            }
        } catch {
            setMsg('Erreur réseau.')
        } finally {
            setSaving(false)
            setTimeout(() => setMsg(null), 2500)
        }
    }, [bio, booking_url, full_name, headline, modes, onSaved, phone, publish, specialties, website])

    return (
        <div className="grid gap-4">
            <div className="grid gap-2 md:grid-cols-2">
                <Field label="Nom complet">
                    <input className="input" value={full_name} onChange={(e) => setFullName(e.target.value)} />
                </Field>
                <Field label="Accroche (headline)">
                    <input className="input" value={headline} onChange={(e) => setHeadline(e.target.value)} />
                </Field>
                <Field label="Téléphone">
                    <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </Field>
                <Field label="Site web">
                    <input className="input" value={website ?? ''} onChange={(e) => setWebsite(e.target.value)} placeholder="https://…" />
                </Field>
                <Field label="Lien prise de RDV (Cal.com, Doctena…)">
                    <input className="input" value={booking_url ?? ''} onChange={(e) => setBookingUrl(e.target.value)} placeholder="https://…" />
                </Field>
                <Field label="Publier ma fiche">
                    <label className="inline-flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} />
                        <span>Demander publication</span>
                    </label>
                </Field>
                <Field label="Spécialités">
                    <MultiTags
                        options={['pediatrie', 'geriatrie', 'neuro', 'main', 'scolaire']}
                        value={specialties}
                        onChange={(v) => setSpecialties(v)}
                    />
                </Field>
                <Field label="Modes">
                    <MultiTags
                        options={['cabinet', 'domicile', 'visio']}
                        value={modes}
                        onChange={(v) => setModes(v)}
                    />
                </Field>
            </div>

            <Field label="Présentation (bio)">
                <textarea className="input min-h-32" value={bio ?? ''} onChange={(e) => setBio(e.target.value)} />
            </Field>

            <div className="flex items-center gap-3">
                <button className="btn" onClick={save} disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                {msg && <div className="text-sm text-neutral-600">{msg}</div>}
            </div>
        </div>
    )
}

/* ============== LIEUX ============== */
function LocationsPanel({ me, onSaved }: { me: TherapistRow; onSaved: () => void }) {
    // form d’ajout
    const [address, setAddress] = useState('')
    const [postal, setPostal] = useState('')
    const [city, setCity] = useState('')
    const [modes, setModes] = useState<string[]>(['cabinet'])
    const [lat, setLat] = useState<number>(50.8503)
    const [lng, setLng] = useState<number>(4.3517)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)

    // mini mapbox
    const mapRef = useRef<mapboxgl.Map | null>(null)
    const divRef = useRef<HTMLDivElement | null>(null)
    const markerRef = useRef<mapboxgl.Marker | null>(null)

    useEffect(() => {
        if (mapRef.current || !divRef.current || !MAPBOX_TOKEN) return
        mapboxgl.accessToken = MAPBOX_TOKEN
        const m = new mapboxgl.Map({
            container: divRef.current,
            style: 'mapbox://styles/mapbox/streets-v12',
            center: [lng, lat],
            zoom: 11,
        })
        mapRef.current = m
        const mk = new mapboxgl.Marker({ color: 'red', draggable: true })
            .setLngLat([lng, lat]).addTo(m)
        markerRef.current = mk
        mk.on('dragend', () => {
            const p = mk.getLngLat()
            setLng(p.lng); setLat(p.lat)
        })
        return () => m.remove()
    }, [lat, lng])

    const save = useCallback(async () => {
        setSaving(true); setMsg(null)
        try {
            const res = await fetch('/api/therapists/me/locations', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    address, city, postal_code: postal, country: 'BE',
                    modes, lat, lng,
                }),
            })
            const json = await res.json()
            if (json.ok) {
                setMsg('Lieu ajouté.'); setAddress(''); setPostal(''); setCity('')
                onSaved()
            } else setMsg(json.error || 'Erreur lors de l’ajout.')
        } catch {
            setMsg('Erreur réseau.')
        } finally {
            setSaving(false)
            setTimeout(() => setMsg(null), 2500)
        }
    }, [address, city, lat, lng, modes, onSaved, postal])

    return (
        <div className="grid gap-6">
            <div className="rounded border p-3">
                <h3 className="mb-3 font-medium">Ajouter un lieu</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Adresse"><input className="input" value={address} onChange={(e) => setAddress(e.target.value)} /></Field>
                    <Field label="Code postal"><input className="input" value={postal} onChange={(e) => setPostal(e.target.value)} /></Field>
                    <Field label="Ville"><input className="input" value={city} onChange={(e) => setCity(e.target.value)} /></Field>
                    <Field label="Modes"><MultiTags options={['cabinet', 'domicile', 'visio']} value={modes} onChange={setModes} /></Field>
                </div>
                <div ref={divRef} className="mt-3 h-64 w-full rounded border" />
                <div className="mt-2 text-sm text-neutral-600">Lat: {lat.toFixed(5)} — Lng: {lng.toFixed(5)}</div>
                <div className="mt-3">
                    <button className="btn" onClick={save} disabled={saving}>{saving ? 'Ajout…' : 'Ajouter le lieu'}</button>
                    {msg && <span className="ml-3 text-sm text-neutral-600">{msg}</span>}
                </div>
            </div>

            <div>
                <h3 className="mb-2 font-medium">Mes lieux</h3>
                <ul className="divide-y rounded border">
                    {(me.therapist_locations || []).map((l) => (
                        <li key={l.id} className="p-3 text-sm">
                            <div className="font-medium">{[l.address, l.postal_code, l.city].filter(Boolean).join(', ')}</div>
                            <div className="text-neutral-600">{(l.modes || []).join(' · ')}</div>
                        </li>
                    ))}
                    {me.therapist_locations?.length === 0 && (
                        <li className="p-3 text-sm text-neutral-600">Aucun lieu pour l’instant.</li>
                    )}
                </ul>
            </div>
        </div>
    )
}

/* ============== CERTIFICATIONS ============== */
function CertificationsPanel({ me, onSaved }: { me: TherapistRow; onSaved: () => void }) {
    const [title, setTitle] = useState('')
    const [issuer, setIssuer] = useState('')
    const [issueDate, setIssueDate] = useState('')
    const [file, setFile] = useState<File | null>(null)
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const canUpload = Boolean(supabaseBrowser)

    const uploadAndSave = useCallback(async () => {
        setSaving(true); setMsg(null)
        try {
            let file_path: string | null = null

            if (file && canUpload) {
                const key = `therapists/${me.id}/${Date.now()}_${file.name}`
                const { error: upErr } = await supabaseBrowser!
                    .storage.from('certifications').upload(key, file, { cacheControl: '3600', upsert: false })
                if (upErr) throw upErr
                file_path = key
            }

            const res = await fetch('/api/therapists/me/certifications', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({
                    title,
                    issuer: issuer || undefined,
                    issue_date: issueDate || undefined,
                    file_path: file_path ?? 'manual/entered', // fallback si pas d’upload côté client
                }),
            })
            const json = await res.json()
            if (json.ok) {
                setMsg('Certification ajoutée.')
                setTitle(''); setIssuer(''); setIssueDate(''); setFile(null)
                onSaved()
            } else {
                setMsg(json.error || 'Erreur lors de l’enregistrement.')
            }
        } catch {
            setMsg('Erreur réseau / upload.')
        } finally {
            setSaving(false)
            setTimeout(() => setMsg(null), 2500)
        }
    }, [canUpload, file, issueDate, issuer, me.id, onSaved, title])

    return (
        <div className="grid gap-4">
            <div className="rounded border p-3">
                <h3 className="mb-3 font-medium">Ajouter une certification</h3>
                <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Intitulé">
                        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
                    </Field>
                    <Field label="Émetteur">
                        <input className="input" value={issuer} onChange={(e) => setIssuer(e.target.value)} />
                    </Field>
                    <Field label="Date d’obtention">
                        <input className="input" type="date" value={issueDate} onChange={(e) => setIssueDate(e.target.value)} />
                    </Field>
                    <Field label={`Fichier ${canUpload ? '(upload vers Supabase)' : '(upload désactivé: vars manquantes)'}`}>
                        <input className="block w-full text-sm" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                    </Field>
                </div>
                <div className="mt-3">
                    <button className="btn" onClick={uploadAndSave} disabled={saving}>{saving ? 'Ajout…' : 'Ajouter la certification'}</button>
                    {msg && <span className="ml-3 text-sm text-neutral-600">{msg}</span>}
                </div>
            </div>

            <div className="rounded border p-3">
                <h3 className="mb-2 font-medium">Validation & publication</h3>
                <p className="text-sm text-neutral-600">
                    Quand vos éléments sont complets, demandez la publication dans l’onglet <b>Profil</b> (case “Publier ma fiche”).
                    Un admin peut ensuite l’<i>approuver</i> pour qu’elle apparaisse sur la carte publique.
                </p>
            </div>
        </div>
    )
}

/* ============== UI bits ============== */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <label className="grid gap-1">
            <span className="text-sm text-neutral-700">{label}</span>
            {children}
        </label>
    )
}
function MultiTags({
    options, value, onChange,
}: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => {
                const selected = value.includes(opt)
                return (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(selected ? value.filter(v => v !== opt) : [...value, opt])}
                        className={`rounded-lg border px-2 py-1 text-xs ${selected ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-50'}`}
                    >
                        {opt}
                    </button>
                )
            })}
        </div>
    )
}

/* Tailwind helpers (utilise tes classes existantes) */
declare global {
    namespace JSX { interface IntrinsicElements { [elemName: string]: any } }
}
