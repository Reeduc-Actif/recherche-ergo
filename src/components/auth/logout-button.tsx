'use client'

import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LogoutButton() {
    const sb = supabaseBrowser()
    const router = useRouter()

    return (
        <button
            className="btn"
            onClick={async () => {
                await sb.auth.signOut()
                await fetch('/auth/callback', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'same-origin',
                    body: JSON.stringify({ event: 'SIGNED_OUT', session: null }),
                })
                router.push('/pro/connexion')
            }}
        >
            Se déconnecter
        </button>
    )
}
