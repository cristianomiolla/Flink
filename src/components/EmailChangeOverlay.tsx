import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { validateEmail } from '../lib/passwordValidation'
import { useFormOverlay } from '../hooks/useFormOverlay'
import { OverlayWrapper } from './OverlayWrapper'
import { FormField } from './FormField'
import './ActionButton.css'

interface EmailChangeOverlayProps {
  isOpen: boolean
  onClose: () => void
}

interface EmailFormData extends Record<string, unknown> {
  newEmail: string
}

export function EmailChangeOverlay({ isOpen, onClose }: EmailChangeOverlayProps) {
  const { user } = useAuth()
  const {
    formData,
    errors,
    isSubmitting,
    setIsSubmitting,
    successMessage,
    setSuccessMessage,
    handleInputChange,
    setFormErrors
  } = useFormOverlay<EmailFormData>({
    isOpen,
    initialFormData: { newEmail: '' }
  })

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    // New email validation
    if (!formData.newEmail) {
      newErrors.newEmail = 'Nuova email richiesta'
    } else if (!validateEmail(formData.newEmail)) {
      newErrors.newEmail = 'Email non valida'
    } else if (formData.newEmail === user?.email) {
      newErrors.newEmail = 'La nuova email deve essere diversa da quella attuale'
    }

    setFormErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    if (isSubmitting || !user) return

    setIsSubmitting(true)

    try {
      // Update email in auth with proper redirect URL
      const { error } = await supabase.auth.updateUser(
        { email: formData.newEmail },
        {
          emailRedirectTo: 'https://cristianomiolla.github.io/Flink/'
        }
      )

      if (error) {
        if (error.message.includes('email_address_taken')) {
          setFormErrors({ newEmail: 'Questa email è già utilizzata da un altro account' })
        } else {
          setFormErrors({ general: error.message })
        }
        return
      }

      setSuccessMessage('Email di conferma inviata! Controlla sia la VECCHIA che la NUOVA casella postale e clicca sui link di conferma in entrambe per completare il cambio.')
      setTimeout(() => {
        onClose()
      }, 5000)

    } catch {
      setFormErrors({ general: 'Si è verificato un errore. Riprova.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <OverlayWrapper 
      isOpen={isOpen} 
      onClose={onClose}
      title="CAMBIA EMAIL"
      subtitle="Aggiorna l'indirizzo email del tuo account"
    >
      {errors.general && (
        <div className="auth-error">
          {errors.general}
        </div>
      )}

      {successMessage && (
        <div className="auth-success">
          {successMessage}
          <div style={{ marginTop: '1rem', fontSize: '13px', lineHeight: '1.4' }}>
            <strong>IMPORTANTE:</strong><br/>
            • Controlla la tua vecchia email ({user?.email}) e clicca il link di conferma<br/>
            • Controlla la tua nuova email e clicca il link di conferma<br/>
            • Solo dopo aver confermato entrambe potrai accedere con la nuova email<br/>
            • Fino ad allora continuerai ad accedere con la vecchia email<br/>
            • La sincronizzazione del profilo avverrà automaticamente dopo la conferma
          </div>
        </div>
      )}

      <form className="auth-form" onSubmit={handleSubmit}>
        {/* Current Email Display */}
        <div className="form-group">
          <label className="form-label">
            Email attuale
          </label>
          <div className="current-email-display">
            {user?.email || 'N/A'}
          </div>
        </div>

        {/* New Email */}
        <FormField 
          label="Nuova email" 
          htmlFor="newEmail" 
          required={true}
          error={errors.newEmail}
        >
          <input
            id="newEmail"
            type="email"
            className={`form-input ${errors.newEmail ? 'error' : ''}`}
            value={formData.newEmail}
            onChange={(e) => handleInputChange('newEmail', e.target.value)}
            placeholder="Inserisci la nuova email"
            disabled={isSubmitting}
          />
        </FormField>

        <div className="warning-message" style={{ background: 'rgb(254, 243, 199)', color: 'rgb(146, 64, 14)', padding: '1rem', borderRadius: '4px', fontSize: '0.875rem' }}>
          <strong>Attenzione:</strong> Riceverai due email di conferma: una sulla vecchia email ({user?.email}) e una sulla nuova. Dovrai confermare entrambe per completare il cambio. Fino ad allora continuerai ad accedere con la vecchia email.
        </div>

        <button
          type="submit"
          className="action-btn"
          disabled={isSubmitting || !formData.newEmail.trim()}
        >
          {isSubmitting ? 'Invio in corso...' : 'Aggiorna Email'}
        </button>
      </form>
    </OverlayWrapper>
  )
}