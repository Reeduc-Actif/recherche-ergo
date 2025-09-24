'use client'

import { useState } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function AccountSettings({ initialEmail }: { initialEmail: string }) {
  const sb = supabaseBrowser()

  // Email
  const [email, setEmail] = useState(initialEmail)
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
      const { data: sessionData } = await sb.auth.getSession()
      const origin = window.location.origin

      // Déclenche la confirmation vers le NOUVEL email
      const { error } = await sb.auth.updateUser(
        { email: newEmail },
        {
          emailRedirectTo: `${origin}/auth/callback?next=/pro/compte`,
        } as any // compat optionnel selon version supabase-js
      )
      if (error) throw error

      setEmailMsg('E-mail envoyé. Confirmez via le lien reçu sur la nouvelle adresse.')
    } catch (e: any) {
      setEmailErr(e?.message ?? 'Impossible de changer l’e-mail.')
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
      // 1) Re-vérifier l’identité en réessayant la connexion (ne change rien au compte)
      const { data: me } = await sb.auth.getUser()
      if (!me.user?.email) throw new Error('Session invalide.')
      const { error: signInError } = await sb.auth.signInWithPassword({
        email: me.user.email,
        password: currentPwd,
      })
      if (signInError) throw new Error('Mot de passe actuel incorrect.')

      // 2) Mettre à jour le mot de passe
      const { error } = await sb.auth.updateUser({ password: pwd1 })
      if (error) throw error

      setPwdMsg('Mot de passe mis à jour.')
      setCurrentPwd(''); setPwd1(''); setPwd2('')
    } catch (e: any) {
      setPwdErr(e?.message ?? 'Impossible de mettre à jour le mot de passe.')
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
