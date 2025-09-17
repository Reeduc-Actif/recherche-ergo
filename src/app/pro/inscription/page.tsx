'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ProSignup() {
    const sb = supabaseBrowser()
    const [loading, setLoading] = useState(false)
    const [ok, setOk] = useState<null | string>(null)
    const [err, setErr] = useState<null | string>(null)

    const [form, setForm] = useState({
        email: '',
        password: '',
        password2: '',
        first_name: '',
        last_name: '',
        phone: '',
    })

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null); setOk(null)
        if (!form.email || !form.password) { setErr('E-mail et mot de passe requis.'); return }
        if (form.password !== form.password2) { setErr('Les mots de passe ne correspondent pas.'); return }
        setLoading(true)
        try {
            const origin = window.location.origin
            const { error } = await sb.auth.signUp({
                email: form.email,
                password: form.password,
                options: {
                    emailRedirectTo: `${origin}/pro/mon-profil`,
                    data: {
                        full_name: `${form.first_name} ${form.last_name}`.trim(),
                        phone: form.phone,
                        role: 'therapist',
                    },
                },
            })
            if (error) throw error
            setOk("Merci ! Vérifiez votre boîte mail pour confirmer votre compte. Vous serez redirigé vers votre profil.")
        } catch (e: any) {
            setErr(e?.message ?? 'Une erreur est survenue.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto max-w-xl space-y-6">
            <h1 className="text-2xl font-semibold">Créer mon compte ergo</h1>

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
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
                <div>
                    <label className="mb-1 block text-sm">Téléphone</label>
                    <input className="input" value={form.phone} onChange={e => setForm(v => ({ ...v, phone: e.target.value }))} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">E-mail</label>
                    <input type="email" className="input" value={form.email} onChange={e => setForm(v => ({ ...v, email: e.target.value }))} />
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                    <div>
                        <label className="mb-1 block text-sm">Mot de passe</label>
                        <input type="password" className="input" value={form.password} onChange={e => setForm(v => ({ ...v, password: e.target.value }))} />
                    </div>
                    <div>
                        <label className="mb-1 block text-sm">Confirmer</label>
                        <input type="password" className="input" value={form.password2} onChange={e => setForm(v => ({ ...v, password2: e.target.value }))} />
                    </div>
                </div>

                <button disabled={loading} className="btn">{loading ? 'Envoi…' : 'Créer mon compte'}</button>
                {ok && <p className="text-sm text-green-700">{ok}</p>}
                {err && <p className="text-sm text-red-700">{err}</p>}
            </form>

            <p className="text-sm text-neutral-600">
                Déjà un compte ? <a className="underline" href="/pro/mon-profil">Accéder à mon profil</a>
            </p>
        </main>
    )
}
