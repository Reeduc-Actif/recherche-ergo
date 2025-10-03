'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import ResultsList from '@/components/ui/results-list'
import MockMap from '@/components/ui/mock-map'
import { Search, Filter, MapPin } from 'lucide-react'

const SPECIALTIES = [
  'Toutes les spécialités',
  'Pédiatrie',
  'Adulte',
  'Gériatrie',
  'Neurologie',
  'Traumatologie',
  'Développement moteur',
  'Autisme'
]

const LANGUAGES = [
  'Toutes les langues',
  'Français',
  'Néerlandais',
  'Allemand',
  'Anglais'
]

const MODALITIES = [
  'Toutes les modalités',
  'Cabinet',
  'Domicile',
  'Visio'
]

export default function RecherchePage() {
  const [filters, setFilters] = useState({
    specialty: '',
    language: '',
    modality: '',
    location: '',
    radius: 25
  })

  const handleFilterChange = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight">
          Rechercher un ergothérapeute
        </h1>
        <p className="text-neutral-600 max-w-2xl mx-auto">
          Utilisez les filtres ci-dessous pour trouver le professionnel qui correspond à vos besoins
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres de recherche
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="specialty">Spécialité</Label>
              <Select value={filters.specialty} onValueChange={(value) => handleFilterChange('specialty', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une spécialité" />
                </SelectTrigger>
                <SelectContent>
                  {SPECIALTIES.map((specialty) => (
                    <SelectItem key={specialty} value={specialty}>
                      {specialty}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Langue</Label>
              <Select value={filters.language} onValueChange={(value) => handleFilterChange('language', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une langue" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((language) => (
                    <SelectItem key={language} value={language}>
                      {language}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="modality">Modalité</Label>
              <Select value={filters.modality} onValueChange={(value) => handleFilterChange('modality', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une modalité" />
                </SelectTrigger>
                <SelectContent>
                  {MODALITIES.map((modality) => (
                    <SelectItem key={modality} value={modality}>
                      {modality}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Localisation</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  id="location"
                  type="text"
                  placeholder="Ville ou code postal"
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Rayon (km)</Label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  id="radius"
                  min="5"
                  max="100"
                  step="5"
                  value={filters.radius}
                  onChange={(e) => handleFilterChange('radius', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{filters.radius} km</span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Rechercher
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Résultats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Carte mock */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Carte des résultats</CardTitle>
            </CardHeader>
            <CardContent>
              <MockMap />
            </CardContent>
          </Card>
        </div>

        {/* Liste des résultats */}
        <div className="lg:col-span-2">
          <ResultsList />
        </div>
      </div>
    </div>
  )
}
