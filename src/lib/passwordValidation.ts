export interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('La password deve contenere almeno 8 caratteri')
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera maiuscola')
  }

  if (!/[a-z]/.test(password)) {
    errors.push('La password deve contenere almeno una lettera minuscola')
  }

  if (!/\d/.test(password)) {
    errors.push('La password deve contenere almeno un numero')
  }

  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('La password deve contenere almeno un carattere speciale')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}