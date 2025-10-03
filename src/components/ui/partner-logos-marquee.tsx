'use client'

import { useState, useEffect } from 'react'

const LOGOS = [
  { name: 'Partenaire 1', src: '/placeholder-logo-1.svg' },
  { name: 'Partenaire 2', src: '/placeholder-logo-2.svg' },
  { name: 'Partenaire 3', src: '/placeholder-logo-3.svg' },
  { name: 'Partenaire 4', src: '/placeholder-logo-4.svg' },
  { name: 'Partenaire 5', src: '/placeholder-logo-5.svg' },
  { name: 'Partenaire 6', src: '/placeholder-logo-6.svg' },
]

export default function PartnerLogosMarquee() {
  const [isPaused, setIsPaused] = useState(false)

  return (
    <div className="py-8">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Nos partenaires
        </h3>
        <p className="text-sm text-neutral-600">
          Des institutions et organisations qui nous font confiance
        </p>
      </div>
      
      <div 
        className="relative overflow-hidden"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex animate-marquee ${isPaused ? 'animation-paused' : ''}`}>
          {/* Première série de logos */}
          {LOGOS.map((logo, index) => (
            <div key={`first-${index}`} className="flex-shrink-0 mx-8">
              <div className="w-32 h-16 bg-neutral-100 rounded-lg flex items-center justify-center border">
                <span className="text-xs text-neutral-500 font-medium">
                  {logo.name}
                </span>
              </div>
            </div>
          ))}
          {/* Deuxième série de logos (pour l'effet de boucle) */}
          {LOGOS.map((logo, index) => (
            <div key={`second-${index}`} className="flex-shrink-0 mx-8">
              <div className="w-32 h-16 bg-neutral-100 rounded-lg flex items-center justify-center border">
                <span className="text-xs text-neutral-500 font-medium">
                  {logo.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
