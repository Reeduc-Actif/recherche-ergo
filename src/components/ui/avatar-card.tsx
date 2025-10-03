import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent } from '@/components/ui/card'

interface AvatarCardProps {
  name: string
  role: string
  bio: string
  image?: string
  className?: string
}

export default function AvatarCard({ name, role, bio, image, className = '' }: AvatarCardProps) {
  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()

  return (
    <Card className={className}>
      <CardContent className="p-6 text-center">
        <Avatar className="h-20 w-20 mx-auto mb-4">
          <AvatarImage src={image} alt={name} />
          <AvatarFallback className="text-lg font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
        <h3 className="font-semibold text-lg mb-1">{name}</h3>
        <p className="text-sm text-primary font-medium mb-3">{role}</p>
        <p className="text-sm text-neutral-600">{bio}</p>
      </CardContent>
    </Card>
  )
}
