// app/pro/compte-ergo/page.tsx
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import OnboardForm from '@/components/ui/onboard-form'
import EditTherapistAll from '@/components/ui/edit-therapist-all'

export const dynamic = 'force-dynamic'

export default async function ProCompteErgoPage() {
  const sb = await supabaseServer()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) redirect('/pro/connexion')

  const { data: therapist, error: therapistError } = await sb
    .from('therapists')
    .select(`
      id, slug, profile_id, first_name, last_name, full_name, inami_number, email, bio, phone, booking_url,
      price_hint, is_published, is_approved, price_min, price_max, price_unit
    `)
    .eq('profile_id', user.id)
    .maybeSingle()

  // Debug pour comprendre le problème
  console.log('🔍 Debug compte-ergo:')
  console.log('User ID:', user.id)
  console.log('Therapist found:', !!therapist)
  console.log('Therapist data:', therapist)
  console.log('Error:', therapistError)

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mon profil ergothérapeute</h1>
        {therapist?.slug && <Link href={`/ergo/${therapist.slug}`} className="btn">Voir ma fiche publique</Link>}
      </div>

      {/* Debug temporaire */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg text-sm">
        <strong>Debug:</strong><br/>
        User ID: {user.id}<br/>
        Therapist trouvé: {therapist ? 'OUI' : 'NON'}<br/>
        {therapist && `Therapist ID: ${therapist.id}`}<br/>
        {therapistError && `Erreur: ${therapistError.message}`}
      </div>

      {!therapist ? (
        <>
          <p className="text-sm text-neutral-700">
            Bienvenue ! Complétez ces informations pour créer votre fiche visible dans la recherche.
          </p>
          <OnboardForm />
        </>
      ) : (
        <EditTherapistAll therapist={therapist} />
      )}
    </main>
  )
}
