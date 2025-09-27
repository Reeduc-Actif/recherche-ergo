'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

export interface CityOption {
  nis_code: number | null
  name_fr: string | null
  name_nl: string | null
  name_de: string | null
}

interface CityAutocompleteProps {
  value: string
  onChange: (city: string) => void
  placeholder?: string
  locale?: 'fr' | 'nl' | 'de'
}

export default function CityAutocomplete({
  value,
  onChange,
  placeholder = 'Ville',
  locale = 'fr'
}: CityAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<CityOption[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [inputValue, setInputValue] = useState(value)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const debounceRef = useRef<NodeJS.Timeout | undefined>(undefined)

  // Fonction pour obtenir le nom de la ville selon la locale
  const getCityName = useCallback((option: CityOption) => {
    switch (locale) {
      case 'nl': return option.name_nl || option.name_fr || option.name_de || ''
      case 'de': return option.name_de || option.name_fr || option.name_nl || ''
      default: return option.name_fr || option.name_nl || option.name_de || ''
    }
  }, [locale])

  // Fonction pour rechercher les communes
  const searchCities = useCallback(async (query: string) => {
    // Ne pas faire d'appel si la query est vide
    if (!query.trim()) {
      setOptions([])
      setLoading(false)
      setError(false)
      return
    }

    setLoading(true)
    setError(false)
    
    try {
      const response = await fetch(`/api/best/municipalities?q=${encodeURIComponent(query)}&page=1`)
      if (!response.ok) throw new Error('Erreur réseau')
      const data = await response.json()
      setOptions((data.items || []).slice(0, 8))
    } catch {
      setError(true)
      setOptions([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Debounce pour la recherche
  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }
    debounceRef.current = setTimeout(() => {
      searchCities(query)
    }, 250)
  }, [searchCities])

  // Effet pour synchroniser inputValue avec value
  useEffect(() => {
    setInputValue(value)
  }, [value])

  // Effet pour la recherche initiale au focus - supprimé car on ne fait plus d'appel initial

  // Gestion des événements clavier
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
        return
      }
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setActiveIndex(prev => 
          prev < options.length - 1 ? prev + 1 : 0
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setActiveIndex(prev => 
          prev > 0 ? prev - 1 : options.length - 1
        )
        break
      case 'Enter':
        e.preventDefault()
        if (activeIndex >= 0 && activeIndex < options.length) {
          const selectedCity = getCityName(options[activeIndex])
          setInputValue(selectedCity)
          onChange(selectedCity)
          setIsOpen(false)
          setActiveIndex(-1)
        }
        break
      case 'Escape':
        setIsOpen(false)
        setActiveIndex(-1)
        inputRef.current?.blur()
        break
    }
  }

  // Gestion du changement d'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setActiveIndex(-1)
    
    if (isOpen) {
      debouncedSearch(newValue)
    }
  }

  // Gestion du focus
  const handleFocus = () => {
    setIsOpen(true)
    // Ne pas faire d'appel automatique au focus
  }

  // Gestion du clic sur une option
  const handleOptionClick = (option: CityOption) => {
    const cityName = getCityName(option)
    setInputValue(cityName)
    onChange(cityName)
    setIsOpen(false)
    setActiveIndex(-1)
  }

  // Gestion du clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node) &&
          listRef.current && !listRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setActiveIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Nettoyage du debounce
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        className="input w-full"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? "city-list" : undefined}
        aria-activedescendant={activeIndex >= 0 ? `city-option-${activeIndex}` : undefined}
        aria-autocomplete="list"
      />
      
      {isOpen && (
        <ul
          ref={listRef}
          id="city-list"
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
          role="listbox"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-gray-500">
              Chargement…
            </li>
          )}
          
          {!loading && error && (
            <li className="px-3 py-2 text-sm text-red-600">
              Aucune commune trouvée
            </li>
          )}
          
          {!loading && !error && options.length === 0 && inputValue.trim() === '' && (
            <li className="px-3 py-2 text-sm text-gray-500">
              Commencez à taper pour rechercher une commune
            </li>
          )}
          
          {!loading && !error && options.length === 0 && inputValue.trim() !== '' && (
            <li className="px-3 py-2 text-sm text-gray-500">
              Aucune commune trouvée
            </li>
          )}
          
          {!loading && !error && options.map((option, index) => {
            const cityName = getCityName(option)
            const isActive = index === activeIndex
            
            return (
              <li
                key={`${option.nis_code}-${index}`}
                id={`city-option-${index}`}
                className={`px-3 py-2 text-sm cursor-pointer ${
                  isActive 
                    ? 'bg-blue-50 text-blue-900' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleOptionClick(option)}
                role="option"
                aria-selected={isActive}
              >
                <div className="font-medium">{cityName}</div>
                {option.nis_code && (
                  <div className="text-xs text-gray-500">NIS: {option.nis_code}</div>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
