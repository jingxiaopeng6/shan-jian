import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react'

/**
 * 《山见》Button v2.0 — 三级层级体系
 *
 * - primary:   青苹果实底 + 奶酪字  — 主操作（CTA、确认）
 * - secondary: 奶酪底 + 青苹果描边 + 青苹果字 — 次操作（查看、跳转）
 * - ghost:     纯文字 + 青苹果下划线 hover — 辅助操作（取消、返回）
 * - danger:    暮色橙实底 — 危险/警告
 */
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
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
  // 主按钮：青苹果实底 + 奶酪文字 + 苹果绿阴影
  primary:
    'bg-apple-400 text-cheese-50 hover:bg-apple-300 active:bg-apple-500 shadow-apple',
  // 次按钮：奶酪底 + 青苹果描边/文字
  secondary:
    'bg-cheese-50 text-apple-600 border border-apple-400/40 hover:bg-apple-50 hover:border-apple-400 active:bg-apple-100',
  // Ghost：纯文字
  ghost:
    'bg-transparent text-apple-600 hover:bg-apple-50 active:bg-apple-100',
  // Danger：暮色橙
  danger:
    'bg-amber-200 text-cheese-50 hover:bg-amber-100 active:bg-amber-300 shadow-soft',
}

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-xs rounded-lg gap-1.5',
  md: 'h-11 px-5 text-sm rounded-xl gap-2',
  lg: 'h-12 px-6 text-base rounded-xl gap-2',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, fullWidth, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={`inline-flex items-center justify-center font-medium transition-all duration-200 select-none
          ${variants[variant]} ${sizes[size]} ${fullWidth ? 'w-full' : ''}
          ${disabled || loading ? 'opacity-50 cursor-not-allowed shadow-none' : 'cursor-pointer active:scale-[0.98]'}
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
