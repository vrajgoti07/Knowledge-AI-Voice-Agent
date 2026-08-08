// ============================================================
// PasswordInput — Input with Show/Hide Password Toggle
// ============================================================

import { forwardRef, useState } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { AuthInput, type AuthInputProps } from './AuthInput'

export const PasswordInput = forwardRef<HTMLInputElement, Omit<AuthInputProps, 'type'>>(
  ({ label = 'Password', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    return (
      <AuthInput
        ref={ref}
        label={label}
        type={showPassword ? 'text' : 'password'}
        icon={Lock}
        rightElement={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="text-text-muted hover:text-text-primary p-1 rounded-md transition-colors"
            title={showPassword ? 'Hide password' : 'Show password'}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4 text-accent-green" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        }
        {...props}
      />
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
