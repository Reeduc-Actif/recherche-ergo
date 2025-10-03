import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface RoleLayoutProps {
  title: string
  subtitle?: string
  description?: string
  children: ReactNode
  backLink?: string
  backText?: string
}

export default function RoleLayout({
  title,
  subtitle,
  description,
  children,
  backLink = '/',
  backText = 'Retour à l\'accueil'
}: RoleLayoutProps) {
  return (
    <div className="space-y-8">
      {/* Header de page */}
      <div className="space-y-4">
        {backLink && (
          <Link href={backLink}>
            <Button variant="ghost" size="sm" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backText}
            </Button>
          </Link>
        )}
        
        <div className="text-center space-y-4">
          {subtitle && (
            <p className="text-sm font-medium text-primary">{subtitle}</p>
          )}
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="max-w-2xl mx-auto text-neutral-600">{description}</p>
          )}
        </div>
      </div>

      {/* Contenu principal */}
      <div className="max-w-4xl mx-auto">
        {children}
      </div>
    </div>
  )
}
