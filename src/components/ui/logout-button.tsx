'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LogoutButton({ className }: { className?: string }) {
  const sb = supabaseBrowser()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const onClick = async () => {
    setLoading(true)
    try {
      // 1) Déconnexion côté client
      await sb.auth.signOut()

      // 2) Sync des cookies côté serveur (important pour SSR)
      await fetch('/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ event: 'SIGNED_OUT', session: null }),
      })

      // 3) Redirige vers l’accueil (ou /pro/connexion si tu préfères)
      router.replace('/')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className ?? 'btn'}
      disabled={loading}
      aria-label="Se déconnecter"
    >
      {loading ? 'Déconnexion…' : 'Me déconnecter'}
    </button>
  )
}
