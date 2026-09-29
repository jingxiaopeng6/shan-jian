import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  variant?: 'glass' | 'ghost' | 'gold'
  size?: 'sm' | 'md'
  label?: string
}

const variants = {
  glass: 'glass-panel text-mist',
  ghost: 'bg-transparent text-mist/70 hover:bg-white/5',
  gold: 'bg-gold-200 text-ink',
}

const sizes = {
  sm: 'w-9 h-9 rounded-lg',
  md: 'w-11 h-11 rounded-xl',
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'glass', size = 'md', label, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`inline-flex items-center justify-center transition-all duration-200 select-none
          ${variants[variant]} ${sizes[size]} ${className}`}
        {...props}
      >
        {icon}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'
export default IconButton
