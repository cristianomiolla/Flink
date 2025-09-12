import './BookingRequestCard.css'

interface BookingRequestData {
  subject: string
  tattoo_style: string
  body_area: string
  size_category: string
  color_preferences: string
  meaning?: string
  budget_min?: number
  budget_max?: number
  reference_images?: string[] | null
  status: string
  created_at: string
}

interface BookingRequestCardProps {
  bookingData: BookingRequestData
  isFromCurrentUser: boolean
  timestamp: string
}

export function BookingRequestCard({ bookingData, isFromCurrentUser, timestamp }: BookingRequestCardProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString('it-IT', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const formatBudget = () => {
    if (bookingData.budget_min && bookingData.budget_max) {
      return `€${bookingData.budget_min} - €${bookingData.budget_max}`
    } else if (bookingData.budget_min) {
      return `da €${bookingData.budget_min}`
    } else if (bookingData.budget_max) {
      return `fino a €${bookingData.budget_max}`
    }
    return 'Budget da definire'
  }

  const getStatusBadge = () => {
    switch (bookingData.status) {
      case 'pending':
        return <span className="status-badge pending">In attesa</span>
      case 'accepted':
        return <span className="status-badge accepted">Accettata</span>
      case 'declined':
        return <span className="status-badge declined">Rifiutata</span>
      default:
        return <span className="status-badge pending">In attesa</span>
    }
  }

  return (
    <div className={`message ${isFromCurrentUser ? 'sent' : 'received'}`}>
      <div className="booking-request-card">
        <div className="booking-header">
          <div className="booking-title">
            <span className="booking-icon">📝</span>
            <h4>Richiesta Tatuaggio</h4>
          </div>
          {getStatusBadge()}
        </div>
        
        <div className="booking-content">
          <div className="booking-field">
            <span className="field-label">Soggetto:</span>
            <span className="field-value">{bookingData.subject}</span>
          </div>
          
          <div className="booking-field">
            <span className="field-label">Stile:</span>
            <span className="field-value">{bookingData.tattoo_style}</span>
          </div>
          
          <div className="booking-field">
            <span className="field-label">Zona:</span>
            <span className="field-value">{bookingData.body_area}</span>
          </div>
          
          <div className="booking-field">
            <span className="field-label">Dimensioni:</span>
            <span className="field-value">{bookingData.size_category}</span>
          </div>
          
          <div className="booking-field">
            <span className="field-label">Colore:</span>
            <span className="field-value">{bookingData.color_preferences}</span>
          </div>
          
          {bookingData.meaning && (
            <div className="booking-field">
              <span className="field-label">Significato:</span>
              <span className="field-value">{bookingData.meaning}</span>
            </div>
          )}
          
          {bookingData.reference_images && bookingData.reference_images.length > 0 && (
            <div className="booking-field reference-images">
              <span className="field-label">Riferimenti:</span>
              <div className="reference-images-container">
                {bookingData.reference_images.map((imageUrl, index) => (
                  <div key={index} className="reference-image">
                    <img 
                      src={imageUrl} 
                      alt={`Riferimento ${index + 1}`}
                      className="reference-image-preview"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="booking-field">
            <span className="field-label">Budget:</span>
            <span className="field-value budget">{formatBudget()}</span>
          </div>
        </div>
        
        <div className="booking-footer">
          <span className="booking-time">{formatTime(timestamp)}</span>
        </div>
      </div>
    </div>
  )
}