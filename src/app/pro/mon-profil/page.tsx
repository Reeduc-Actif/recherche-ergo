import { redirect } from 'next/navigation'
import { supabaseServer } from '@/lib/supabase'
import EditBasics, { TherapistBasics } from '@/components/ui/edit-basics'
import OnboardForm from '@/components/ui/onboard-form'
import LogoutButton from '@/components/auth/logout-button' // <— importer le composant client

export default async function ProProfilePage() {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/pro/connexion')

    const { data: th } = await supabase
        .from('therapists')
        .select('id, full_name, headline, phone, booking_url, is_published')
        .eq('profile_id', user.id)
        .maybeSingle<TherapistBasics>()

    return (
        <main className="mx-auto max-w-3xl space-y-6">
            <h1 className="text-2xl font-semibold">Mon profil</h1>

            {!th ? (
                <>
                    <p className="text-sm text-neutral-600">
                        Bienvenue ! Complétez ces informations pour créer votre fiche visible sur la recherche.
                    </p>
                    <OnboardForm userId={user.id} userEmail={user.email ?? ''} />
                </>
            ) : (
                <>
                    <EditBasics therapist={th} />
                    <section className="rounded-2xl border p-4">
                        <LogoutButton />
                    </section>
                </>
            )}
        </main>
    )
}
