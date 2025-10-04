import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, Calendar, ShieldCheck, Home, Video } from 'lucide-react'
import Link from 'next/link'

// Données mock pour la démo
const MOCK_ERGO = {
  slug: 'marie-dubois',
  firstName: 'Marie',
  lastName: 'Dubois',
  city: 'Bruxelles',
  address: 'Avenue Louise 149, 1050 Bruxelles',
  phone: '+32 2 123 45 67',
  email: 'marie.dubois@ergo.be',
  photo: '/placeholder-ergo.jpg',
  specialties: ['Pédiatrie', 'Adulte', 'Aménagement domicile'],
  languages: ['Français', 'Néerlandais', 'Anglais'],
  modalities: ['cabinet', 'domicile', 'visio'],
  bookingUrl: 'https://calendly.com/marie-dubois',
  isCertified: true,
  plan: 'Essentiel',
  description: 'Ergothérapeute avec 15 ans d\'expérience, spécialisée dans l\'accompagnement des enfants et des adultes. Passionnée par l\'aménagement du domicile et l\'adaptation de l\'environnement aux besoins spécifiques de chaque patient.'
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function ErgotherapeuteProfilePage({ params }: Props) {
  const { slug } = await params
  const ergo = MOCK_ERGO // En production, récupérer depuis l'API

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header du profil */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-neutral-600">
              {ergo.firstName[0]}{ergo.lastName[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                {ergo.firstName} {ergo.lastName}
              </h1>
              <p className="text-lg text-neutral-600">Ergothérapeute</p>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">{ergo.city}</span>
              </div>
            </div>
            
            {ergo.isCertified && (
              <Badge className="bg-green-100 text-green-800 border-green-200">
                <ShieldCheck className="h-3 w-3 mr-1" />
                Certifié
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {ergo.specialties.map((specialty) => (
              <Badge key={specialty} variant="outline">
                {specialty}
              </Badge>
            ))}
          </div>
          
          <div className="flex flex-wrap gap-2">
            {ergo.languages.map((language) => (
              <Badge key={language} variant="secondary">
                {language}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Modalités */}
      <Card>
        <CardHeader>
          <CardTitle>Modalités de consultation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            {ergo.modalities.includes('cabinet') && (
              <div className="flex items-center gap-2">
                <Home className="h-5 w-5 text-primary" />
                <span>Au cabinet</span>
              </div>
            )}
            {ergo.modalities.includes('domicile') && (
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-primary" />
                <span>À domicile</span>
              </div>
            )}
            {ergo.modalities.includes('visio') && (
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-primary" />
                <span>En visioconférence</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Description */}
      <Card>
        <CardHeader>
          <CardTitle>À propos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-700 leading-relaxed">
            {ergo.description}
          </p>
        </CardContent>
      </Card>

      {/* Contact et prise de RDV */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span>{ergo.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <span>{ergo.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{ergo.address}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prendre rendez-vous</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ergo.bookingUrl ? (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Réservez directement un créneau disponible
                </p>
                <Button asChild className="w-full">
                  <a href={ergo.bookingUrl} target="_blank" rel="noopener noreferrer">
                    <Calendar className="h-4 w-4 mr-2" />
                    Prendre rendez-vous
                  </a>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-600">
                  Contactez directement pour prendre rendez-vous
                </p>
                <Button variant="outline" className="w-full">
                  <Phone className="h-4 w-4 mr-2" />
                  Appeler maintenant
                </Button>
              </div>
            )}
            
            <div className="pt-4 border-t">
              <p className="text-xs text-neutral-500">
                Plan {ergo.plan} • {ergo.isCertified ? 'Profil certifié' : 'Profil en attente de certification'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/recherche">
            Voir d'autres ergothérapeutes
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
