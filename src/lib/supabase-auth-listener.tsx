// src/components/supabase-auth-listener.tsx
'use client'

import { useEffect } from 'react'
import { supabaseBrowser } from '@/lib/supabase-browser'

export default function SupabaseAuthListener() {
    const sb = supabaseBrowser()

    useEffect(() => {
        const { data: { subscription } } = sb.auth.onAuthStateChange(async (event, session) => {
            // Synchronise la session vers le serveur pour les pages SSR
            await fetch('/auth/callback', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ event, session }),
            })
        })
        return () => subscription.unsubscribe()
    }, [sb])

    return null
}
