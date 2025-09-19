import { useState, useRef, useEffect } from 'react'
import './LocationSelect.css'

interface LocationSelectProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onKeyPress?: (e: React.KeyboardEvent) => void
}

const POPULAR_CITIES = [
  'Milano',
  'Roma',
  'Napoli',
  'Torino',
  'Palermo',
  'Genova',
  'Bologna',
  'Firenze'
]

const ALL_CITIES = [
  'Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze',
  'Bari', 'Catania', 'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Brescia',
  'Taranto', 'Prato', 'Parma', 'Reggio Calabria', 'Modena', 'Reggio Emilia', 'Perugia',
  'Livorno', 'Ravenna', 'Cagliari', 'Foggia', 'Rimini', 'Salerno', 'Ferrara', 'Sassari',
  'Latina', 'Giugliano in Campania', 'Monza', 'Syracusa', 'Bergamo', 'Pescara', 'Trento',
  'Vicenza', 'Terni', 'Bolzano', 'Novara', 'Piacenza', 'Ancona', 'Andria', 'Arezzo',
  'Udine', 'Cesena', 'Lecce', 'Pesaro', 'Barletta', 'Alessandria', 'La Spezia', 'Pistoia',
  'Catanzaro', 'Lucca', 'Treviso', 'Asti', 'Cosenza', 'Ragusa', 'Caserta', 'Enna',
  'Amalfi', 'Capri', 'Positano', 'Sorrento', 'Portofino', 'Cinque Terre', 'Assisi',
  'San Gimignano', 'Siena', 'Pisa', 'Matera', 'Lecco', 'Como', 'Bergamo', 'Mantova'
]

export function LocationSelect({ value, onChange, placeholder = "Città", onKeyPress }: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setInputValue(value)
  }, [value])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputFocus = () => {
    setIsOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(true)
  }

  const handleCitySelect = (city: string) => {
    setInputValue(city)
    onChange(city)
    setIsOpen(false)
    inputRef.current?.blur()
  }

  const getFilteredCities = () => {
    if (!inputValue.trim()) {
      return POPULAR_CITIES
    }

    const searchTerm = inputValue.toLowerCase()

    // Filter cities that contain the letters in sequence (not necessarily consecutive)
    const filtered = ALL_CITIES.filter(city => {
      const cityLower = city.toLowerCase()
      let searchIndex = 0

      for (let i = 0; i < cityLower.length && searchIndex < searchTerm.length; i++) {
        if (cityLower[i] === searchTerm[searchIndex]) {
          searchIndex++
        }
      }

      return searchIndex === searchTerm.length
    })

    // Sort: cities starting with input first, then alphabetically
    return filtered.sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(searchTerm)
      const bStarts = b.toLowerCase().startsWith(searchTerm)

      if (aStarts && !bStarts) return -1
      if (!aStarts && bStarts) return 1
      return a.localeCompare(b)
    })
  }

  const filteredCities = getFilteredCities()

  return (
    <div ref={containerRef} className="location-select-container">
      <span className="location-icon">📍</span>
      <input
        ref={inputRef}
        type="text"
        className="location-input"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyPress={onKeyPress}
      />

      {isOpen && filteredCities.length > 0 && (
        <div className="location-dropdown">
          {filteredCities.map((city) => (
            <div
              key={city}
              className="dropdown-item location-dropdown-item"
              onClick={() => handleCitySelect(city)}
            >
              {city}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}