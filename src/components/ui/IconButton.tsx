import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  /**
   * variant：
   * - light  (默认) 奶酪玻璃 + 青苹果字 — 浅色页面主用
   * - solid       青苹果实底 + 奶酪字 — 主操作图标
   * - ghost       透明 + 青苹果字
   * - dark        暗玻璃 + 奶酪字 — AR/Map 暗场景
   */
  variant?: 'light' | 'solid' | 'ghost' | 'dark'
  size?: 'sm' | 'md' | 'lg'
  label?: string
}

const variants = {
  light:  'glass-light text-apple-600 hover:bg-apple-50 active:bg-apple-100 shadow-glass',
  solid:  'bg-apple-400 text-cheese-50 hover:bg-apple-300 active:bg-apple-500 shadow-apple',
  ghost:  'bg-transparent text-apple-600 hover:bg-apple-50 active:bg-apple-100',
  dark:   'glass-dark text-cheese-50',
}

const sizes = {
  sm: 'w-9 h-9 rounded-lg',
  md: 'w-11 h-11 rounded-xl',
  lg: 'w-12 h-12 rounded-2xl',
}

const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon, variant = 'light', size = 'md', label, className = '', ...props }, ref) => {
    return (
      <button
        ref={ref}
        aria-label={label}
        className={`inline-flex items-center justify-center transition-all duration-200 select-none active:scale-95
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
