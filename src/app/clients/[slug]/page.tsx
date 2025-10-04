import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, FileText, User, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

// Données mock pour la démo
const MOCK_CLIENT = {
  slug: 'jean-dupont',
  firstName: 'Jean',
  lastName: 'Dupont',
  city: 'Bruxelles',
  address: 'Rue de la Paix 12, 1000 Bruxelles',
  phone: '+32 2 456 78 90',
  email: 'jean.dupont@email.com',
  birthDate: '1985-03-15',
  photo: '/placeholder-client.jpg',
  associatedErgo: {
    name: 'Marie Dubois',
    slug: 'marie-dubois',
    phone: '+32 2 123 45 67'
  },
  documents: [
    { name: 'Prescription médicale', date: '2024-01-15', type: 'pdf' },
    { name: 'Bilan ergothérapeutique', date: '2024-01-20', type: 'pdf' },
    { name: 'Photos domicile', date: '2024-01-22', type: 'images' }
  ],
  followUpStatus: 'En cours',
  lastUpdate: '2024-01-25'
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ClientProfilePage({ params }: Props) {
  const { slug } = await params
  const client = MOCK_CLIENT // En production, récupérer depuis l'API

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header du profil */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-neutral-600">
              {client.firstName[0]}{client.lastName[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-lg text-neutral-600">Patient</p>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">{client.city}</span>
              </div>
            </div>
            
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              {client.followUpStatus}
            </Badge>
          </div>
          
          <div className="text-sm text-neutral-600">
            Né le {new Date(client.birthDate).toLocaleDateString('fr-FR')}
          </div>
        </div>
      </div>

      {/* Ergothérapeute associé */}
      <Card>
        <CardHeader>
          <CardTitle>Ergothérapeute associé</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-neutral-200 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-neutral-600" />
              </div>
              <div>
                <h3 className="font-semibold">{client.associatedErgo.name}</h3>
                <p className="text-sm text-neutral-600">{client.associatedErgo.phone}</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/ergotherapeutes/${client.associatedErgo.slug}`}>
                Voir le profil
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents partagés */}
      <Card>
        <CardHeader>
          <CardTitle>Documents partagés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {client.documents.map((doc, index) => (
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

      {/* Informations de contact */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5 text-primary" />
            <span>{client.phone}</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <span>{client.email}</span>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5 text-primary" />
            <span>{client.address}</span>
          </div>
        </CardContent>
      </Card>

      {/* Suivi du projet */}
      <Card>
        <CardHeader>
          <CardTitle>Suivi du projet</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-neutral-600">Dernière mise à jour</span>
              <span className="text-sm font-medium">
                {new Date(client.lastUpdate).toLocaleDateString('fr-FR')}
              </span>
            </div>
            
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
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/dashboard/ergotherapeute">
            Retour au tableau de bord
          </Link>
        </Button>
        <Button variant="outline" asChild className="flex-1">
          <Link href="/contact">
            Nous contacter
          </Link>
        </Button>
      </div>
    </div>
  )
}
