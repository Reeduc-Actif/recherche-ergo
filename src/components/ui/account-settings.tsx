'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

function getErrorMessage(e: unknown, fallback = 'Une erreur est survenue.') {
  if (e instanceof Error) return e.message
  if (typeof e === 'object' && e && 'message' in e && typeof (e as any).message === 'string') {
    return String((e as { message?: string }).message)
  }
  return fallback
}

export default function AccountSettings({ initialEmail }: { initialEmail: string }) {
  const sb = supabaseBrowser()

  // Email (pas besoin d’état si juste affichage)
  const email = initialEmail
  const [newEmail, setNewEmail] = useState('')
  const [emailMsg, setEmailMsg] = useState<string | null>(null)
  const [emailErr, setEmailErr] = useState<string | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  // Password
  const [currentPwd, setCurrentPwd] = useState('')
  const [pwd1, setPwd1] = useState('')
  const [pwd2, setPwd2] = useState('')
  const [pwdMsg, setPwdMsg] = useState<string | null>(null)
  const [pwdErr, setPwdErr] = useState<string | null>(null)
  const [pwdLoading, setPwdLoading] = useState(false)

  const changeEmail = async () => {
    setEmailErr(null); setEmailMsg(null)
    if (!newEmail || newEmail === email) { setEmailErr('Indiquez un nouvel e-mail différent.'); return }
    setEmailLoading(true)
    try {
      const origin = window.location.origin
      const options: { emailRedirectTo?: string } = {
        emailRedirectTo: `${origin}/auth/callback?next=/pro/compte`,
      }
      const { error } = await sb.auth.updateUser({ email: newEmail }, options)
      if (error) throw error
      setEmailMsg('E-mail envoyé. Confirmez via le lien reçu sur la nouvelle adresse.')
    } catch (e: unknown) {
      setEmailErr(getErrorMessage(e, 'Impossible de changer l’e-mail.'))
    } finally {
      setEmailLoading(false)
    }
  }

  const changePassword = async () => {
    setPwdErr(null); setPwdMsg(null)
    if (!currentPwd) { setPwdErr('Saisissez votre mot de passe actuel.'); return }
    if (!pwd1 || !pwd2) { setPwdErr('Nouveau mot de passe requis.'); return }
    if (pwd1 !== pwd2) { setPwdErr('Les mots de passe ne correspondent pas.'); return }
    if (pwd1.length < 8) { setPwdErr('8 caractères minimum.'); return }
    setPwdLoading(true)
    try {
      const { data: me } = await sb.auth.getUser()
      const currentEmail = me.user?.email
      if (!currentEmail) throw new Error('Session invalide.')

      const { error: signInError } = await sb.auth.signInWithPassword({
        email: currentEmail,
        password: currentPwd,
      })
      if (signInError) throw new Error('Mot de passe actuel incorrect.')

      const { error } = await sb.auth.updateUser({ password: pwd1 })
      if (error) throw error

      setPwdMsg('Mot de passe mis à jour.')
      setCurrentPwd(''); setPwd1(''); setPwd2('')
    } catch (e: unknown) {
      setPwdErr(getErrorMessage(e, 'Impossible de mettre à jour le mot de passe.'))
    } finally {
      setPwdLoading(false)
    }
  }

  return (
    <section className="space-y-10">
      {/* Bloc e-mail */}
      <div className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-medium">Adresse e-mail</h2>
        <p className="text-sm text-neutral-600">E-mail actuel : <b>{email}</b></p>
        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            type="email"
            className="input"
            placeholder="Nouvel e-mail"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
          />
          <button className="btn" onClick={changeEmail} disabled={emailLoading}>
            {emailLoading ? 'Envoi…' : 'Changer d’e-mail'}
          </button>
        </div>
        {emailMsg && <p className="text-sm text-green-700">{emailMsg}</p>}
        {emailErr && <p className="text-sm text-red-700">{emailErr}</p>}
      </div>

      {/* Bloc mot de passe */}
      <div className="rounded-2xl border p-6 space-y-4">
        <h2 className="text-lg font-medium">Mot de passe</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm">Mot de passe actuel</label>
            <input type="password" className="input" value={currentPwd} onChange={e => setCurrentPwd(e.target.value)} />
          </div>
          <div />
          <div>
            <label className="mb-1 block text-sm">Nouveau mot de passe</label>
            <input type="password" className="input" value={pwd1} onChange={e => setPwd1(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm">Confirmer</label>
            <input type="password" className="input" value={pwd2} onChange={e => setPwd2(e.target.value)} />
          </div>
        </div>
        <button className="btn" onClick={changePassword} disabled={pwdLoading}>
          {pwdLoading ? 'Mise à jour…' : 'Enregistrer'}
        </button>
        {pwdMsg && <p className="text-sm text-green-700">{pwdMsg}</p>}
        {pwdErr && <p className="text-sm text-red-700">{pwdErr}</p>}
      </div>
    </section>
  )
}
