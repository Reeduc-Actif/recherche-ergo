import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface HeroProps {
  title: string
  subtitle?: string
  description?: string
  primaryButton?: {
    text: string
    href: string
    icon?: ReactNode
  }
  secondaryButton?: {
    text: string
    href: string
    icon?: ReactNode
  }
  badge?: {
    text: string
    icon?: ReactNode
  }
  visual?: ReactNode
  className?: string
}

export default function Hero({
  title,
  subtitle,
  description,
  primaryButton,
  secondaryButton,
  badge,
  visual,
  className = ''
}: HeroProps) {
  return (
    <section className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br from-blue-50 to-indigo-100 p-8 md:p-12 ${className}`}>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/70" />
      <div className="relative z-10 grid items-center gap-10 md:grid-cols-2">
        <div className="space-y-6">
          {badge && (
            <div className="inline-flex items-center gap-2 rounded-full border bg-white/70 px-3 py-1 text-xs font-medium backdrop-blur">
              {badge.icon}
              {badge.text}
            </div>
          )}

          {subtitle && (
            <p className="text-sm font-medium text-primary">{subtitle}</p>
          )}

          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>

          {description && (
            <p className="max-w-prose text-pretty text-neutral-700">
              {description}
            </p>
          )}

          {(primaryButton || secondaryButton) && (
            <div className="flex flex-wrap gap-3">
              {primaryButton && (
                <Link href={primaryButton.href}>
                  <Button size="lg" className="shadow-sm">
                    {primaryButton.icon}
                    {primaryButton.text}
                  </Button>
                </Link>
              )}
              {secondaryButton && (
                <Link href={secondaryButton.href}>
                  <Button size="lg" variant="outline">
                    {secondaryButton.icon}
                    {secondaryButton.text}
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {visual && (
          <div className="relative">
            <div className="rounded-xl border bg-white/80 p-2 shadow-sm backdrop-blur">
              {visual}
            </div>
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
          </div>
        )}
      </div>
    </section>
  )
}
