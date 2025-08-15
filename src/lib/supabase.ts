// src/lib/supabase.ts
import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const supabaseBrowser = () =>
    createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

export const supabaseServer = async () => {
    const cookieStore = await cookies() // Next 15 => async

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            // ✅ nouvelle interface non-dépréciée
            cookies: {
                getAll: async () => cookieStore.getAll(),
                setAll: async (cookiesToSet: { name: string; value: string; options?: any }[]) => {
                    try {
                        for (const { name, value, options } of cookiesToSet) {
                            cookieStore.set({ name, value, ...options })
                        }
                    } catch {
                        // set() peut throw si appelé hors Route Handlers/Server Actions — on ignore silencieusement.
                    }
                },
            },
        }
    )
}
