'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ProLoginPage() {
    const sb = supabaseBrowser()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null); setMsg(null)
        if (!email || !password) { setErr('E-mail et mot de passe requis.'); return }
        setLoading(true)
        try {
            const { error } = await sb.auth.signInWithPassword({ email, password })
            if (error) throw error
            router.replace('/pro/mon-profil')
            router.refresh()
        } catch (e: unknown) {
            const m = e instanceof Error ? e.message : 'Impossible de vous connecter.'
            setErr(m)
        } finally {
            setLoading(false)
        }
    }

    const sendMagicLink = async () => {
        if (!email) { setErr('Indiquez votre e-mail.'); return }
        setErr(null); setMsg(null); setLoading(true)
        try {
            const origin = window.location.origin
            const { error } = await sb.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${origin}/pro/mon-profil` },
            })
            if (error) throw error
            setMsg('Lien magique envoyé. Vérifiez votre boîte mail.')
        } catch (e: unknown) {
            const m = e instanceof Error ? e.message : 'Envoi impossible.'
            setErr(m)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto max-w-md space-y-6">
            <h1 className="text-2xl font-semibold">Me connecter</h1>

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
                <div>
                    <label className="mb-1 block text-sm">E-mail</label>
                    <input
                        type="email"
                        className="input"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        autoComplete="email"
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Mot de passe</label>
                    <input
                        type="password"
                        className="input"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                <button disabled={loading} className="btn w-full">
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>

                <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={sendMagicLink} className="underline">
                        Recevoir un lien magique
                    </button>
                    <a className="underline" href="/pro/mot-de-passe">Mot de passe oublié ?</a>
                </div>

                {msg && <p className="text-sm text-green-700">{msg}</p>}
                {err && <p className="text-sm text-red-700">{err}</p>}
            </form>

            <p className="text-sm text-neutral-600">
                Pas encore de compte ? <a className="underline" href="/pro/inscription">Créer mon compte</a>
            </p>
        </main>
    )
}
