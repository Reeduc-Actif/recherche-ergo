import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Phone, Mail, ShieldCheck, FileText, Wrench, Home, Clock } from 'lucide-react'
import Link from 'next/link'

// Données mock pour la démo
const MOCK_ENTREPRENEUR = {
  slug: 'amenagement-domicile-bruxelles',
  companyName: 'Aménagement Domicile Bruxelles',
  firstName: 'Pierre',
  lastName: 'Rousseau',
  city: 'Bruxelles',
  address: 'Avenue de la Toison d\'Or 45, 1050 Bruxelles',
  phone: '+32 2 345 67 89',
  email: 'contact@amenagement-domicile.be',
  photo: '/placeholder-entrepreneur.jpg',
  specialties: ['Aménagement domicile', 'Accessibilité', 'Adaptation cuisine', 'Adaptation salle de bain'],
  interventionAreas: ['Bruxelles', 'Brabant wallon', 'Hainaut'],
  plan: 'Pro',
  hasAutomatedQuotes: true,
  description: 'Entreprise spécialisée dans l\'aménagement du domicile pour personnes à mobilité réduite. Nous réalisons des travaux d\'adaptation sur mesure, en collaboration étroite avec les ergothérapeutes pour garantir des solutions optimales.'
}

interface Props {
  params: { slug: string }
}

export default function EntrepreneurProfilePage({ params }: Props) {
  const entrepreneur = MOCK_ENTREPRENEUR // En production, récupérer depuis l'API

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header du profil */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-neutral-200 rounded-full flex items-center justify-center">
            <span className="text-2xl font-semibold text-neutral-600">
              {entrepreneur.firstName[0]}{entrepreneur.lastName[0]}
            </span>
          </div>
        </div>
        
        <div className="flex-1 space-y-4">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-semibold">
                {entrepreneur.companyName}
              </h1>
              <p className="text-lg text-neutral-600">Entrepreneur • Aménagement domicile</p>
              <div className="flex items-center gap-2 mt-2">
                <MapPin className="h-4 w-4 text-neutral-500" />
                <span className="text-neutral-600">{entrepreneur.city}</span>
              </div>
            </div>
            
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Certifié
            </Badge>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {entrepreneur.specialties.map((specialty) => (
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
            {entrepreneur.interventionAreas.map((area) => (
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
            {entrepreneur.description}
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
            <Home className="h-5 w-5 text-primary" />
            <span>Aménagement complet du domicile</span>
          </div>
          <div className="flex items-center gap-3">
            <Wrench className="h-5 w-5 text-primary" />
            <span>Adaptation cuisine et salle de bain</span>
          </div>
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span>Installation d'équipements d'aide</span>
          </div>
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-primary" />
            <span>Suivi et maintenance</span>
          </div>
          {entrepreneur.hasAutomatedQuotes && (
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-medium">Devis automatisés disponibles</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Processus de collaboration */}
      <Card>
        <CardHeader>
          <CardTitle>Notre processus</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                1
              </div>
              <h3 className="font-semibold mb-2">Évaluation</h3>
              <p className="text-sm text-neutral-600">
                Analyse des besoins avec l'ergothérapeute
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                2
              </div>
              <h3 className="font-semibold mb-2">Devis</h3>
              <p className="text-sm text-neutral-600">
                Proposition détaillée et chiffrée
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                3
              </div>
              <h3 className="font-semibold mb-2">Réalisation</h3>
              <p className="text-sm text-neutral-600">
                Travaux par équipe qualifiée
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-primary text-primary-foreground rounded-full flex items-center justify-center mx-auto mb-3 font-semibold">
                4
              </div>
              <h3 className="font-semibold mb-2">Suivi</h3>
              <p className="text-sm text-neutral-600">
                Accompagnement post-travaux
              </p>
            </div>
          </div>
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
              <span>{entrepreneur.phone}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-primary" />
              <span>{entrepreneur.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-primary" />
              <span>{entrepreneur.address}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Demander un devis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-neutral-600">
              {entrepreneur.hasAutomatedQuotes 
                ? 'Générez automatiquement un devis personnalisé'
                : 'Contactez-nous pour obtenir un devis personnalisé'
              }
            </p>
            <Button className="w-full">
              <FileText className="h-4 w-4 mr-2" />
              {entrepreneur.hasAutomatedQuotes ? 'Générer un devis' : 'Demander un devis'}
            </Button>
            
            <div className="pt-4 border-t">
              <p className="text-xs text-neutral-500">
                Plan {entrepreneur.plan} • {entrepreneur.hasAutomatedQuotes ? 'Devis automatisés' : 'Devis sur demande'}
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
