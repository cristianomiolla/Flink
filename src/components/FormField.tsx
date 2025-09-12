import { ReactNode } from 'react'

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  error?: string | string[]
  children: ReactNode
  className?: string
}

/**
 * Reusable form field component that provides:
 * - Consistent label styling with optional required indicator
 * - Error message display (supports string or string array)
 * - Proper form field structure
 */
export function FormField({ 
  label, 
  htmlFor, 
  required = false, 
  error, 
  children, 
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`form-group ${className}`}>
      <label className="form-label" htmlFor={htmlFor}>
        {label} {required && <span className="required-indicator">*</span>}
      </label>
      {children}
      {error && (
        <div className="form-errors">
          {Array.isArray(error) ? (
            error.map((errorMsg, index) => (
              <div key={index} className="form-error">{errorMsg}</div>
            ))
          ) : (
            <div className="form-error">{error}</div>
          )}
        </div>
      )}
    </div>
  )
}