import { useMemo, useState, useEffect, useRef } from 'react'
import './AppointmentChart.css'
import './CategoryBar.css'

interface AppointmentChartProps {
  appointments: any[]
  selectedYear: number
  selectedMonth: number
}

interface ChartDataPoint {
  month: string
  year: number
  monthIndex: number
  count: number
  earnings: number
}

type ChartType = 'appointments' | 'earnings'

export function AppointmentChart({ appointments, selectedYear, selectedMonth }: AppointmentChartProps) {
  const [chartType, setChartType] = useState<ChartType>('earnings')
  const [containerWidth, setContainerWidth] = useState(600)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth
        // Use consistent padding that matches CSS
        const padding = window.innerWidth <= 768 ? 32 : 48
        setContainerWidth(Math.max(320, width - padding))
      }
    }
    updateWidth()
    window.addEventListener('resize', updateWidth)
    return () => window.removeEventListener('resize', updateWidth)
  }, [])

  const chartData = useMemo(() => {
    const data: ChartDataPoint[] = []
    const monthNames = [
      'Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu',
      'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'
    ]

    // Calculate 12 months starting from current selected month going backwards
    for (let i = 11; i >= 0; i--) {
      const targetDate = new Date(selectedYear, selectedMonth - i, 1)
      const targetYear = targetDate.getFullYear()
      const targetMonth = targetDate.getMonth()

      const monthlyAppointments = appointments.filter(appointment => {
        const appointmentDate = appointment.appointment_date
          ? new Date(appointment.appointment_date)
          : new Date(appointment.created_at)
        return appointmentDate.getFullYear() === targetYear &&
               appointmentDate.getMonth() === targetMonth &&
               appointment.status === 'completed'
      })

      const monthlyEarnings = monthlyAppointments.reduce((total, appointment) => {
        return total + (appointment.total_amount || 0)
      }, 0)

      data.push({
        month: monthNames[targetMonth],
        year: targetYear,
        monthIndex: targetMonth,
        count: monthlyAppointments.length,
        earnings: monthlyEarnings
      })
    }

    return data
  }, [appointments, selectedYear, selectedMonth])

  const dataMaxValue = Math.max(...chartData.map(d => chartType === 'appointments' ? d.count : d.earnings), 1)
  // Create a nice scale with good step values
  const getNiceMaxValue = (value: number) => {
    if (value <= 1) return 4
    if (value <= 5) return 8
    if (value <= 10) return 12
    if (value <= 20) return 24
    if (value <= 50) return 60
    if (value <= 100) return 120
    return Math.ceil(value * 1.2 / 10) * 10
  }
  const maxValue = getNiceMaxValue(dataMaxValue)
  const chartHeight = containerWidth < 400 ? 180 : containerWidth < 500 ? 200 : 300
  const chartWidth = containerWidth
  // Use consistent margins for better centering
  const leftMargin = containerWidth < 400 ? 40 : containerWidth < 500 ? 50 : 60
  const rightMargin = leftMargin // Same margins for perfect centering

  return (
    <div className="appointment-chart" ref={containerRef}>
      <h3 className="chart-title">
        TREND {chartType === 'appointments' ? 'APPUNTAMENTI' : 'RICAVI'} (12 MESI)
      </h3>

      <div className="toggle-container">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${chartType === 'earnings' ? 'active' : ''}`}
            onClick={() => setChartType('earnings')}
          >
            Ricavi
          </button>
          <button
            className={`toggle-btn ${chartType === 'appointments' ? 'active' : ''}`}
            onClick={() => setChartType('appointments')}
          >
            Appuntamenti
          </button>
        </div>
      </div>

      <div className="chart-container">
        <svg width={chartWidth} height={chartHeight + 65} className="chart-svg">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = 20 + chartHeight - (i * chartHeight / 4)
            const value = (i * maxValue) / 4
            return (
              <g key={i}>
                <line
                  x1={leftMargin}
                  y1={y}
                  x2={chartWidth - rightMargin}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                {i > 0 && (
                  <text
                    x={leftMargin - 3}
                    y={y + 4}
                    className="chart-axis-label"
                    textAnchor="end"
                  >
                    {chartType === 'earnings'
                      ? `€${Math.round(value)}`
                      : Math.round(value)
                    }
                  </text>
                )}
              </g>
            )
          })}

          {/* Chart line */}
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth={3}
            points={chartData.map((point, index) => {
              const x = leftMargin + (index * (chartWidth - leftMargin - rightMargin)) / (chartData.length - 1)
              const value = chartType === 'appointments' ? point.count : point.earnings
              const y = 20 + chartHeight - (value / maxValue) * chartHeight
              return `${x},${y}`
            }).join(' ')}
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = leftMargin + (index * (chartWidth - leftMargin - rightMargin)) / (chartData.length - 1)
            const value = chartType === 'appointments' ? point.count : point.earnings
            const y = 20 + chartHeight - (value / maxValue) * chartHeight

            return (
              <g key={index}>
                <circle
                  cx={x}
                  cy={y}
                  r={4}
                  fill="var(--accent)"
                  stroke="var(--background)"
                  strokeWidth={2}
                />
                <text
                  x={x}
                  y={y - 10}
                  className="chart-point-label"
                  textAnchor="middle"
                >
                  {chartType === 'earnings' ? `€${value}` : value}
                </text>
              </g>
            )
          })}

          {/* X-axis labels */}
          {chartData.map((point, index) => {
            const x = leftMargin + (index * (chartWidth - leftMargin - rightMargin)) / (chartData.length - 1)
            const showLabel = index % 2 === 0 // Show every other label to avoid crowding

            if (!showLabel) return null

            return (
              <text
                key={index}
                x={x}
                y={chartHeight + 35}
                className="chart-axis-label"
                textAnchor="middle"
              >
                {point.month}
              </text>
            )
          })}
        </svg>
      </div>
    </div>
  )
}