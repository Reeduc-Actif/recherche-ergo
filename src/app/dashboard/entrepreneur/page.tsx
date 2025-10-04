'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Settings, 
  CreditCard, 
  FileText,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
  Clock,
  Home
} from 'lucide-react'

// Données mock pour la démo
const MOCK_PROFILE = {
  firstName: 'Pierre',
  lastName: 'Rousseau',
  companyName: 'Aménagement Domicile Bruxelles',
  email: 'contact@amenagement-domicile.be',
  phone: '+32 2 345 67 89',
  address: 'Avenue de la Toison d\'Or 45, 1050 Bruxelles',
  specialties: ['Aménagement domicile', 'Accessibilité', 'Adaptation cuisine', 'Adaptation salle de bain'],
  plan: 'Pro'
}

export default function EntrepreneurDashboardPage() {
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [profileData, setProfileData] = useState(MOCK_PROFILE)

  const handleProfileEdit = () => {
    setIsEditingProfile(true)
  }

  const handleProfileSave = () => {
    setIsEditingProfile(false)
    // En production, sauvegarder les données
  }

  const handleProfileCancel = () => {
    setIsEditingProfile(false)
    setProfileData(MOCK_PROFILE)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Tableau de bord</h1>
          <p className="text-neutral-600">Bienvenue, {profileData.firstName}</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          Plan {profileData.plan}
        </Badge>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">22</p>
                <p className="text-sm text-neutral-600">Devis générés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Home className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-neutral-600">Projets réalisés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Clock className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-neutral-600">En cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">∞</p>
                <p className="text-sm text-neutral-600">Devis illimités</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Section fonctionnalités en attente */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Fonctionnalités en attente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Gestion des projets</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Suivez vos projets d'aménagement de A à Z avec l'ergothérapeute et le client
                  </p>
                  <Badge variant="outline">Bientôt disponible</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Collaboration en temps réel</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Échangez directement avec les ergothérapeutes et clients sur chaque projet
                  </p>
                  <Badge variant="outline">Bientôt disponible</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Outils de suivi</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Planifiez, suivez et facturez vos projets d'aménagement
                  </p>
                  <Badge variant="outline">Bientôt disponible</Badge>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Statistiques avancées</h3>
                  <p className="text-sm text-neutral-600 mb-3">
                    Analysez vos performances et optimisez votre activité
                  </p>
                  <Badge variant="outline">Bientôt disponible</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profil et gestion */}
        <div className="space-y-6">
          {/* Profil personnel */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Mon profil</CardTitle>
                {!isEditingProfile ? (
                  <Button variant="outline" size="sm" onClick={handleProfileEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    Modifier
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleProfileSave}>
                      <Save className="h-4 w-4 mr-2" />
                      Sauver
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleProfileCancel}>
                      <X className="h-4 w-4 mr-2" />
                      Annuler
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isEditingProfile ? (
                <div className="space-y-4">
                  <div>
                    <Label>Nom de l'entreprise</Label>
                    <Input value={profileData.companyName} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Prénom</Label>
                      <Input value={profileData.firstName} />
                    </div>
                    <div>
                      <Label>Nom</Label>
                      <Input value={profileData.lastName} />
                    </div>
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input value={profileData.email} />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input value={profileData.phone} />
                  </div>
                  <div>
                    <Label>Adresse</Label>
                    <Textarea value={profileData.address} />
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold">{profileData.companyName}</p>
                    <p className="text-sm text-neutral-600">{profileData.firstName} {profileData.lastName}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm">{profileData.email}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm">{profileData.phone}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-neutral-500" />
                    <span className="text-sm">{profileData.address}</span>
                  </div>
                  <div className="pt-2 border-t">
                    <p className="text-xs text-neutral-600 mb-2">Domaines d'intervention</p>
                    <div className="flex flex-wrap gap-1">
                      {profileData.specialties.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Gestion de l'abonnement */}
          <Card>
            <CardHeader>
              <CardTitle>Mon abonnement</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">Plan {profileData.plan}</p>
                  <p className="text-sm text-neutral-600">140 €/mois</p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Actif
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <p>• Devis automatisés illimités</p>
                <p>• Visibilité sans certification</p>
                <p>• Support prioritaire</p>
                <p>• Outils de suivi</p>
                <p>• Statistiques avancées</p>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer l'abonnement
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
