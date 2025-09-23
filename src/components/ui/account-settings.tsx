'use client'

import { useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabaseBrowser } from '@/lib/supabase-browser'

type Props = {
  initialEmail: string
}

export default function AccountSettings({ initialEmail }: Props) {
  const sb = supabaseBrowser()

  // Email
  const [email, setEmail] = useState<string>(initialEmail)
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailOk, setEmailOk] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)

  // Password
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdOk, setPwdOk] = useState<string | null>(null)
  const [pwdErr, setPwdErr] = useState<string | null>(null)

  // Update email
  const onSaveEmail = async (e: FormEvent) => {
    e.preventDefault()
    setEmailOk(null); setEmailErr(null)
    if (!email) { setEmailErr('E-mail requis.'); return }
    setSavingEmail(true)
    try {
      const { error } = await sb.auth.updateUser({ email })
      if (error) throw error
      setEmailOk('E-mail mis à jour. Vérifiez votre boîte mail pour confirmer si requis.')
    } catch (err) {
      const m = (err as { message?: string })?.message ?? 'Mise à jour e-mail impossible.'
      setEmailErr(m)
    } finally {
      setSavingEmail(false)
    }
  }

  // Update password
  const onSavePwd = async (e: FormEvent) => {
    e.preventDefault()
    setPwdOk(null); setPwdErr(null)
    if (!pwd1 || !pwd2) { setPwdErr('Deux champs requis.'); return }
    if (pwd1 !== pwd2) { setPwdErr('Les mots de passe ne correspondent pas.'); return }
    setSavingPwd(true)
    try {
      const { error } = await sb.auth.updateUser({ password: pwd1 })
      if (error) throw error
      setPwdOk('Mot de passe mis à jour.')
      setPwd1(''); setPwd2('')
    } catch (err) {
      const m = (err as { message?: string })?.message ?? 'Mise à jour mot de passe impossible.'
      setPwdErr(m)
    } finally {
      setSavingPwd(false)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Bloc e-mail */}
      <form onSubmit={onSaveEmail} className="space-y-3 rounded-2xl border p-4">
        <h3 className="font-medium">E-mail</h3>
        <div>
          <label className="mb-1 block text-sm">Adresse e-mail</label>
          <input
            type="email"
            className="input w-full"
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </div>
        <button type="submit" className="btn w-full" disabled={savingEmail}>
          {savingEmail ? 'Enregistrement…' : 'Mettre à jour l’e-mail'}
        </button>
        {emailOk && <p className="text-sm text-green-700">{emailOk}</p>}
        {emailErr && <p className="text-sm text-red-700">{emailErr}</p>}
      </form>

      {/* Bloc mot de passe */}
      <form onSubmit={onSavePwd} className="space-y-3 rounded-2xl border p-4">
        <h3 className="font-medium">Mot de passe</h3>
        <div>
          <label className="mb-1 block text-sm">Nouveau mot de passe</label>
          <input
            type="password"
            className="input w-full"
            value={pwd1}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPwd1(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <div>
          <label className="mb-1 block text-sm">Confirmer</label>
          <input
            type="password"
            className="input w-full"
            value={pwd2}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPwd2(e.target.value)}
            autoComplete="new-password"
            required
          />
        </div>
        <button type="submit" className="btn w-full" disabled={savingPwd}>
          {savingPwd ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}
        </button>
        {pwdOk && <p className="text-sm text-green-700">{pwdOk}</p>}
        {pwdErr && <p className="text-sm text-red-700">{pwdErr}</p>}
      </form>
    </div>
  )
}
