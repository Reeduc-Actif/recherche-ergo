// components/ui/account-settings.tsx
'use client'

import { useState, type FormEvent, type ChangeEvent } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function AccountSettings({ initialEmail }: { initialEmail: string }) {
  const sb = supabaseBrowser()

  const [email, setEmail] = useState<string>(initialEmail)
  const [savingEmail, setSavingEmail] = useState(false)
  const [emailOk, setEmailOk] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)

  const [pwd1, setPwd1] = useState(''); const [pwd2, setPwd2] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdOk, setPwdOk] = useState<string | null>(null)
  const [pwdErr, setPwdErr] = useState<string | null>(null)

  const onSaveEmail = async (e: FormEvent) => {
    e.preventDefault(); setEmailOk(null); setEmailErr(null); setSavingEmail(true)
    try {
      const { error } = await sb.auth.updateUser({ email })
      if (error) throw error
      setEmailOk('E-mail mis à jour. Confirmez via le lien reçu si demandé.')
    } catch (err) {
      setEmailErr((err as { message?: string })?.message ?? 'Mise à jour e-mail impossible.')
    } finally { setSavingEmail(false) }
  }

  const onSavePwd = async (e: FormEvent) => {
    e.preventDefault(); setPwdOk(null); setPwdErr(null)
    if (!pwd1 || !pwd2) return setPwdErr('Deux champs requis.')
    if (pwd1 !== pwd2) return setPwdErr('Les mots de passe ne correspondent pas.')
    setSavingPwd(true)
    try {
      const { error } = await sb.auth.updateUser({ password: pwd1 })
      if (error) throw error
      setPwdOk('Mot de passe mis à jour.'); setPwd1(''); setPwd2('')
    } catch (err) {
      setPwdErr((err as { message?: string })?.message ?? 'Mise à jour mot de passe impossible.')
    } finally { setSavingPwd(false) }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form onSubmit={onSaveEmail} className="space-y-3 rounded-2xl border p-4">
        <h3 className="font-medium">E-mail</h3>
        <div>
          <label className="mb-1 block text-sm">Adresse e-mail</label>
          <input type="email" className="input w-full"
            value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={savingEmail}>{savingEmail ? 'Enregistrement…' : 'Mettre à jour l’e-mail'}</button>
        {emailOk && <p className="text-sm text-green-700">{emailOk}</p>}
        {emailErr && <p className="text-sm text-red-700">{emailErr}</p>}
      </form>

      <form onSubmit={onSavePwd} className="space-y-3 rounded-2xl border p-4">
        <h3 className="font-medium">Mot de passe</h3>
        <div>
          <label className="mb-1 block text-sm">Nouveau mot de passe</label>
          <input type="password" className="input w-full" value={pwd1} onChange={e => setPwd1(e.target.value)} required />
        </div>
        <div>
          <label className="mb-1 block text-sm">Confirmer</label>
          <input type="password" className="input w-full" value={pwd2} onChange={e => setPwd2(e.target.value)} required />
        </div>
        <button className="btn w-full" disabled={savingPwd}>{savingPwd ? 'Enregistrement…' : 'Mettre à jour le mot de passe'}</button>
        {pwdOk && <p className="text-sm text-green-700">{pwdOk}</p>}
        {pwdErr && <p className="text-sm text-red-700">{pwdErr}</p>}
      </form>
    </div>
  )
}
