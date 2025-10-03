import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Section from '@/components/ui/section'
import { Home, Users, Wrench, Search, Mail } from 'lucide-react'

export default function AmenagementPage() {
  return (
    <div className="space-y-16">
      {/* Hero */}
      <Section>
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            Aménagement du domicile
          </h1>
          <p className="max-w-3xl mx-auto text-lg text-neutral-600">
            ErgoConnect Pro propose des outils spécialisés pour l'aménagement du domicile 
            des personnes à mobilité réduite, en facilitant la collaboration entre 
            ergothérapeutes, entrepreneurs et clients.
          </p>
        </div>
      </Section>

      {/* Parcours en 4 étapes */}
      <Section bordered>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold">Parcours en 4 étapes</h2>
            <p className="text-neutral-600">
              Un processus structuré et collaboratif pour garantir des aménagements 
              adaptés aux besoins spécifiques de chaque personne.
            </p>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  1
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Évaluation ergothérapeutique</h3>
                  <p className="text-neutral-600">
                    L'ergothérapeute évalue les besoins, les capacités et l'environnement 
                    de la personne pour définir les aménagements nécessaires.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  2
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Recommandations détaillées</h3>
                  <p className="text-neutral-600">
                    Génération d'un rapport complet avec spécifications techniques, 
                    plans et recommandations d'aménagement.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  3
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Mise en relation avec entrepreneurs</h3>
                  <p className="text-neutral-600">
                    Transmission automatique des recommandations aux entrepreneurs 
                    qualifiés pour la réalisation des travaux.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center flex-shrink-0 font-semibold">
                  4
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Suivi et coordination</h3>
                  <p className="text-neutral-600">
                    Accompagnement tout au long du projet avec suivi des travaux, 
                    validation des réalisations et ajustements si nécessaire.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="rounded-2xl border bg-gradient-to-br from-green-50 to-emerald-100 p-8">
              <div className="text-center space-y-4">
                <Home className="h-16 w-16 mx-auto text-primary" />
                <h3 className="text-xl font-semibold">Aménagement sur mesure</h3>
                <p className="text-neutral-700">
                  Chaque aménagement est conçu spécifiquement pour répondre 
                  aux besoins uniques de la personne et de son environnement.
                </p>
                <div className="pt-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="font-semibold text-primary">100%</div>
                      <div className="text-neutral-600">Personnalisé</div>
                    </div>
                    <div className="text-center">
                      <div className="font-semibold text-primary">24h</div>
                      <div className="text-neutral-600">Réponse garantie</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Section>

      {/* Pour qui ? */}
      <Section title="Pour qui ?" subtitle="Des solutions adaptées à chaque acteur">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Clients & familles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>• Accompagnement personnalisé</li>
                <li>• Recommandations professionnelles</li>
                <li>• Mise en relation avec des entrepreneurs qualifiés</li>
                <li>• Suivi du projet de A à Z</li>
                <li>• Garantie de qualité</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-primary" />
                Ergothérapeutes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>• Outils d'évaluation standardisés</li>
                <li>• Génération automatique de rapports</li>
                <li>• Base de données d'entrepreneurs</li>
                <li>• Suivi des dossiers clients</li>
                <li>• Formation continue</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                Entrepreneurs
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-neutral-600">
                <li>• Demandes qualifiées</li>
                <li>• Spécifications techniques détaillées</li>
                <li>• Devis automatisés</li>
                <li>• Collaboration avec les ergothérapeutes</li>
                <li>• Suivi des projets</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </Section>

      {/* Avantages */}
      <Section bordered>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Avantages pour les professionnels</h3>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Gain de temps avec des outils automatisés</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Standardisation des processus d'évaluation</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Amélioration de la qualité des recommandations</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Collaboration facilitée entre tous les acteurs</span>
              </li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-semibold">Avantages pour les clients</h3>
            <ul className="space-y-2 text-neutral-600">
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Accompagnement professionnel personnalisé</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Aménagements adaptés aux besoins réels</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Suivi transparent du projet</span>
              </li>
              <li className="flex items-start gap-2">
                <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                <span>Garantie de qualité et de conformité</span>
              </li>
            </ul>
          </div>
        </div>
      </Section>

      {/* CTA */}
      <Section className="text-center">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">
            Prêt à commencer votre projet d'aménagement ?
          </h2>
          <p className="text-neutral-600 max-w-2xl mx-auto">
            Que vous soyez un particulier, un ergothérapeute ou un entrepreneur, 
            ErgoConnect vous accompagne dans vos projets d'aménagement du domicile.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/recherche">
              <Button size="lg" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Trouver un ergo
              </Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Nous contacter
              </Button>
            </Link>
          </div>
        </div>
      </Section>
    </div>
  )
}