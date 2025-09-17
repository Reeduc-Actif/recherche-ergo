'use client'

import { useRouter } from 'next/navigation'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function LogoutButton({ className }: { className?: string }) {
    const sb = supabaseBrowser()
    const router = useRouter()

    const onClick = async () => {
        await sb.auth.signOut()
        router.replace('/pro/connexion')
        router.refresh()
    }

    return (
        <button type="button" className={`btn ${className ?? ''}`} onClick={onClick}>
            Se déconnecter
        </button>
    )
}
