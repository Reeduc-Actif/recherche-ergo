'use client'

interface GeocodeStatusProps {
  coords: string | null
  className?: string
}

export default function GeocodeStatus({ coords, className = "" }: GeocodeStatusProps) {
  if (coords === null) {
    return (
      <span className={`inline-flex items-center gap-1 text-amber-600 ${className}`}>
        <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></div>
        Géolocalisation en cours…
      </span>
    )
  }

  return (
    <span className={`inline-flex items-center gap-1 text-green-600 ${className}`}>
      <div className="h-2 w-2 rounded-full bg-green-500"></div>
      Géolocalisé ✓
    </span>
  )
}
