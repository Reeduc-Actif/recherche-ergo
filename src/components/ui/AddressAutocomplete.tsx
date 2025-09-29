'use client'

import { useState, useEffect, useRef } from 'react'

interface MapboxFeature {
  id: string
  place_name: string
  properties: {
    address?: string
    category?: string
  }
  geometry: {
    coordinates: [number, number] // [lon, lat]
  }
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
}

interface AddressData {
  address: string
  postal_code: string
  city: string
  country: 'BE'
  lon: number
  lat: number
  place_name: string
  mapbox_id: string
  street?: string
  house_number?: string
  bbox?: number[]
}

interface AddressAutocompleteProps {
  value: string
  onChange: (addressData: AddressData) => void
  placeholder?: string
  className?: string
}

export default function AddressAutocomplete({
  value,
  onChange,
  placeholder = "Rechercher une adresse...",
  className = ""
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState<MapboxFeature[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Debounce search
  useEffect(() => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const timeoutId = setTimeout(() => {
      searchAddresses(query)
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  const searchAddresses = async (searchQuery: string) => {
    setLoading(true)
    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      if (!token) {
        console.error('❌ NEXT_PUBLIC_MAPBOX_TOKEN not found - ajoutez votre token Mapbox dans .env.local')
        setSuggestions([])
        setIsOpen(false)
        return
      }
      
      console.log('🔍 Searching for:', searchQuery)

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?` +
        `access_token=${token}&` +
        `country=BE&` +
        `types=address&` +
        `limit=5&` +
        `language=fr`
      )

      if (!response.ok) {
        throw new Error('Mapbox API error')
      }

      const data = await response.json()
      console.log('📍 Mapbox API response:', data.features?.length || 0, 'results')
      setSuggestions(data.features || [])
      setIsOpen(true)
    } catch (error) {
      console.error('Error searching addresses:', error)
      setSuggestions([])
    } finally {
      setLoading(false)
    }
  }

  const extractAddressData = (feature: MapboxFeature): AddressData => {
    const [lon, lat] = feature.geometry.coordinates
    
    // Extract postal code and city from context
    let postal_code = ''
    let city = ''
    let street = ''
    let house_number = ''

    if (feature.context) {
      for (const ctx of feature.context) {
        if (ctx.id.startsWith('postcode')) {
          postal_code = ctx.text
        } else if (ctx.id.startsWith('place')) {
          city = ctx.text
        }
      }
    }

    // Try to extract street and house number from place_name
    const placeName = feature.place_name
    const addressParts = placeName.split(',')[0] // Get the first part (street address)
    
    // Simple regex to extract house number from the beginning
    const houseNumberMatch = addressParts.match(/^(\d+[a-zA-Z]?)\s*(.*)/)
    if (houseNumberMatch) {
      house_number = houseNumberMatch[1]
      street = houseNumberMatch[2].trim()
    } else {
      street = addressParts.trim()
    }

    return {
      address: placeName,
      postal_code,
      city,
      country: 'BE' as const,
      lon,
      lat,
      place_name: placeName,
      mapbox_id: feature.id,
      street: street || undefined,
      house_number: house_number || undefined,
    }
  }

  const handleSelect = (feature: MapboxFeature) => {
    const addressData = extractAddressData(feature)
    setQuery(addressData.address)
    setIsOpen(false)
    onChange(addressData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value)
    if (!isOpen && e.target.value.length >= 3) {
      setIsOpen(true)
    }
  }

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay to allow click on suggestions
    setTimeout(() => {
      setIsOpen(false)
    }, 200)
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className={`relative ${className}`}>
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        className="input w-full"
        autoComplete="off"
      />
      
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute z-50 mt-1 w-full rounded-lg border bg-white shadow-lg"
        >
          {loading ? (
            <div className="p-3 text-center text-sm text-gray-500">
              Recherche en cours...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-60 overflow-y-auto">
              {suggestions.map((feature) => (
                <button
                  key={feature.id}
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 focus:bg-gray-50 focus:outline-none"
                  onClick={() => handleSelect(feature)}
                >
                  <div className="font-medium">{feature.place_name}</div>
                  {feature.properties.category && (
                    <div className="text-xs text-gray-500">{feature.properties.category}</div>
                  )}
                </button>
              ))}
            </div>
          ) : query.length >= 3 ? (
            <div className="p-3 text-center text-sm text-gray-500">
              Aucune adresse trouvée
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}