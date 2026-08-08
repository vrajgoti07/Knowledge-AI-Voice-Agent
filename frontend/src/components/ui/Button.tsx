import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  pill?: boolean
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-[#54A4E5] text-[#0A0E1A] hover:bg-[#4696D7] focus-visible:ring-[#60A5FA] font-semibold',
  secondary:
    'bg-[#121A2C] border border-[#1E293B] text-[#F1F5F9] hover:bg-[#16213A] focus-visible:ring-[#60A5FA]',
  ghost:
    'bg-transparent text-[#F1F5F9] border border-[#2D3A54] hover:bg-[#16213A] focus-visible:ring-[#60A5FA]',
  danger:
    'bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500',
  destructive:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500',
  outline:
    'bg-transparent border border-[#54A4E5]/50 text-[#54A4E5] hover:bg-[#54A4E5]/10 focus-visible:ring-[#60A5FA]',
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-8.5 px-3.5 text-xs rounded-lg',
  md: 'h-10 px-4.5 text-sm rounded-lg',
  lg: 'h-12 px-6 text-base rounded-full',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      pill = false,
      isLoading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={clsx(
          'inline-flex items-center justify-center gap-2 font-semibold transition-colors duration-150 select-none cursor-pointer whitespace-nowrap',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0E1A]',
          'disabled:opacity-40 disabled:pointer-events-none',
          VARIANT_CLASSES[variant] || VARIANT_CLASSES.primary,
          SIZE_CLASSES[size] || SIZE_CLASSES.md,
          pill && '!rounded-full',
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <>
            {leftIcon && <span className="shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="shrink-0">{rightIcon}</span>}
          </>
        )}
      </button>
    )
  }
)
Button.displayName = 'Button'
