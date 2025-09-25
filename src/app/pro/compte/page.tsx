// app/pro/compte/page.tsx
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import AccountSettings from '@/components/ui/account-settings'

export const dynamic = 'force-dynamic'

export default async function ProComptePage() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/pro/connexion')

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-2xl font-semibold">Mon compte</h1>
      <p className="text-sm text-neutral-600">Gérez votre e-mail et votre mot de passe de connexion.</p>
      <AccountSettings />
    </main>
  )
}
