'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

const SUBJECTS = [
  'Question générale',
  'Problème technique',
  'Demande de partenariat',
  'Support client',
  'Autre'
]

export default function QuickContactForm() {
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
    console.log('Formulaire soumis (démo):', formData)
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl text-center">
          Une question ? Écrivez-nous, on vous répond rapidement.
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
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
              rows={4}
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

          <Button type="submit" className="w-full">
            Envoyer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
