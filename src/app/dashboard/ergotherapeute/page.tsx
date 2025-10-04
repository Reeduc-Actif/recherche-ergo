'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Users, 
  FileText, 
  Settings, 
  CreditCard, 
  Calendar,
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'

// Données mock pour la démo
const MOCK_CLIENTS = [
  {
    id: '1',
    name: 'Jean Dupont',
    slug: 'jean-dupont',
    status: 'En cours',
    lastContact: '2024-01-25',
    documents: 3,
    progress: 60
  },
  {
    id: '2',
    name: 'Marie Martin',
    slug: 'marie-martin',
    status: 'Bilan terminé',
    lastContact: '2024-01-20',
    documents: 2,
    progress: 80
  },
  {
    id: '3',
    name: 'Pierre Rousseau',
    slug: 'pierre-rousseau',
    status: 'Nouveau',
    lastContact: '2024-01-28',
    documents: 1,
    progress: 20
  }
]

const MOCK_PROFILE = {
  firstName: 'Marie',
  lastName: 'Dubois',
  email: 'marie.dubois@ergo.be',
  phone: '+32 2 123 45 67',
  address: 'Avenue Louise 149, 1050 Bruxelles',
  inamiNumber: '12345678901',
  specialties: ['Pédiatrie', 'Adulte', 'Aménagement domicile'],
  languages: ['Français', 'Néerlandais', 'Anglais'],
  plan: 'Essentiel'
}

export default function ErgotherapeuteDashboardPage() {
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
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{MOCK_CLIENTS.length}</p>
                <p className="text-sm text-neutral-600">Clients actifs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">12</p>
                <p className="text-sm text-neutral-600">Documents partagés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">8</p>
                <p className="text-sm text-neutral-600">RDV cette semaine</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Settings className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-neutral-600">Projets en cours</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des clients */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Mes clients</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {MOCK_CLIENTS.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-neutral-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{client.name}</h3>
                          <p className="text-sm text-neutral-600">
                            Dernier contact: {new Date(client.lastContact).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {client.status}
                        </Badge>
                        <p className="text-xs text-neutral-600">
                          {client.documents} document(s)
                        </p>
                      </div>
                      
                      <div className="w-16">
                        <div className="w-full bg-neutral-200 rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${client.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-neutral-600 mt-1">{client.progress}%</p>
                      </div>
                      
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/clients/${client.slug}`}>
                          Voir
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profil et outils */}
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
                    <p className="text-xs text-neutral-600 mb-2">Spécialisations</p>
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
                  <p className="text-sm text-neutral-600">5 €/mois</p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  Actif
                </Badge>
              </div>
              
              <div className="pt-4 border-t">
                <Button variant="outline" className="w-full">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Gérer l'abonnement
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Outils à venir */}
          <Card>
            <CardHeader>
              <CardTitle>Outils à venir</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-neutral-600">
                <p>• Formulaires automatiques</p>
                <p>• Génération de rapports</p>
                <p>• Outils d'aménagement</p>
                <p>• Statistiques avancées</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
