'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MapPin, Phone, Mail, Clock } from 'lucide-react'

const SUBJECTS = [
  'Question générale',
  'Problème technique',
  'Demande de partenariat',
  'Support client',
  'Demande de démo',
  'Autre'
]

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
    rgpd: false
  })

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aucune action réelle - juste visuel
    console.log('Formulaire de contact soumis (démo):', formData)
  }

  return (
    <div className="space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-semibold tracking-tight">
          Parlons de votre besoin
        </h1>
        <p className="max-w-2xl mx-auto text-lg text-neutral-600">
          Notre équipe est là pour vous accompagner. N'hésitez pas à nous contacter 
          pour toute question ou demande d'information.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulaire de contact */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Envoyez-nous un message</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom *</Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subject">Sujet *</Label>
                    <Select value={formData.subject} onValueChange={(value) => handleInputChange('subject', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez un sujet" />
                      </SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map((subject) => (
                          <SelectItem key={subject} value={subject}>
                            {subject}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    rows={6}
                    required
                  />
                </div>

                <div className="flex items-start space-x-2">
                  <input
                    type="checkbox"
                    id="rgpd"
                    checked={formData.rgpd}
                    onChange={(e) => handleInputChange('rgpd', e.target.checked)}
                    className="mt-1"
                    required
                  />
                  <Label htmlFor="rgpd" className="text-sm text-neutral-600">
                    J'accepte que mes données soient utilisées pour traiter ma demande conformément à la politique de confidentialité. *
                  </Label>
                </div>

                <Button type="submit" className="w-full" size="lg">
                  Envoyer le message
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informations de contact */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Nos coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Adresse</p>
                  <p className="text-sm text-neutral-600">
                    Avenue Louise 149<br />
                    1050 Bruxelles<br />
                    Belgique
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Téléphone</p>
                  <p className="text-sm text-neutral-600">
                    +32 2 123 45 67
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Email</p>
                  <p className="text-sm text-neutral-600">
                    contact@ergoconnect.be
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium">Horaires</p>
                  <p className="text-sm text-neutral-600">
                    Lun - Ven: 9h00 - 18h00<br />
                    Sam: 9h00 - 12h00
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Besoin d'aide ?</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-neutral-600 mb-4">
                Notre équipe support est disponible pour vous aider avec toutes vos questions.
              </p>
              <div className="space-y-2 text-sm">
                <p><strong>Support technique:</strong> support@ergoconnect.be</p>
                <p><strong>Questions commerciales:</strong> commercial@ergoconnect.be</p>
                <p><strong>Partenariats:</strong> partenariats@ergoconnect.be</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
