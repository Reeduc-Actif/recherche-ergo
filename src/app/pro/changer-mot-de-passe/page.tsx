'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

function getErrorMessage(e: unknown, fallback = 'Impossible de mettre à jour le mot de passe.') {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e && typeof (e as any).message === 'string') {
    return String((e as { message?: string }).message)
  }
  return fallback
}

export default function ProChangePasswordPage() {
  const sb = supabaseBrowser()
  const router = useRouter()
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (!data.session) setErr('Lien invalide ou expiré. Recommencez la procédure.')
    })
  }, [sb])

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErr(null); setMsg(null)
    if (!pwd1 || !pwd2) { setErr('Saisissez un nouveau mot de passe.'); return }
    if (pwd1 !== pwd2) { setErr('Les mots de passe ne correspondent pas.'); return }
    if (pwd1.length < 8) { setErr('8 caractères minimum.'); return }

    setLoading(true)
    try {
      const { error } = await sb.auth.updateUser({ password: pwd1 })
      if (error) throw error
      setMsg('Mot de passe mis à jour. Redirection…')
      setTimeout(() => router.replace('/pro/mon-profil'), 1000)
    } catch (e: unknown) {
      setErr(getErrorMessage(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="mx-auto max-w-md space-y-6">
      <h1 className="text-2xl font-semibold">Définir un nouveau mot de passe</h1>
      <form onSubmit={onSubmit} className="space-y-4 rounded-2xl border p-4">
        <div>
