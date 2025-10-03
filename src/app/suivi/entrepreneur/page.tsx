'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RoleLayout from '@/components/ui/role-layout'
import PlanCard from '@/components/ui/plan-card'
import FormField from '@/components/ui/form-field'
import { Badge } from '@/components/ui/badge'
import { FileText, Clock, Target, Users } from 'lucide-react'

export default function EntrepreneurPage() {
  const [formData, setFormData] = useState({
    company: '',
    email: '',
    phone: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <RoleLayout
      title="Je suis Entrepreneur"
      description="Recevez des recommandations claires, standardisez vos devis."
    >
      <div className="space-y-12">
        {/* Plans d'abonnement */}
        <div>
          <h2 className="text-2xl font-semibold mb-8 text-center">Choisissez votre abonnement</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <PlanCard
              name="Essentiel"
              price="70"
              period="/mois"
              features={[
                'Visibilité sans certification',
                'Devis automatisés (5/mois)',
                'Profil professionnel',
                'Support par email',
                'Templates de devis'
              ]}
              buttonText="Souscrire"
            />
            <PlanCard
              name="Pro"
              price="140"
              period="/mois"
              features={[
                'Visibilité sans certification',
                'Devis automatisés (illimité)',
                'Profil premium',
                'Support prioritaire',
                'Statistiques avancées',
                'Intégration API',
                'Outils de suivi'
              ]}
              popular
              buttonText="Souscrire"
            />
          </div>
        </div>

        {/* Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Standardisation</h3>
              <p className="text-sm text-neutral-600">
                Devis standardisés et professionnels pour tous vos projets d'aménagement
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Clarté</h3>
              <p className="text-sm text-neutral-600">
                Recommandations claires et précises basées sur l'évaluation ergothérapeutique
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Gain de temps</h3>
              <p className="text-sm text-neutral-600">
                Automatisation des devis et suivi des projets pour optimiser votre temps
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Processus */}
        <Card>
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                  1
                </div>
                <h3 className="font-semibold mb-2">Évaluation</h3>
                <p className="text-sm text-neutral-600">
                  L'ergothérapeute évalue les besoins du patient
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                  2
                </div>
                <h3 className="font-semibold mb-2">Recommandation</h3>
                <p className="text-sm text-neutral-600">
                  Recommandations détaillées transmises aux entrepreneurs
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                  3
                </div>
                <h3 className="font-semibold mb-2">Devis</h3>
                <p className="text-sm text-neutral-600">
                  Vous recevez la demande et générez votre devis
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                  4
                </div>
                <h3 className="font-semibold mb-2">Réalisation</h3>
                <p className="text-sm text-neutral-600">
                  Suivi du projet et collaboration avec l'équipe
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire d'intérêt */}
        <Card>
          <CardHeader>
            <CardTitle>Formulaire d'intérêt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField label="Société" required>
              <Input
                value={formData.company}
                onChange={(e) => handleInputChange('company', e.target.value)}
                placeholder="Nom de votre entreprise"
              />
            </FormField>

            <FormField label="Email professionnel" required>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contact@votre-entreprise.be"
              />
            </FormField>

            <FormField label="Téléphone" required>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="+32 XXX XX XX XX"
              />
            </FormField>

            <div className="pt-4">
              <Button className="w-full" size="lg">
                Envoyer ma demande
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleLayout>
  )
}
