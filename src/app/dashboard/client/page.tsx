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
  Phone,
  Mail,
  MapPin,
  Edit,
  Save,
  X,
  Calendar,
  ShieldCheck,
  CheckCircle
} from 'lucide-react'
import Link from 'next/link'

// Données mock pour la démo
const MOCK_PROFILE = {
  firstName: 'Jean',
  lastName: 'Dupont',
  email: 'jean.dupont@email.com',
  phone: '+32 2 456 78 90',
  address: 'Rue de la Paix 12, 1000 Bruxelles',
  birthDate: '1985-03-15'
}

const MOCK_ERGO = {
  name: 'Marie Dubois',
  slug: 'marie-dubois',
  phone: '+32 2 123 45 67',
  email: 'marie.dubois@ergo.be',
  specialties: ['Pédiatrie', 'Adulte', 'Aménagement domicile']
}

const MOCK_DOCUMENTS = [
  { name: 'Prescription médicale', date: '2024-01-15', type: 'pdf' },
  { name: 'Bilan ergothérapeutique', date: '2024-01-20', type: 'pdf' },
  { name: 'Photos domicile', date: '2024-01-22', type: 'images' },
  { name: 'Devis aménagement', date: '2024-01-25', type: 'pdf' }
]

export default function ClientDashboardPage() {
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
          <h1 className="text-3xl font-semibold">Mon espace patient</h1>
          <p className="text-neutral-600">Bienvenue, {profileData.firstName}</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <ShieldCheck className="h-3 w-3 mr-1" />
          Compte gratuit
        </Badge>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-neutral-600">Ergothérapeute</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">{MOCK_DOCUMENTS.length}</p>
                <p className="text-sm text-neutral-600">Documents</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-neutral-600">RDV passés</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-8 w-8 text-primary" />
              <div>
                <p className="text-2xl font-bold">60%</p>
                <p className="text-sm text-neutral-600">Progression</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Contenu principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ergothérapeute associé */}
          <Card>
            <CardHeader>
              <CardTitle>Mon ergothérapeute</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-neutral-200 rounded-full flex items-center justify-center">
                    <Users className="h-8 w-8 text-neutral-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">{MOCK_ERGO.name}</h3>
                    <p className="text-sm text-neutral-600">{MOCK_ERGO.phone}</p>
                    <p className="text-sm text-neutral-600">{MOCK_ERGO.email}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {MOCK_ERGO.specialties.map((spec) => (
                        <Badge key={spec} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button variant="outline" asChild>
                  <Link href={`/ergotherapeutes/${MOCK_ERGO.slug}`}>
                    Voir le profil
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Documents partagés */}
          <Card>
            <CardHeader>
              <CardTitle>Mes documents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_DOCUMENTS.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">{doc.name}</p>
                        <p className="text-sm text-neutral-600">
                          Ajouté le {new Date(doc.date).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {doc.type === 'pdf' ? 'PDF' : 'Images'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* État du suivi */}
          <Card>
            <CardHeader>
              <CardTitle>État du suivi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-800 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                      ✓
                    </div>
                    <h3 className="font-semibold mb-1">1er contact</h3>
                    <p className="text-xs text-neutral-600">Terminé</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 text-green-800 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                      ✓
                    </div>
                    <h3 className="font-semibold mb-1">Bilan</h3>
                    <p className="text-xs text-neutral-600">Terminé</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                      3
                    </div>
                    <h3 className="font-semibold mb-1">Devis</h3>
                    <p className="text-xs text-neutral-600">En cours</p>
                  </div>
                  
                  <div className="text-center">
                    <div className="w-12 h-12 bg-neutral-100 text-neutral-600 rounded-full flex items-center justify-center mx-auto mb-2 font-semibold">
                      4
                    </div>
                    <h3 className="font-semibold mb-1">Réalisation</h3>
                    <p className="text-xs text-neutral-600">À venir</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <div className="w-full bg-neutral-200 rounded-full h-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '60%' }} />
                  </div>
                  <p className="text-sm text-neutral-600 mt-2">Progression: 60%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profil personnel */}
        <div className="space-y-6">
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
                  <div>
                    <Label>Date de naissance</Label>
                    <Input type="date" value={profileData.birthDate} />
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
                    <p className="text-xs text-neutral-600">
                      Né le {new Date(profileData.birthDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions rapides */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full" asChild>
                <Link href="/recherche">
                  Trouver un ergothérapeute
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/contact">
                  Nous contacter
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
