// src/app/pro/connexion/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ProLoginPage() {
    const sb = supabaseBrowser()
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [err, setErr] = useState<string | null>(null)
    const [ok, setOk] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null); setOk(null)
        if (!email || !password) { setErr('E-mail et mot de passe requis.'); return }
        setLoading(true)
        try {
            const { error } = await sb.auth.signInWithPassword({ email, password })
            if (error) { setErr(error.message); return }

            // 1) Récupère la session côté client
            const { data: sess } = await sb.auth.getSession()
            // 2) Pousse-la explicitement au serveur (cookies SSR)
            await fetch('/auth/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ event: 'SIGNED_IN', session: sess.session }),
            })

            // 3) Puis navigue (le serveur te reconnaîtra cette fois)
            window.location.assign('/pro/mon-profil')
        } catch (e) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue.')
        } finally {
            setLoading(false)
        }
    }


    const sendMagicLink = async () => {
        setErr(null); setOk(null)
        if (!email) { setErr('Saisissez votre e-mail.'); return }
        setLoading(true)
        try {
            const origin = window.location.origin
            const { error } = await sb.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${origin}/pro/mon-profil` },
            })
            if (error) setErr(error.message)
            else setOk('Lien envoyé ! Vérifiez votre boîte mail.')
        } catch (e: unknown) {
            setErr(e instanceof Error ? e.message : 'Erreur inconnue.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto max-w-md space-y-6">
            <h1 className="text-2xl font-semibold">Connexion</h1>

            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
                <div>
                    <label className="mb-1 block text-sm">E-mail</label>
                    <input
                        type="email"
                        className="input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                        required
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Mot de passe</label>
                    <input
                        type="password"
                        className="input"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        required
                    />
                </div>

                <button type="submit" className="btn w-full" disabled={loading}>
                    {loading ? 'Connexion…' : 'Se connecter'}
                </button>

                <button type="button" className="btn w-full" onClick={sendMagicLink} disabled={loading}>
                    {loading ? 'Envoi…' : 'Recevoir un lien magique'}
                </button>

                {ok && <p className="text-sm text-green-700">{ok}</p>}
                {err && <p className="text-sm text-red-700">{err}</p>}
            </form>

            <p className="text-sm text-neutral-700">
                Pas encore de compte ?{' '}
                <Link href="/pro/inscription" className="underline">Créer un compte</Link>
            </p>
        </main>
    )
}
