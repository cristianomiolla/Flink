import { useState } from 'react'
import './LocationSelect.css'

interface LocationSelectProps {
  value: string
  onChange: (value: string) => void
  onKeyPress?: (e: React.KeyboardEvent) => void
}

// Principali città italiane (mostrate quando si clicca il campo vuoto)
const MAIN_CITIES = [
  'Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze'
]

// Lista completa delle città per l'autocompletamento
const ALL_CITIES = [
  // Grandi città
  'Milano', 'Roma', 'Napoli', 'Torino', 'Palermo', 'Genova', 'Bologna', 'Firenze', 'Bari', 'Catania',
  'Venezia', 'Verona', 'Messina', 'Padova', 'Trieste', 'Brescia', 'Taranto', 'Prato', 'Reggio Calabria', 'Modena',
  
  // Città medie
  'Parma', 'Livorno', 'Cagliari', 'Foggia', 'Salerno', 'Ravenna', 'Rimini', 'Lecce', 'Ferrara', 'Siena',
  'Latina', 'Giugliano in Campania', 'Monza', 'Bergamo', 'Forlì', 'Trento', 'Vicenza', 'Terni', 'Bolzano', 'Novara',
  
  // Altre città importanti
  'Piacenza', 'Ancona', 'Andria', 'Arezzo', 'Udine', 'Cesena', 'Pesaro', 'Barletta', 'Alessandria', 'La Spezia',
  'Pistoia', 'Pescara', 'Fano', 'Carpi', 'Massa', 'Carrara', 'Viterbo', 'Como', 'Caserta', 'Brindisi',
  
  // Città turistiche
  'Amalfi', 'Capri', 'Positano', 'Sorrento', 'Taormina', 'Sanremo', 'Portofino', 'Alghero', 'Tropea', 'Matera',
  'Assisi', 'Orvieto', 'Perugia', 'Urbino', 'Siracusa', 'Agrigento', 'Cefalù', 'Lucca', 'Pisa', 'Cortona'
]

export function LocationSelect({ value, onChange, onKeyPress }: LocationSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState(value)

  // Se il campo è vuoto, mostra le città principali
  // Altrimenti filtra tutte le città in base all'input
  const filteredCities = inputValue.trim() === '' 
    ? MAIN_CITIES
    : ALL_CITIES.filter(city => {
        const cityLower = city.toLowerCase()
        const inputLower = inputValue.toLowerCase()
        
        // Prioritize cities that start with the input
        return cityLower.startsWith(inputLower) || cityLower.includes(inputLower)
      }).sort((a, b) => {
        const inputLower = inputValue.toLowerCase()
        const aLower = a.toLowerCase()
        const bLower = b.toLowerCase()
        
        // Cities that start with input come first
        const aStarts = aLower.startsWith(inputLower)
        const bStarts = bLower.startsWith(inputLower)
        
        if (aStarts && !bStarts) return -1
        if (!aStarts && bStarts) return 1
        
        // Then sort alphabetically
        return a.localeCompare(b, 'it')
      }).slice(0, 8) // Limit to 8 suggestions

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    onChange(newValue)
    // Sempre aperto quando c'è input o quando è vuoto (per mostrare città principali)
    setIsOpen(true)
  }

  const handleCitySelect = (city: string) => {
    setInputValue(city)
    onChange(city)
    setIsOpen(false)
  }

  const handleInputFocus = () => {
    // Sempre aperto quando si fa focus per mostrare città principali o filtrate
    setIsOpen(true)
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
          ) : (
            <div className="location-option disabled">
              Nessuna città trovata
            </div>
          )}
        </div>
      )}
    </div>
  )
}