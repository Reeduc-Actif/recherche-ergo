'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import RoleLayout from '@/components/ui/role-layout'
import FormField from '@/components/ui/form-field'
import UploadField from '@/components/ui/upload-field'
import InfoBadge from '@/components/ui/info-badge'
import { Calendar, FileText, Users, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function PatientPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    address: '',
    phone: '',
    birthDate: ''
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <RoleLayout
      title="Je suis Patient"
      description="Trouvez un ergo, suivez votre dossier, centralisez vos documents."
    >
      <div className="space-y-12">
        {/* Plan gratuit */}
        <div className="text-center">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Inscription patient</CardTitle>
              <div className="text-3xl font-bold text-primary">0 €</div>
              <p className="text-sm text-neutral-600">Gratuit pour toujours</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-left">
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Recherche d'ergothérapeutes
                </li>
                <li className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Suivi de dossier
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Communication avec les professionnels
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Stockage sécurisé des documents
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Formulaire d'inscription */}
        <Card>
          <CardHeader>
            <CardTitle>Formulaire d'inscription</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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

            <FormField label="Date de naissance" required>
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleInputChange('birthDate', e.target.value)}
              />
            </FormField>

            <FormField label="Prescription médicale">
              <UploadField
                label=""
                accept=".pdf,.jpg,.jpeg,.png"
                onFilesChange={(files) => console.log('Fichiers sélectionnés:', files)}
              />
            </FormField>

            <InfoBadge type="warning">
              L'upload de fichiers est une démo visuelle (aucun envoi réel).
            </InfoBadge>

            <div className="pt-6 space-y-4">
              <Button className="w-full" size="lg">
                Créer mon compte
              </Button>
              
              <div className="text-center">
                <Link href="/recherche">
                  <Button variant="outline" className="w-full">
                    Commencer une recherche
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Avantages */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Recherche facile</h3>
              <p className="text-sm text-neutral-600">
                Trouvez rapidement un ergothérapeute près de chez vous avec des filtres précis
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Suivi de dossier</h3>
              <p className="text-sm text-neutral-600">
                Centralisez tous vos documents et suivez l'avancement de votre prise en charge
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
              <h3 className="font-semibold mb-2">Communication</h3>
              <p className="text-sm text-neutral-600">
                Échangez directement avec votre ergothérapeute et les autres professionnels
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </RoleLayout>
  )
}
