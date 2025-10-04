'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RoleLayout from '@/components/ui/role-layout'
import PlanCard from '@/components/ui/plan-card'
import FormField from '@/components/ui/form-field'
import StepWizard from '@/components/ui/step-wizard'
import InfoBadge from '@/components/ui/info-badge'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, FileText, Users, Mail, User, Settings } from 'lucide-react'

export default function BandagistePage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    company: '',
    phone: '',
    address: '',
    firstName: '',
    lastName: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const steps = [
    {
      id: 'plan',
      title: 'Choisissez votre abonnement',
      description: 'Sélectionnez le plan qui correspond à vos besoins',
      content: (
        <div className="space-y-6">
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
              buttonText="Sélectionner"
              onButtonClick={() => setSelectedPlan('essentiel')}
              className={selectedPlan === 'essentiel' ? 'ring-2 ring-primary' : ''}
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
              buttonText="Sélectionner"
              onButtonClick={() => setSelectedPlan('pro')}
              className={selectedPlan === 'pro' ? 'ring-2 ring-primary' : ''}
            />
          </div>
          {selectedPlan && (
            <div className="text-center">
              <Button 
                onClick={() => setCurrentStep(1)}
                className="px-8"
              >
                Continuer avec le plan {selectedPlan}
              </Button>
            </div>
          )}
        </div>
      )
    },
    {
      id: 'account',
      title: 'Création du compte',
      description: 'Créez votre compte et accédez à la connexion',
      content: (
        <div className="space-y-4">
          <FormField label="Email" required>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="votre@email.com"
            />
          </FormField>
          <FormField label="Mot de passe" required>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
            />
          </FormField>
          <FormField label="Confirmer le mot de passe" required>
            <Input
              type="password"
              value={formData.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
            />
          </FormField>
          <div className="text-center pt-4">
            <Button 
              onClick={() => setCurrentStep(2)}
              disabled={!formData.email || !formData.password || formData.password !== formData.confirmPassword}
            >
              Créer mon compte
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'verification',
      title: 'Vérification du compte',
      description: 'Vérifiez votre compte par email',
      content: (
        <div className="text-center space-y-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <Mail className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-2">Email de vérification envoyé</h3>
            <p className="text-neutral-600 mb-4">
              Un email de vérification a été envoyé à <strong>{formData.email}</strong>
            </p>
            <p className="text-sm text-neutral-500">
              Cliquez sur le lien dans l'email pour vérifier votre compte, puis revenez ici pour continuer.
            </p>
          </div>
          <InfoBadge>
            Cette étape est simulée. En production, vous recevriez un vrai email de vérification.
          </InfoBadge>
          <Button 
            onClick={() => setCurrentStep(3)}
            className="px-8"
          >
            J'ai vérifié mon email
          </Button>
        </div>
      )
    },
    {
      id: 'profile',
      title: 'Encodage des données',
      description: 'Complétez votre profil professionnel',
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Prénom" required>
              <Input
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </FormField>
            <FormField label="Nom" required>
              <Input
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Société" required>
            <Input
              value={formData.company}
              onChange={(e) => handleInputChange('company', e.target.value)}
              placeholder="Nom de votre entreprise"
            />
          </FormField>

          <FormField label="Adresse" required>
            <Input
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Rue, numéro, code postal, ville"
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

          <div className="text-center pt-6">
            <Button 
              className="px-8"
              disabled={!formData.firstName || !formData.lastName || !formData.company || !formData.address || !formData.phone}
            >
              Valider mes données
            </Button>
          </div>
        </div>
      )
    }
  ]

  return (
    <RoleLayout
      title="Je suis Bandagiste"
      description="Développez votre visibilité et recevez des demandes qualifiées."
    >
      <div className="space-y-12">
        {/* Avantages ErgoConnect pour les bandagistes */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Avantages ErgoConnect pour les bandagistes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border rounded-lg">
              <ShieldCheck className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Certification</h3>
              <p className="text-sm text-neutral-600">
                Badge de certification pour rassurer vos clients et augmenter votre crédibilité
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Devis automatisés</h3>
              <p className="text-sm text-neutral-600">
                Générez des devis professionnels automatiquement à partir des demandes reçues
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Clients qualifiés</h3>
              <p className="text-sm text-neutral-600">
                Recevez uniquement des demandes de clients ayant un besoin réel et documenté
              </p>
            </div>
          </div>
        </div>

        {/* Wizard d'inscription */}
        <StepWizard
          steps={steps}
          currentStep={currentStep}
          onStepChange={setCurrentStep}
        />
      </div>
    </RoleLayout>
  )
}
