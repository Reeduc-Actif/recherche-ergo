'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Tab = 'password' | 'magic'

export default function ProLoginPage() {
    const sb = supabaseBrowser()
    const router = useRouter()

    const [tab, setTab] = useState<Tab>('password')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [loadingPwd, setLoadingPwd] = useState(false)
    const [loadingMagic, setLoadingMagic] = useState(false)

    const [err, setErr] = useState<string | null>(null)
    const [ok, setOk] = useState<string | null>(null)

    // --- Connexion par mot de passe
    const onSubmitPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null); setOk(null)
        if (!email || !password) { setErr('E-mail et mot de passe requis.'); return }
        setLoadingPwd(true)
        try {
            const { error } = await sb.auth.signInWithPassword({ email, password })
            if (error) throw error

            // Sync cookies côté serveur (indispensable pour pages SSR)
            const { data: sess } = await sb.auth.getSession()
            await fetch('/auth/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ event: 'SIGNED_IN', session: sess.session }),
            })

            router.replace('/pro/mon-profil')
        } catch (e: unknown) {
            setErr((e as { message?: string })?.message ?? 'Connexion impossible.')
        } finally {
            setLoadingPwd(false)
        }
    }

    // --- Lien magique
    const sendMagicLink = async () => {
        setErr(null); setOk(null)
        if (!email) { setErr('Saisissez votre e-mail.'); return }
        setLoadingMagic(true)
        try {
            const origin = window.location.origin
            // Redirige d’abord vers /auth/callback (GET) qui va "échanger" le code et poser les cookies,
            // puis /pro/mon-profil.
            const { error } = await sb.auth.signInWithOtp({
                email,
                options: { emailRedirectTo: `${origin}/auth/callback?next=/pro/mon-profil` },
            })
            if (error) throw error
            setOk('Lien envoyé ! Vérifiez votre boîte mail.')
        } catch (e: unknown) {
            setErr((e as { message?: string })?.message ?? 'Envoi du lien impossible.')
        } finally {
            setLoadingMagic(false)
        }
    }

    // --- Mot de passe oublié
    const sendReset = async () => {
        setErr(null); setOk(null)
        if (!email) { setErr('Saisissez votre e-mail.'); return }
        setLoadingMagic(true)
        try {
            const origin = window.location.origin
            const { error } = await sb.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/auth/callback?next=/pro/mon-profil`,
            })
            if (error) throw error
            setOk('E-mail de réinitialisation envoyé.')
        } catch (e: unknown) {
            setErr((e as { message?: string })?.message ?? 'Impossible d’envoyer l’e-mail.')
        } finally {
            setLoadingMagic(false)
        }
    }

    return (
        <main className="mx-auto max-w-md space-y-6">
            <h1 className="text-2xl font-semibold">Connexion</h1>

            {/* Onglets */}
            <div className="inline-flex rounded-lg border p-1 text-sm">
                <button
                    className={`rounded-md px-3 py-1.5 ${tab === 'password' ? 'bg-neutral-100 font-medium' : ''}`}
                    onClick={() => { setTab('password'); setErr(null); setOk(null) }}
                    type="button"
                >
                    Mot de passe
                </button>
                <button
                    className={`rounded-md px-3 py-1.5 ${tab === 'magic' ? 'bg-neutral-100 font-medium' : ''}`}
                    onClick={() => { setTab('magic'); setErr(null); setOk(null) }}
                    type="button"
                >
                    Lien magique
                </button>
            </div>

            {/* Formulaire commun */}
            <div className="space-y-4 rounded-2xl border p-4">
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

                {tab === 'password' ? (
                    <form onSubmit={onSubmitPassword} className="space-y-4">
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

                        <button type="submit" className="btn w-full" disabled={loadingPwd}>
                            {loadingPwd ? 'Connexion…' : 'Se connecter'}
                        </button>

                        <button type="button" className="btn w-full" onClick={sendReset} disabled={loadingMagic}>
                            {loadingMagic ? 'Envoi…' : 'Mot de passe oublié'}
                        </button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <button type="button" className="btn w-full" onClick={sendMagicLink} disabled={loadingMagic}>
                            {loadingMagic ? 'Envoi…' : 'Recevoir un lien magique'}
                        </button>
                    </div>
                )}

                {ok && <p className="text-sm text-green-700">{ok}</p>}
                {err && <p className="text-sm text-red-700">{err}</p>}
            </div>

            <p className="text-sm text-neutral-700">
                Pas encore de compte ?{' '}
                <Link href="/pro/inscription" className="underline">Créer un compte</Link>
            </p>
        </main>
    )
}
