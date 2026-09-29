import { HTMLAttributes, ReactNode } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /** 亮色还是暗色玻璃 */
  tone?: 'dark' | 'light'
  /** 内边距 */
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const tones = {
  dark: 'glass-panel text-mist',
  light: 'glass-light text-ink',
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export default function GlassPanel({ children, tone = 'dark', padding = 'md', className = '', ...props }: GlassPanelProps) {
  return (
    <div className={`rounded-2xl ${tones[tone]} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  )
}
