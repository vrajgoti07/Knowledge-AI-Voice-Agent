import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { clsx } from 'clsx'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'destructive' | 'outline' | 'glass' | 'cyan'
  size?: 'sm' | 'md' | 'lg'
  pill?: boolean
  isLoading?: boolean
  fullWidth?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const VARIANT_CLASSES: Record<string, string> = {
  primary:
    'bg-gradient-to-r from-[#3B82F6] to-[#2563EB] text-white hover:from-[#2563EB] hover:to-[#1D4ED8] shadow-md shadow-blue-500/25 hover:shadow-blue-500/40 active:scale-[0.98] font-semibold border border-blue-400/20',
  secondary:
    'bg-[#121A2C] border border-[#1E293B] text-[#F1F5F9] hover:bg-[#16213A] hover:border-[#3B82F6]/50 active:scale-[0.98]',
  ghost:
    'bg-transparent text-[#94A3B8] hover:text-[#F1F5F9] hover:bg-white/[0.06] active:scale-[0.98]',
  danger:
    'bg-transparent border border-red-500/40 text-red-400 hover:bg-red-500/10 focus-visible:ring-red-500 active:scale-[0.98]',
  destructive:
    'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 active:scale-[0.98] shadow-md shadow-red-600/20',
  outline:
    'bg-transparent border border-[#3B82F6]/50 text-[#60A5FA] hover:bg-[#3B82F6]/10 hover:border-[#3B82F6] active:scale-[0.98]',
  glass:
    'bg-white/[0.06] backdrop-blur-md border border-white/10 text-[#F1F5F9] hover:bg-white/[0.1] hover:border-white/20 active:scale-[0.98] shadow-sm',
  cyan:
    'bg-gradient-to-r from-[#06B6D4] to-[#0284C7] text-white hover:from-[#0891B2] hover:to-[#0369A1] shadow-md shadow-cyan-500/25 hover:shadow-cyan-500/40 active:scale-[0.98] font-semibold border border-cyan-400/20',
}

const SIZE_CLASSES: Record<string, string> = {
  sm: 'h-8 px-3 text-xs rounded-lg',
  md: 'h-9.5 px-4 text-xs sm:text-sm rounded-xl',
  lg: 'h-11 px-5.5 text-sm sm:text-base rounded-xl',
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
