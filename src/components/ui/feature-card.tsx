import { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  className?: string
}

export default function FeatureCard({ icon, title, description, className = '' }: FeatureCardProps) {
  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-3 inline-flex h-9 w-9 items-center justify-center rounded-lg border bg-neutral-50">
        {icon}
      </div>
      <h3 className="text-base font-medium">{title}</h3>
      <p className="mt-1 text-sm text-neutral-700">{description}</p>
    </div>
  )
}
