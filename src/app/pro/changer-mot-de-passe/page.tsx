'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function ProChangePasswordPage() {
    const sb = supabaseBrowser()
    const router = useRouter()
    const [password, setPassword] = useState('')
    const [password2, setPassword2] = useState('')
    const [loading, setLoading] = useState(false)
    const [msg, setMsg] = useState<string | null>(null)
    const [err, setErr] = useState<string | null>(null)

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setErr(null); setMsg(null)
        if (!password || password !== password2) { setErr('Les mots de passe ne correspondent pas.'); return }
        setLoading(true)
        try {
            const { error } = await sb.auth.updateUser({ password })
            if (error) throw error
            setMsg('Mot de passe mis à jour. Vous pouvez vous connecter.')
            router.replace('/pro/connexion')
            router.refresh()
        } catch (e: unknown) {
            const m = e instanceof Error ? e.message : 'Mise à jour impossible.'
            setErr(m)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="mx-auto max-w-md space-y-6">
            <h1 className="text-2xl font-semibold">Définir un nouveau mot de passe</h1>
            <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
                <div>
                    <label className="mb-1 block text-sm">Nouveau mot de passe</label>
                    <input type="password" className="input" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <div>
                    <label className="mb-1 block text-sm">Confirmer</label>
                    <input type="password" className="input" value={password2} onChange={e => setPassword2(e.target.value)} />
                </div>
                <button disabled={loading} className="btn w-full">
                    {loading ? 'Enregistrement…' : 'Valider'}
                </button>
                {msg && <p className="text-sm text-green-700">{msg}</p>}
                {err && <p className="text-sm text-red-700">{err}</p>}
            </form>
        </main>
    )
}
