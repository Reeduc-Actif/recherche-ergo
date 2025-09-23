import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import OnboardForm from '@/components/ui/onboard-form'
import EditBasics from '@/components/ui/edit-basics'
import AccountSettings from '@/components/ui/account-settings' // ⬅️ nouveau

export const dynamic = 'force-dynamic'

export default async function ProProfilePage() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  if (!user) {
    redirect('/pro/connexion')
  }

  // Récupère (ou pas) le thérapeute lié à ce compte
  const { data: therapist } = await sb
    .from('therapists')
    .select('id, slug, full_name, headline, phone, booking_url, is_published')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mon espace</h1>
        {therapist?.slug && (
          <Link href={`/ergo/${therapist.slug}`} className="btn">Voir ma fiche publique</Link>
        )}
      </div>

      {/* === 1) Compte de connexion (email + mot de passe) === */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Compte de connexion</h2>
        <p className="text-sm text-neutral-600">
          Gérez votre e-mail et votre mot de passe utilisés pour vous connecter.
        </p>
        <AccountSettings initialEmail={user.email ?? ''} />
      </section>

      {/* === 2) Profil ergothérapeute (fiche publique) === */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Profil ergothérapeute</h2>
        {!therapist ? (
          <>
            <p className="text-sm text-neutral-700">
              Bienvenue ! Complétez ces informations pour créer votre fiche visible dans la recherche.
            </p>
            <OnboardForm />
          </>
        ) : (
          <EditBasics therapist={therapist} />
        )}
      </section>
    </main>
  )
}
