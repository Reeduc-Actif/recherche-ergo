import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, ShieldCheck, FileText, Wrench } from 'lucide-react'
import Link from 'next/link'

// Données mock pour la démo
const MOCK_BANDAGISTE = {
  slug: 'orthopedie-bruxelles',
  companyName: 'Orthopédie Bruxelles',
  firstName: 'Jean',
  lastName: 'Martin',
  city: 'Bruxelles',
  address: 'Rue Neuve 123, 1000 Bruxelles',
  phone: '+32 2 234 56 78',
  email: 'contact@orthopedie-bruxelles.be',
  photo: '/placeholder-bandagiste.jpg',
  specialties: ['Orthèses', 'Prothèses', 'Aides à la mobilité'],
  interventionAreas: ['Bruxelles', 'Brabant wallon', 'Brabant flamand'],
  plan: 'Pro',
  hasAutomatedQuotes: true,
  description: 'Spécialiste en orthopédie depuis 20 ans, nous proposons un large éventail d\'orthèses, prothèses et aides à la mobilité. Notre équipe expérimentée vous accompagne dans le choix des solutions les plus adaptées à vos besoins.'
}

interface Props {
  params: Promise<{ slug: string }>
}

export default async function BandagisteProfilePage({ params }: Props) {
  const { slug } = await params
  const bandagiste = MOCK_BANDAGISTE // En production, récupérer depuis l'API

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header du profil */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-neutral-600">
              {bandagiste.firstName[0]}{bandagiste.lastName[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                {bandagiste.companyName}
              </h1>
              <p className="text-lg text-neutral-600">Bandagiste • Orthopédiste</p>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">{bandagiste.city}</span>
              </div>
            </div>
            
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Certifié
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {bandagiste.specialties.map((specialty) => (
              <Badge key={specialty} variant="outline">
                {specialty}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Zones d'intervention */}
      <Card>
        <CardHeader>
          <CardTitle>Zones d'intervention</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {bandagiste.interventionAreas.map((area) => (
              <Badge key={area} variant="secondary">
                {area}
              </Badge>
            ))}
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
            {bandagiste.description}
          </p>
        </CardContent>
      </Card>

      {/* Services et outils */}
      <Card>
        <CardHeader>
          <CardTitle>Services proposés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-primary" />
            <span>Fabrication sur mesure d'orthèses et prothèses</span>
          </div>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <span>Conseil et accompagnement personnalisé</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Suivi post-adaptation</span>
          </div>
          {bandagiste.hasAutomatedQuotes && (
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Devis automatisés disponibles</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Contact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-5 w-5 text-primary" />
              <span>{bandagiste.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <span>{bandagiste.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{bandagiste.address}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demander un devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-600">
              {bandagiste.hasAutomatedQuotes 
                ? 'Générez automatiquement un devis personnalisé'
                : 'Contactez-nous pour obtenir un devis personnalisé'
              }
            </p>
            <Button className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              {bandagiste.hasAutomatedQuotes ? 'Générer un devis' : 'Demander un devis'}
            </Button>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-neutral-500">
                Plan {bandagiste.plan} • {bandagiste.hasAutomatedQuotes ? 'Devis automatisés' : 'Devis sur demande'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Button asChild className="flex-1">
          <Link href="/recherche">
            Voir d'autres professionnels
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
