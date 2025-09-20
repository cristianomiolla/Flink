import { useState, useEffect } from 'react'
import './MonthSlider.css'

interface MonthSliderProps {
  onMonthChange: (year: number, month: number) => void
  initialYear?: number
  initialMonth?: number
}

export function MonthSlider({ onMonthChange, initialYear, initialMonth }: MonthSliderProps) {
  const currentDate = new Date()
  const [selectedYear, setSelectedYear] = useState(initialYear || currentDate.getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(initialMonth || currentDate.getMonth())

  const months = [
    'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
    'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre'
  ]

  useEffect(() => {
    onMonthChange(selectedYear, selectedMonth)
  }, [selectedYear, selectedMonth, onMonthChange])

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11)
      setSelectedYear(selectedYear - 1)
    } else {
      setSelectedMonth(selectedMonth - 1)
    }
  }

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0)
      setSelectedYear(selectedYear + 1)
    } else {
      setSelectedMonth(selectedMonth + 1)
    }
  }

  const goToCurrentMonth = () => {
    setSelectedYear(currentDate.getFullYear())
    setSelectedMonth(currentDate.getMonth())
  }

  const isCurrentMonth = selectedYear === currentDate.getFullYear() && selectedMonth === currentDate.getMonth()

  return (
    <div className="month-slider">
      <button
        className="month-nav-btn prev-btn"
        onClick={goToPreviousMonth}
        title="Mese precedente"
      >
        ◀
      </button>

      <div className="month-display">
        <span className="month-name">{months[selectedMonth]}</span>
        <span className="year-name">{selectedYear}</span>
        {!isCurrentMonth && (
          <button
            className="current-month-btn"
            onClick={goToCurrentMonth}
            title="Vai al mese corrente"
          >
            Oggi
          </button>
        )}
      </div>

      <button
        className="month-nav-btn next-btn"
        onClick={goToNextMonth}
        title="Mese successivo"
      >
        ▶
      </button>
    </div>
  )
}