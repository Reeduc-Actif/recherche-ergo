'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RoleLayout from '@/components/ui/role-layout'
import PlanCard from '@/components/ui/plan-card'
import FormField from '@/components/ui/form-field'
import InfoBadge from '@/components/ui/info-badge'
import { Badge } from '@/components/ui/badge'
import { Upload, X } from 'lucide-react'

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
  const [formData, setFormData] = useState({
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

  return (
    <RoleLayout
      title="Je suis ergothérapeute"
      description="Mettez en avant votre profil, choisissez votre abonnement, gagnez du temps."
    >
      <div className="space-y-12">
        {/* Plans d'abonnement */}
        <div>
          <h2 className="text-2xl font-semibold mb-8 text-center">Choisissez votre abonnement</h2>
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
              buttonText="Continuer"
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
                'Badge certification'
              ]}
              popular
              buttonText="Continuer"
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
              buttonText="Continuer"
            />
          </div>
        </div>

        {/* Formulaire d'inscription */}
        <Card>
          <CardHeader>
            <CardTitle>Formulaire d'inscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
              Le numéro INAMI sera vérifié automatiquement (intégration ultérieure avec le site RIZIV/INAMI).
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

            <div className="pt-6">
              <Button className="w-full" size="lg">
                Continuer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </RoleLayout>
  )
}
