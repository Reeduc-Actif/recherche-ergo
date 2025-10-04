import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface PlanCardProps {
  name: string
  price: string
  period?: string
  features: string[]
  badge?: string
  buttonText?: string
  onButtonClick?: () => void
  className?: string
  popular?: boolean
}

export default function PlanCard({
  name,
  price,
  period = '/mois',
  features,
  badge,
  buttonText = 'Continuer',
  onButtonClick,
  className = '',
  popular = false
}: PlanCardProps) {
  return (
    <Card className={`relative ${popular ? 'border-primary shadow-lg' : ''} ${className}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Populaire</Badge>
        </div>
      )}
      
      <CardHeader>
        <CardTitle className="text-xl">{name}</CardTitle>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-neutral-600">{period}</span>
        </div>
        {badge && (
          <Badge variant="secondary" className="w-fit">
            {badge}
          </Badge>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {features.map((feature, index) => (
            <li key={index} className="flex items-center gap-2 text-sm">
              <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              {feature}
            </li>
          ))}
        </ul>
        
        <div className="pt-4">
          <Button 
            className="w-full" 
            variant={popular ? 'default' : 'outline'}
            onClick={onButtonClick}
          >
            {buttonText}
          </Button>
        </div>
        
        <p className="text-xs text-neutral-500 text-center">
          Résiliation avec préavis de 3 mois
        </p>
      </CardContent>
    </Card>
  )
}
