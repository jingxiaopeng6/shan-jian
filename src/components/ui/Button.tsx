import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

type Variant = 'primary' | 'glass' | 'ghost' | 'gold'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-forest-900 text-mist hover:bg-forest-800 active:bg-forest-950',
  glass: 'glass-panel text-mist hover:bg-ink-100 active:bg-ink-200',
  ghost: 'bg-transparent text-mist/80 hover:bg-white/5 active:bg-white/10',
  gold: 'bg-gold-200 text-ink hover:bg-gold-100 active:bg-gold-300',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-11 px-4 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-sm rounded-xl gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none
          ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${className}`}
        {...props}
      >
        {loading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <>
            {leftIcon}
            {children}
            {rightIcon}
          </>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'
export default Button
