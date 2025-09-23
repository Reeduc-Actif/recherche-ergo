import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export default async function ProProfilePage() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()

  if (!user) {
    redirect('/pro/connexion')
  }

  // Vérifie si l’ergo a déjà une fiche
  const { data: therapist } = await sb
    .from('therapists')
    .select('slug')
    .eq('profile_id', user.id)
    .maybeSingle()

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mon espace</h1>
        {therapist?.slug && (
          <Link href={`/ergo/${therapist.slug}`} className="btn">
            Voir ma fiche publique
          </Link>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Lien vers compte de connexion */}
        <div className="rounded-2xl border p-6 space-y-3">
          <h2 className="text-lg font-medium">Compte de connexion</h2>
          <p className="text-sm text-neutral-600">
            Gérez votre e-mail et votre mot de passe utilisés pour vous connecter.
          </p>
          <Link href="/pro/compte" className="btn w-full">
            Accéder
          </Link>
        </div>

        {/* Lien vers compte ergo */}
        <div className="rounded-2xl border p-6 space-y-3">
          <h2 className="text-lg font-medium">Profil ergothérapeute</h2>
          <p className="text-sm text-neutral-600">
            Modifiez vos informations professionnelles visibles dans la recherche.
          </p>
          <Link href="/pro/compte-ergo" className="btn w-full">
            Accéder
          </Link>
        </div>
      </div>
    </main>
  )
}
