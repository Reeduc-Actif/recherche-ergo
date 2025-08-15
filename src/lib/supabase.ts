// src/lib/supabase.ts
import { createBrowserClient, createServerClient, type CookieMethodsServer } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SerializeOptions } from 'cookie'

export const supabaseBrowser = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

export const supabaseServer = async () => {
    const cookieStore = await cookies() // Next 15: async

    // Objet conforme à l'API "nouvelle" de @supabase/ssr
    const cookieMethods: CookieMethodsServer = {
        getAll: async () => cookieStore.getAll(),
        setAll: async (
            toSet: { name: string; value: string; options?: Partial<SerializeOptions> }[]
        ) => {
            try {
                for (const { name, value, options } of toSet) {
                    // next/headers accepte un "sameSite" pouvant être boolean | 'lax' | 'strict' | 'none'
                    cookieStore.set({ name, value, ...(options ?? {}) })
                }
            } catch {
                // possible hors contexte écriture (SSG/ISR) → on ignore
            }
        },
    }

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: cookieMethods }
    )
}
