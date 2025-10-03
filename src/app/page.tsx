// src/app/page.tsx
import Link from "next/link"
import { Button } from "@/components/ui/button"
import Hero from "@/components/ui/hero"
import FeatureCard from "@/components/ui/feature-card"
import Section from "@/components/ui/section"
import MockMap from "@/components/ui/mock-map"
import {
  Calendar,
  Search,
  ShieldCheck,
  Users,
  Stethoscope,
  Home as HomeIcon,
  Wrench
} from "lucide-react"

export default function Home() {
  return (
    <div className="space-y-24">
      {/* HERO */}
      <Hero
        badge={{
          text: "Plateforme dédiée à l'ergothérapie en Belgique",
          icon: <ShieldCheck className="h-4 w-4" />
        }}
        title="Trouvez un ergothérapeute en 2 clics"
        description="ErgoConnect vous aide à localiser un professionnel, filtrer par spécialités, par langues et par modalités. Puis à prendre rendez-vous en ligne."
        primaryButton={{
          text: "Commencer la recherche",
          href: "/recherche",
          icon: <Search className="mr-2 h-4 w-4" />
        }}
        secondaryButton={{
          text: "Je suis ergothérapeute",
          href: "/suivi/ergotherapeute",
          icon: <Stethoscope className="mr-2 h-4 w-4" />
        }}
        visual={<MockMap />}
      />

      {/* AVANTAGES POUR LES PATIENTS */}
      <Section title="Pourquoi ErgoConnect ?">
        <div className="grid gap-4 md:grid-cols-3">
          <FeatureCard
            icon={<Search className="h-5 w-5" />}
            title="Recherche simple"
            description="Carte interactive, rayon, langues, modalités… pour trouver rapidement un professionnel proche de vous."
          />
          <FeatureCard
            icon={<Stethoscope className="h-5 w-5" />}
            title="Spécialités claires"
            description="Pédiatrie, adulte, gériatrie, et sous-spécialités détaillées pour mieux orienter votre demande."
          />
          <FeatureCard
            icon={<Calendar className="h-5 w-5" />}
            title="Prise de RDV"
            description="Accédez au profil, consultez les infos utiles et prenez rendez-vous en ligne."
          />
        </div>
      </Section>

      {/* PARTIE PRO / AMÉNAGEMENT */}
      <Section bordered>
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">ErgoConnect Pro — Aménagement du domicile</h2>
            <p className="text-neutral-700">
              Un espace dédié aux professionnels : gestion de profils, validation des diplômes,
              et prochainement des outils pour <strong>l&apos;aménagement du domicile</strong> des personnes à mobilité réduite.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/suivi/ergotherapeute">
                <Button>
                  <Stethoscope className="mr-2 h-4 w-4" />
                  Créer mon profil ergo
                </Button>
              </Link>
              <Link href="/amenagement">
                <Button variant="outline">
                  <HomeIcon className="mr-2 h-4 w-4" />
                  Découvrir l&apos;aménagement
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
              <h3 className="font-semibold mb-4">Parcours en 4 étapes</h3>
              <ol className="grid gap-4 text-sm">
                <Step n={1} title="Création de compte pro" />
                <Step n={2} title="Mise en ligne du profil" />
                <Step n={3} title="Activation des outils" />
                <Step n={4} title="Suivi des dossiers" />
              </ol>
            </div>
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        </div>
      </Section>

      {/* CTA FINAL */}
      <Section bordered className="bg-neutral-50 text-center">
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
      </Section>
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
