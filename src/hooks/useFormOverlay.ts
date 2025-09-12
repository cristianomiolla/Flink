import { useState, useEffect, useCallback } from 'react'

interface UseFormOverlayOptions<T> {
  isOpen: boolean
  initialFormData: T
  resetDependencies?: any[]
}

interface FormErrors {
  [key: string]: string | string[]
}

/**
 * Custom hook for form overlay state management
 * Handles form data, errors, submission state, and success messages
 */
export function useFormOverlay<T extends Record<string, any>>({
  isOpen,
  initialFormData,
  resetDependencies = []
}: UseFormOverlayOptions<T>) {
  const [formData, setFormData] = useState<T>(initialFormData)
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Reset form when overlay closes or dependencies change
  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormData)
      setErrors({})
      setSuccessMessage('')
      setIsSubmitting(false)
    }
  }, [isOpen, ...resetDependencies])

  // Handle input change with error clearing
  const handleInputChange = useCallback((field: keyof T, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors for the field being edited
    if (errors[field as string]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field as string]
        return newErrors
      })
    }
  }, [errors])

  // Clear all errors
  const clearErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Set field error
  const setFieldError = useCallback((field: string, error: string | string[]) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  // Set multiple errors
  const setFormErrors = useCallback((newErrors: FormErrors) => {
    setErrors(newErrors)
  }, [])

  return {
    formData,
    setFormData,
    errors,
    isSubmitting,
    setIsSubmitting,
    successMessage,
    setSuccessMessage,
    handleInputChange,
    clearErrors,
    setFieldError,
    setFormErrors
  }
}