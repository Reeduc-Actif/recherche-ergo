'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RoleLayout from '@/components/ui/role-layout'
import PlanCard from '@/components/ui/plan-card'
import FormField from '@/components/ui/form-field'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, FileText, Users } from 'lucide-react'

export default function BandagistePage() {
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
      title="Je suis Bandagiste"
      description="Développez votre visibilité et recevez des demandes qualifiées."
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
                'Visibilité avec certification',
                'Devis automatisés (5/mois)',
                'Profil professionnel',
                'Support par email',
                'Badge certification'
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
                'Intégration API'
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
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Certification</h3>
              <p className="text-sm text-neutral-600">
                Badge de certification pour rassurer vos clients et augmenter votre crédibilité
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Devis automatisés</h3>
              <p className="text-sm text-neutral-600">
                Générez des devis professionnels automatiquement à partir des demandes reçues
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Clients qualifiés</h3>
              <p className="text-sm text-neutral-600">
                Recevez uniquement des demandes de clients ayant un besoin réel et documenté
              </p>
            </CardContent>
          </Card>
        </div>

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
