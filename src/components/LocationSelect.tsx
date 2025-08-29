import { useState } from 'react'
import './LocationSelect.css'

interface LocationSelectProps {
  value: string
  onChange: (value: string) => void
  onKeyPress?: (e: React.KeyboardEvent) => void
}

const CITIES = [
  'Milano',
  'Roma',
  'Torino',
  'Napoli',
  'Bologna',
  'Firenze',
  'Venezia',
  'Palermo',
  'Genova',
  'Bari'
]

export function LocationSelect({ value, onChange, onKeyPress }: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  const filteredCities = CITIES.filter(city => 
    city.toLowerCase().includes(inputValue.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    setIsOpen(newValue.length > 0 && filteredCities.length > 0)
  }

  const handleCitySelect = (city: string) => {
    setInputValue(city)
    onChange(city)
    setIsOpen(false)
  }

  const handleInputFocus = () => {
    setIsOpen(inputValue.length === 0 || filteredCities.length > 0)
  }

  const handleInputBlur = () => {
    // Delay closing to allow city selection
    setTimeout(() => setIsOpen(false), 200)
  }

  return (
    <div className="location-select">
      <input
        type="text"
        className="location-input"
        placeholder="Città"
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyPress={onKeyPress}
      />
      {isOpen && (
        <div className="location-dropdown">
          {filteredCities.length > 0 ? (
            filteredCities.map(city => (
              <div
                key={city}
                className="location-option"
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))
          ) : inputValue.length > 0 ? (
            <div className="location-option disabled">
              Nessuna città trovata
            </div>
          ) : (
            CITIES.map(city => (
              <div
                key={city}
                className="location-option"
                onClick={() => handleCitySelect(city)}
              >
                {city}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}