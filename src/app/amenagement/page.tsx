import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
    Home as HomeIcon,
    Users,
    Stethoscope,
    Wrench,
    FileText,
    ShieldCheck,
    MapPin,
} from "lucide-react"

export const dynamic = "force-dynamic"

export default function AmenagementPage() {
    return (
        <main className="space-y-16">
            {/* HERO */}
            <section className="rounded-2xl border p-6 md:p-10">
                <div className="grid items-center gap-8 md:grid-cols-2">
                    <div className="space-y-5">
                        <span className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium">
                            <HomeIcon className="h-4 w-4" />
                            Aménagement du domicile — ErgoConnect Pro
                        </span>
                        <h1 className="text-balance text-3xl font-semibold md:text-4xl">
                            Facilitez les projets d’aménagement PMR
                        </h1>
                        <p className="max-w-prose text-neutral-700">
                            Un espace collaboratif pensé pour les <strong>clients</strong>, les{" "}
                            <strong>ergothérapeutes</strong> et les <strong>entrepreneurs</strong> :
                            recommandations claires, documents standardisés, suivi de A à Z.
                        </p>

                        <div className="flex flex-wrap gap-3">
                            <Link href="/recherche">
                                <Button size="lg">
                                    <Stethoscope className="mr-2 h-4 w-4" />
                                    Trouver un ergo spécialisé
                                </Button>
                            </Link>
                            <Link href="/pro/inscription">
                                <Button size="lg" variant="outline">
                                    Créer mon profil ergo
                                </Button>
                            </Link>
                            <Link href="/contact">
                                <Button size="lg" variant="outline">
                                    Je suis entrepreneur
                                </Button>
                            </Link>
                        </div>

                        <ul className="mt-1 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
                            <li className="inline-flex items-center gap-2">
                                <ShieldCheck className="h-4 w-4" />
                                Parcours sécurisé & centralisé
                            </li>
                            <li className="inline-flex items-center gap-2">
                                <FileText className="h-4 w-4" />
                                Rapports standardisés
                            </li>
                            <li className="inline-flex items-center gap-2">
                                <Wrench className="h-4 w-4" />
                                Recos matériaux & équipements
                            </li>
                            <li className="inline-flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                Suivi des chantiers
                            </li>
                        </ul>
                    </div>

                    <div className="rounded-xl border bg-white p-6 shadow-sm">
                        <h2 className="mb-4 text-lg font-medium">Le parcours en 4 étapes</h2>
                        <ol className="grid gap-3 text-sm text-neutral-800">
                            <Step n={1} title="Prise de contact & définition des besoins" />
                            <Step n={2} title="Visite, mesures, photos & recommandations ergo" />
                            <Step n={3} title="Chiffrage avec l’entrepreneur & planning" />
                            <Step n={4} title="Travaux, validation, rapport final" />
                        </ol>
                    </div>
                </div>
            </section>

            {/* POUR QUI ? */}
            <section className="space-y-10">
                <h2 className="text-2xl font-semibold">Pour qui ?</h2>
                <div className="grid gap-4 md:grid-cols-3">
                    <Card
                        icon={<Users className="h-5 w-5" />}
                        title="Clients & familles"
                        desc="Comprenez le projet, suivez l’avancement, retrouvez tous vos documents au même endroit."
                    />
                    <Card
                        icon={<Stethoscope className="h-5 w-5" />}
                        title="Ergothérapeutes"
                        desc="Générez des rapports clairs, centralisez les infos et collaborez efficacement."
                    />
                    <Card
                        icon={<Wrench className="h-5 w-5" />}
                        title="Entrepreneurs"
                        desc="Recevez les éléments techniques standardisés, fournissez un chiffrage fiable."
                    />
                </div>
            </section>

            {/* CTA */}
            <section className="rounded-2xl border bg-neutral-50 p-8 text-center md:p-12">
                <h3 className="text-balance text-2xl font-semibold">
                    Lancez votre projet d’aménagement avec un ergothérapeute spécialisé
                </h3>
                <p className="mx-auto mt-2 max-w-prose text-neutral-700">
                    Parcourez la carte, choisissez un professionnel et démarrez la discussion.
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <Link href="/recherche">
                        <Button size="lg">Trouver un ergo</Button>
                    </Link>
                    <Link href="/contact">
                        <Button size="lg" variant="outline">
                            Nous contacter
                        </Button>
                    </Link>
                </div>
            </section>
        </main>
    )
}

function Card({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
    return (
        <div className="rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-neutral-50">
                {icon}
            </div>
            <h3 className="text-base font-medium">{title}</h3>
            <p className="mt-1 text-sm text-neutral-700">{desc}</p>
        </div>
    )
}

function Step({ n, title }: { n: number; title: string }) {
    return (
        <li className="flex items-center gap-3">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border bg-neutral-50 text-xs font-medium">
                {n}
            </span>
            <span>{title}</span>
        </li>
    )
}
