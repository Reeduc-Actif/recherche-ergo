import { Card, CardContent } from '@/components/ui/card'
import AvatarCard from '@/components/ui/avatar-card'
import Section from '@/components/ui/section'
import { Users, Target, Heart, Award } from 'lucide-react'

const TEAM_MEMBERS = [
  {
    name: 'Marie Dubois',
    role: 'Fondatrice & CEO',
    bio: 'Ergothérapeute avec 15 ans d\'expérience, passionnée par l\'innovation dans le domaine de la santé.',
    image: '/team/marie-dubois.jpg'
  },
  {
    name: 'Jean Martin',
    role: 'CTO',
    bio: 'Développeur full-stack spécialisé dans les solutions de santé digitale et l\'expérience utilisateur.',
    image: '/team/jean-martin.jpg'
  },
  {
    name: 'Sophie Lambert',
    role: 'Directrice Médicale',
    bio: 'Ergothérapeute clinicienne et formatrice, experte en aménagement du domicile et réadaptation.',
    image: '/team/sophie-lambert.jpg'
  },
  {
    name: 'Pierre Rousseau',
    role: 'Responsable Partenariats',
    bio: 'Expert en développement commercial et relations institutionnelles dans le secteur de la santé.',
    image: '/team/pierre-rousseau.jpg'
  }
]

const STATS = [
  { number: '250+', label: 'Ergothérapeutes inscrits' },
  { number: '1200+', label: 'Patients accompagnés' },
  { number: '50+', label: 'Partenaires institutionnels' },
  { number: '98%', label: 'Satisfaction client' }
]

export default function AboutPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <Section>
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            À propos d'ErgoConnect
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-neutral-600">
            ErgoConnect est la première plateforme belge dédiée à l'ergothérapie, 
            créée pour faciliter l'accès aux soins et améliorer la collaboration entre tous les acteurs.
          </p>
        </div>
      </Section>

      {/* Notre équipe */}
      <Section title="Notre équipe" subtitle="Des professionnels passionnés au service de votre santé">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TEAM_MEMBERS.map((member) => (
            <AvatarCard
              key={member.name}
              name={member.name}
              role={member.role}
              bio={member.bio}
              image={member.image}
            />
          ))}
        </div>
      </Section>

      {/* Pourquoi ErgoConnect */}
      <Section bordered>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold">Pourquoi ErgoConnect ?</h2>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Faciliter l'accès à l'ergothérapie</h3>
                  <p className="text-neutral-600">
                    Nous rendons la recherche d'un ergothérapeute simple et intuitive, 
                    avec des filtres précis et une carte interactive pour trouver le professionnel le plus proche.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Clarifier les spécialisations</h3>
                  <p className="text-neutral-600">
                    Chaque ergothérapeute peut détailler ses spécialisations et compétences, 
                    permettant aux patients de faire un choix éclairé selon leurs besoins spécifiques.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Outiller les professionnels</h3>
                  <p className="text-neutral-600">
                    Certification, génération de rapports, outils d'aménagement du domicile : 
                    nous fournissons aux ergothérapeutes tous les outils nécessaires à leur pratique.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Parcours simple & centralisé</h3>
                  <p className="text-neutral-600">
                    Patients, ergothérapeutes, entrepreneurs : tous les acteurs peuvent collaborer 
                    efficacement sur une même plateforme, du diagnostic à la réalisation des aménagements.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
              <h3 className="text-xl font-semibold mb-6 text-center">Notre mission</h3>
              <div className="space-y-4 text-center">
                <p className="text-neutral-700">
                  "Rendre l'ergothérapie accessible à tous en Belgique, 
                  en créant un écosystème numérique qui facilite la rencontre 
                  entre patients et professionnels, tout en soutenant l'excellence 
                  de la pratique ergothérapeutique."
                </p>
                <div className="pt-4 border-t">
                  <p className="text-sm text-neutral-600">
                    ErgoConnect - Fondée en 2024
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Chiffres clés */}
      <Section title="Chiffres clés" subtitle="ErgoConnect en quelques chiffres">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {STATS.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">
                {stat.number}
              </div>
              <div className="text-sm text-neutral-600">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}
