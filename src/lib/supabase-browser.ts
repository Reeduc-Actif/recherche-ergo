// src/lib/supabase-browser.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

export function supabaseBrowser(): SupabaseClient {
    if (client) return client
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    client = createClient(url, key, {
        auth: {
            // storageKey isolé pour éviter les conflits
            storageKey: 'ergo-auth',
            persistSession: true,
            autoRefreshToken: true,
        },
    })
    return client
}
