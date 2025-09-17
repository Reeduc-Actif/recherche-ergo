import { supabaseServer } from '@/lib/supabase'
import OnboardForm from '@/components/ui/onboard-form'
import EditBasics from '@/components/ui/edit-basics'

export default async function MyProfile() {
    const supabase = await supabaseServer()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return (
            <main className="mx-auto max-w-xl">
                <h1 className="mb-2 text-2xl font-semibold">Mon profil</h1>
                <p className="text-neutral-700">Vous devez être connecté.</p>
                <p className="text-sm text-neutral-600 mt-2">
                    <a className="underline" href="/pro/inscription">Créer un compte</a>
                    {' '}ou vérifiez votre e-mail de confirmation si vous venez de vous inscrire.
                </p>
            </main>
        )
    }

    // Est-ce que ce user a déjà un therapist ?
    const { data: therapist } = await supabase
        .from('therapists')
        .select('id, slug, full_name, headline, email, phone, booking_url, is_published, is_approved')
        .eq('profile_id', user.id)
        .maybeSingle()

    // Onboarding si pas encore créé
    if (!therapist) {
        return (
            <main className="mx-auto max-w-3xl space-y-6">
                <h1 className="text-2xl font-semibold">Compléter mon profil</h1>
                <OnboardForm userId={user.id} userEmail={user.email ?? ''} />
            </main>
        )
    }

    // Sinon, édition basique
    return (
        <main className="mx-auto max-w-3xl space-y-8">
            <header className="space-y-1">
                <h1 className="text-2xl font-semibold">Mon profil</h1>
                <p className="text-neutral-600">Statut : {therapist.is_published ? 'Publié' : 'Privé'} {therapist.is_approved ? '(validé)' : '(en attente)'}</p>
                <p className="text-sm text-neutral-600">Lien public : <a className="underline" href={`/ergo/${therapist.slug}`} target="_blank">/ergo/{therapist.slug}</a></p>
            </header>

            <EditBasics therapist={therapist} />
        </main>
    )
}
