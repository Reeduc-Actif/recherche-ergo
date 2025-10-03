import { ReactNode } from 'react'

interface SectionProps {
  children: ReactNode
  title?: string
  subtitle?: string
  className?: string
  bordered?: boolean
  spacing?: 'sm' | 'md' | 'lg'
}

export default function Section({ 
  children, 
  title, 
  subtitle, 
  className = '', 
  bordered = false,
  spacing = 'md'
}: SectionProps) {
  const spacingClasses = {
    sm: 'py-8',
    md: 'py-12',
    lg: 'py-16'
  }

  const borderClasses = bordered ? 'border rounded-2xl p-6 md:p-10' : ''

  return (
    <section className={`${spacingClasses[spacing]} ${borderClasses} ${className}`}>
      {(title || subtitle) && (
        <div className="mb-8 text-center">
          {title && (
            <h2 className="text-2xl font-semibold mb-2">{title}</h2>
          )}
          {subtitle && (
            <p className="text-neutral-600 max-w-2xl mx-auto">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
}
