import { useMemo, useState } from 'react'
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
  const [chartType, setChartType] = useState<ChartType>('appointments')

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

  const maxValue = Math.max(...chartData.map(d => chartType === 'appointments' ? d.count : d.earnings), 1)
  const chartHeight = 200
  const chartWidth = 400

  return (
    <div className="appointment-chart">
      <h3 className="chart-title">
        TREND {chartType === 'appointments' ? 'APPUNTAMENTI' : 'GUADAGNI'} (12 MESI)
      </h3>

      <div className="toggle-container">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${chartType === 'appointments' ? 'active' : ''}`}
            onClick={() => setChartType('appointments')}
          >
            Appuntamenti
          </button>
          <button
            className={`toggle-btn ${chartType === 'earnings' ? 'active' : ''}`}
            onClick={() => setChartType('earnings')}
          >
            Guadagni
          </button>
        </div>
      </div>

      <div className="chart-container">
        <svg width={chartWidth} height={chartHeight + 40} className="chart-svg">
          {/* Grid lines */}
          {[0, 1, 2, 3, 4].map(i => {
            const y = chartHeight - (i * chartHeight / 4)
            return (
              <g key={i}>
                <line
                  x1={40}
                  y1={y}
                  x2={chartWidth - 20}
                  y2={y}
                  stroke="var(--border)"
                  strokeWidth={1}
                  strokeDasharray="2,2"
                />
                <text
                  x={35}
                  y={y + 4}
                  className="chart-axis-label"
                  textAnchor="end"
                >
                  {chartType === 'earnings'
                    ? `€${Math.round(((4 - i) * maxValue) / 4)}`
                    : Math.round(((4 - i) * maxValue) / 4)
                  }
                </text>
              </g>
            )
          })}

          {/* Chart line */}
          <polyline
            fill="none"
            stroke="var(--accent)"
            strokeWidth={3}
            points={chartData.map((point, index) => {
              const x = 40 + (index * (chartWidth - 60)) / (chartData.length - 1)
              const value = chartType === 'appointments' ? point.count : point.earnings
              const y = chartHeight - (value / maxValue) * chartHeight
              return `${x},${y}`
            }).join(' ')}
          />

          {/* Data points */}
          {chartData.map((point, index) => {
            const x = 40 + (index * (chartWidth - 60)) / (chartData.length - 1)
            const value = chartType === 'appointments' ? point.count : point.earnings
            const y = chartHeight - (value / maxValue) * chartHeight

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
            const x = 40 + (index * (chartWidth - 60)) / (chartData.length - 1)
            const showLabel = index % 2 === 0 // Show every other label to avoid crowding

            if (!showLabel) return null

            return (
              <text
                key={index}
                x={x}
                y={chartHeight + 20}
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