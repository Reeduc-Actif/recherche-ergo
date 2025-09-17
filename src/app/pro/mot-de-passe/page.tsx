'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ProForgotPasswordPage() {
    const sb = supabaseBrowser()
    const [email, setEmail] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null); setMsg(null)
        if (!email) { setErr('Indiquez votre e-mail.'); return }
        setLoading(true)
        try {
            const origin = window.location.origin
            const { error } = await sb.auth.resetPasswordForEmail(email, {
                redirectTo: `${origin}/pro/changer-mot-de-passe`,
            })
            if (error) throw error
            setMsg('E-mail envoyé. Ouvrez le lien reçu pour définir un nouveau mot de passe.')
        } catch (e: unknown) {
            const m = e instanceof Error ? e.message : 'Envoi impossible.'
            setErr(m)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto max-w-md space-y-6">
            <h1 className="text-2xl font-semibold">Mot de passe oublié</h1>
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
                <div>
                    <label className="mb-1 block text-sm">E-mail</label>
                    <input type="email" className="input" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <button disabled={loading} className="btn w-full">
                    {loading ? 'Envoi…' : 'Recevoir le lien de réinitialisation'}
                </button>
                {msg && <p className="text-sm text-green-700">{msg}</p>}
                {err && <p className="text-sm text-red-700">{err}</p>}
            </form>
        </main>
    )
}
