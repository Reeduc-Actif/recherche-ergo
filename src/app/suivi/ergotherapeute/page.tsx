'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import RoleLayout from '@/components/ui/role-layout'
import PlanCard from '@/components/ui/plan-card'
import FormField from '@/components/ui/form-field'
import InfoBadge from '@/components/ui/info-badge'
import StepWizard from '@/components/ui/step-wizard'
import { Badge } from '@/components/ui/badge'
import { Upload, CheckCircle, Mail, User, Settings } from 'lucide-react'

const LANGUAGES = ['Français', 'Néerlandais', 'Allemand', 'Anglais', 'Espagnol', 'Italien']
const SPECIALIZATIONS = [
  'Pédiatrie',
  'Adulte',
  'Gériatrie',
  'Neurologie',
  'Traumatologie',
  'Développement moteur',
  'Autisme',
  'Réadaptation',
  'Aménagement domicile'
]

export default function ErgotherapeutePage() {
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>([])
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    photo: '',
    firstName: '',
    lastName: '',
    address: '',
    billingAddress: '',
    phone: '',
    agendaUrl: '',
    inamiNumber: ''
  })

  const toggleLanguage = (language: string) => {
    setSelectedLanguages(prev => 
      prev.includes(language) 
        ? prev.filter(l => l !== language)
        : [...prev, language]
    )
  }

  const toggleSpecialization = (specialization: string) => {
    setSelectedSpecializations(prev => 
      prev.includes(specialization) 
        ? prev.filter(s => s !== specialization)
        : [...prev, specialization]
    )
  }

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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <PlanCard
              name="Classique"
              price="0"
              period="/mois"
              features={[
                'Visibilité sans certification',
                'Profil de base',
                'Contact direct',
                'Support par email'
              ]}
              buttonText="Sélectionner"
              onButtonClick={() => setSelectedPlan('classique')}
              className={selectedPlan === 'classique' ? 'ring-2 ring-primary' : ''}
            />
            <PlanCard
              name="Essentiel"
              price="5"
              period="/mois"
              features={[
                'Visibilité avec certification',
                'Profil complet',
                'Intégration formations',
                'Support prioritaire',
                'Badge certification (vérification admin sous 48h)'
              ]}
              popular
              buttonText="Sélectionner"
              onButtonClick={() => setSelectedPlan('essentiel')}
              className={selectedPlan === 'essentiel' ? 'ring-2 ring-primary' : ''}
            />
            <PlanCard
              name="Pro"
              price="60"
              period="/mois"
              features={[
                'Accès bilan automatisé',
                'Réduction formations',
                'Outils avancés',
                'Support dédié',
                'Statistiques détaillées'
              ]}
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
          {/* Photo */}
          <FormField label="Photo de profil" required>
            <div className="border-2 border-dashed border-neutral-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-neutral-400" />
              <p className="text-sm text-neutral-600">Cliquez pour télécharger votre photo</p>
            </div>
          </FormField>

          {/* Informations personnelles */}
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

          <FormField label="Adresse" required>
            <Textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={3}
            />
          </FormField>

          <FormField label="Adresse de facturation">
            <Textarea
              value={formData.billingAddress}
              onChange={(e) => handleInputChange('billingAddress', e.target.value)}
              rows={3}
              placeholder="Identique à l'adresse principale si non renseignée"
            />
          </FormField>

          <FormField label="Téléphone" required>
            <Input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </FormField>

          <FormField label="Agenda en ligne (URL)">
            <Input
              type="url"
              value={formData.agendaUrl}
              onChange={(e) => handleInputChange('agendaUrl', e.target.value)}
              placeholder="https://..."
            />
          </FormField>

          <FormField label="Numéro INAMI" required>
            <Input
              value={formData.inamiNumber}
              onChange={(e) => handleInputChange('inamiNumber', e.target.value)}
              placeholder="Ex: 12345678901"
            />
          </FormField>

          <InfoBadge>
            Le numéro INAMI sera vérifié automatiquement via le site RIZIV/INAMI lors d'une future intégration.
          </InfoBadge>

          {/* Langues parlées */}
          <div className="space-y-2">
            <Label>Langues parlées *</Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((language) => (
                <Badge
                  key={language}
                  variant={selectedLanguages.includes(language) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleLanguage(language)}
                >
                  {language}
                </Badge>
              ))}
            </div>
          </div>

          {/* Spécialisations */}
          <div className="space-y-2">
            <Label>Spécialisations *</Label>
            <div className="flex flex-wrap gap-2">
              {SPECIALIZATIONS.map((specialization) => (
                <Badge
                  key={specialization}
                  variant={selectedSpecializations.includes(specialization) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => toggleSpecialization(specialization)}
                >
                  {specialization}
                </Badge>
              ))}
            </div>
          </div>

          <div className="text-center pt-6">
            <Button 
              className="px-8"
              disabled={!formData.firstName || !formData.lastName || !formData.address || !formData.phone || !formData.inamiNumber || selectedLanguages.length === 0 || selectedSpecializations.length === 0}
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
      title="Je suis ergothérapeute"
      description="Mettez en avant votre profil, choisissez votre abonnement, gagnez du temps."
    >
      <div className="space-y-12">
        {/* Avantages ErgoConnect pour les ergothérapeutes */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-semibold">Avantages ErgoConnect pour les ergothérapeutes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="p-6 border rounded-lg">
              <User className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Visibilité accrue</h3>
              <p className="text-sm text-neutral-600">
                Augmentez votre visibilité auprès des patients et développez votre clientèle
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <Settings className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Outils professionnels</h3>
              <p className="text-sm text-neutral-600">
                Accédez à des outils spécialisés pour l'aménagement du domicile
              </p>
            </div>
            <div className="p-6 border rounded-lg">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Certification</h3>
              <p className="text-sm text-neutral-600">
                Obtenez un badge de certification pour rassurer vos patients
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
