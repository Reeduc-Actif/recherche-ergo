import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Languages, Calendar } from 'lucide-react'

interface Professional {
  id: string
  name: string
  city: string
  specialties: string[]
  languages: string[]
  modalities: string[]
  image?: string
}

const MOCK_PROFESSIONALS: Professional[] = [
  {
    id: '1',
    name: 'Dr. Marie Dubois',
    city: 'Bruxelles',
    specialties: ['Pédiatrie', 'Développement moteur'],
    languages: ['Français', 'Néerlandais'],
    modalities: ['Cabinet', 'Domicile']
  },
  {
    id: '2',
    name: 'Dr. Jean Martin',
    city: 'Liège',
    specialties: ['Gériatrie', 'Réadaptation'],
    languages: ['Français', 'Allemand'],
    modalities: ['Cabinet', 'Visio']
  },
  {
    id: '3',
    name: 'Dr. Sophie Lambert',
    city: 'Anvers',
    specialties: ['Adulte', 'Neurologie'],
    languages: ['Néerlandais', 'Anglais'],
    modalities: ['Cabinet', 'Domicile', 'Visio']
  },
  {
    id: '4',
    name: 'Dr. Pierre Rousseau',
    city: 'Gand',
    specialties: ['Pédiatrie', 'Autisme'],
    languages: ['Néerlandais', 'Français'],
    modalities: ['Cabinet', 'Domicile']
  },
  {
    id: '5',
    name: 'Dr. Anne Moreau',
    city: 'Charleroi',
    specialties: ['Adulte', 'Traumatologie'],
    languages: ['Français'],
    modalities: ['Cabinet', 'Visio']
  }
]

export default function ResultsList() {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3 inline-block">
          Les résultats sont affichés à titre indicatif (démo UI).
        </p>
      </div>
      
      <div className="grid gap-4">
        {MOCK_PROFESSIONALS.map((professional) => {
          const initials = professional.name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()

          return (
            <Card key={professional.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={professional.image} alt={professional.name} />
                    <AvatarFallback className="text-lg font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="font-semibold text-lg">{professional.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-neutral-600">
                        <MapPin className="h-4 w-4" />
                        {professional.city}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium mb-1">Spécialités :</p>
                        <div className="flex flex-wrap gap-1">
                          {professional.specialties.map((specialty) => (
                            <Badge key={specialty} variant="secondary" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Langues :</p>
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <Languages className="h-4 w-4" />
                          {professional.languages.join(', ')}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium mb-1">Modalités :</p>
                        <div className="flex items-center gap-1 text-sm text-neutral-600">
                          <Calendar className="h-4 w-4" />
                          {professional.modalities.join(', ')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <Button size="sm" className="whitespace-nowrap">
                      Voir le profil
                    </Button>
                    <Button size="sm" variant="outline" className="whitespace-nowrap">
                      Prendre RDV
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
