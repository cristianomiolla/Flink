import type { ReactNode } from 'react'
import LoadingSpinner from './LoadingSpinner'

interface DataStateHandlerProps {
  loading: boolean
  error: string | null
  data: unknown[]
  searchTerm: string
  locationFilter: string
  children: ReactNode
  emptyTitle?: string
  searchEmptyMessage?: string
  fallbackEmptyMessage?: string
}

export function DataStateHandler({
  loading,
  error,
  data,
  searchTerm,
  locationFilter,
  children,
  emptyTitle = "Nessun risultato",
  searchEmptyMessage = "Nessun risultato trovato per i criteri selezionati",
  fallbackEmptyMessage = "Non ci sono ancora elementi"
}: DataStateHandlerProps) {
  const hasSearchTerms = searchTerm.trim() || locationFilter.trim()

  if (loading) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="loading-state">
            <LoadingSpinner size="large" />
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="error-state">
            <div className="error-card">
              <h2 className="error-title">Errore di caricamento</h2>
              <p className="error-message">{error}</p>
              <button className="btn btn-accent retry-btn" onClick={() => window.location.reload()}>
                Riprova
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (data.length === 0) {
    return (
      <section className="grid-container">
        <div className="container">
          <div className="empty-state">
            <div className="empty-card">
              <h3 className="empty-title">{emptyTitle}</h3>
              <p className="empty-message">
                {hasSearchTerms ? searchEmptyMessage : fallbackEmptyMessage}
              </p>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return <>{children}</>
}