import Link from 'next/link'
import { Stethoscope, ShieldCheck, Users, Wrench } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ProLanding() {
    return (
        <main className="space-y-12">
            <section className="rounded-2xl border p-6 md:p-10">
                <div className="grid items-center gap-8 md:grid-cols-2">
                    <div className="space-y-4">
                        <h1 className="text-3xl font-semibold">Je suis ergothérapeute</h1>
                        <p className="text-neutral-700">
                            Créez votre compte, complétez votre profil et apparaissez dans la recherche ErgoConnect.
                            Bientôt : outils d’<strong>aménagement du domicile</strong>, génération de rapports, suivi collaboratif.
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <Link href="/pro/inscription"><Button size="lg"><Stethoscope className="mr-2 h-4 w-4" />Créer mon compte</Button></Link>
                            <Link href="/pro/mon-profil"><Button size="lg" variant="outline">Accéder à mon profil</Button></Link>
                        </div>
                        <ul className="mt-2 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
                            <li className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" />Validation e-mail</li>
                            <li className="inline-flex items-center gap-2"><Users className="h-4 w-4" />Visibilité nationale</li>
                            <li className="inline-flex items-center gap-2"><Wrench className="h-4 w-4" />Outils pro (à venir)</li>
                        </ul>
                    </div>
                    <div className="rounded-xl border bg-neutral-50 p-6 text-sm text-neutral-700">
                        <h2 className="mb-2 text-lg font-medium">Comment ça marche ?</h2>
                        <ol className="grid gap-3">
                            <li>1. Inscrivez-vous et validez votre e-mail</li>
                            <li>2. Complétez votre profil (coordonnées, langues, spécialités)</li>
                            <li>3. Ajoutez votre localisation et vos modalités (cabinet/domicile/visio)</li>
                            <li>4. Votre profil apparaît dans la recherche</li>
                        </ol>
                    </div>
                </div>
            </section>
        </main>
    )
}
