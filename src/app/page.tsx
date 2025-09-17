// src/app/page.tsx
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  MapPin,
  Search,
  ShieldCheck,
  Users,
  Stethoscope,
  Home as HomeIcon,
  Wrench
} from "lucide-react"

export default function Home() {
  return (
    <main className="space-y-24">
      {/* HERO */}
      <section className="relative overflow-hidden rounded-2xl border bg-hero p-8 md:p-12">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/70 dark:to-transparent" />
        <div className="relative z-10 grid items-center gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur">
              <ShieldCheck className="h-4 w-4" />
              Plateforme dédiée à l’ergothérapie en Belgique
            </div>

            <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
              Trouvez Un Ergothérapeute En 2 Clics
            </h1>

            <p className="max-w-prose text-pretty text-neutral-700">
              ErgoConnect vous aide à <strong>localiser</strong> un professionnel,
              filtrer par <strong>spécialités</strong>,
              par <strong>langues</strong> et par <strong>modalités</strong>. Puis à
              <strong> prendre rendez-vous</strong> en ligne.
            </p>

            <div className="flex flex-wrap gap-3">
              <Link href="/recherche">
                <Button size="lg" className="shadow-sm">
                  <Search className="mr-2 h-4 w-4" />
                  Commencer la recherche
                </Button>
              </Link>
              <Link href="/pro">
                <Button size="lg" variant="outline">
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Je suis ergothérapeute
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-neutral-600">
              <div className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                Belgique entière
              </div>
              <div className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                Patients et familles
              </div>
              <div className="inline-flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Prise de RDV en ligne
              </div>
            </div>
          </div>

          {/* Visuel / mock map */}
          <div className="relative">
            <div className="rounded-xl border bg-white/80 p-2 shadow-sm backdrop-blur">
              <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-50">
                {/* Remplace éventuellement par une capture de ta carte */}
                <Image
                  src="/images/hero-map.png"
                  alt="Aperçu de la recherche sur carte"
                  width={960}
                  height={720}
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* AVANTAGES POUR LES PATIENTS */}
      <section className="space-y-10">
        <h2 className="text-2xl font-semibold">Pourquoi ErgoConnect ?</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <Feature
            icon={<Search className="h-5 w-5" />}
            title="Recherche simple"
            desc="Carte interactive, rayon, langues, modalités… pour trouver rapidement un professionnel proche de vous."
          />
          <Feature
            icon={<Stethoscope className="h-5 w-5" />}
            title="Spécialités claires"
            desc="Pédiatrie, adulte, gériatrie, et sous-spécialités détaillées pour mieux orienter votre demande."
          />
          <Feature
            icon={<Calendar className="h-5 w-5" />}
            title="Prise de RDV"
            desc="Accédez au profil, consultez les infos utiles et prenez rendez-vous en ligne."
          />
        </div>
      </section>

      {/* PARTIE PRO / AMÉNAGEMENT */}
      <section className="rounded-2xl border p-6 md:p-10">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">ErgoConnect Pro — Aménagement du domicile</h2>
            <p className="text-neutral-700">
              Un espace dédié aux professionnels : gestion de profils, validation des diplômes,
              et prochainement des outils pour <strong>l’aménagement du domicile</strong> des personnes à mobilité réduite.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/pro/inscription">
                <Button>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Créer mon profil ergo
                </Button>
              </Link>
              <Link href="/amenagement">
                <Button variant="outline">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Découvrir l’aménagement
                </Button>
              </Link>
            </div>
            <ul className="mt-2 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
              <li className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-neutral-600" />
                Validation des diplômes
              </li>
              <li className="inline-flex items-center gap-2">
                <Wrench className="h-4 w-4 text-neutral-600" />
                Génération de rapports
              </li>
              <li className="inline-flex items-center gap-2">
                <Users className="h-4 w-4 text-neutral-600" />
                Collaboration Client–Ergo–Entrepreneur
              </li>
            </ul>
          </div>

          <div className="relative">
            <div className="rounded-xl border bg-white p-6 shadow-sm">
              <ol className="grid gap-4 text-sm">
                <Step n={1} title="Création de compte pro" />
                <Step n={2} title="Mise en ligne du profil (validation)" />
                <Step n={3} title="Activation des outils d’aménagement" />
                <Step n={4} title="Suivi des dossiers avec le client & l’entrepreneur" />
              </ol>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="rounded-2xl border bg-neutral-50 p-8 text-center md:p-12">
        <h3 className="text-balance text-2xl font-semibold">
          Prêt à trouver un ergothérapeute près de chez vous ?
        </h3>
        <p className="mx-auto mt-2 max-w-prose text-neutral-700">
          Filtrez par spécialités, langues et modalités, puis prenez rendez-vous en ligne.
        </p>
        <div className="mt-6 flex justify-center">
          <Link href="/recherche">
            <Button size="lg">
              <Search className="mr-2 h-4 w-4" />
              Lancer une recherche
            </Button>
          </Link>
        </div>
      </section>
    </main>
  )
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
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
