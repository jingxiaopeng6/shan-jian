import { HTMLAttributes, ReactNode } from 'react'

interface GlassPanelProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  /**
   * 玻璃色调：
   * - light  (默认) 奶酪玻璃 — 浅色页面主用
   * - dark          暗玻璃 — AR 摄像头 / Cesium 地图 overlay
   */
  tone?: 'light' | 'dark'
  /** 内边距 */
  padding?: 'sm' | 'md' | 'lg' | 'none'
}

const tones = {
  light: 'glass-light text-ink shadow-glass',
  dark:  'glass-dark text-cheese-50',
}

const paddings = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
}

export default function GlassPanel({ children, tone = 'light', padding = 'md', className = '', ...props }: GlassPanelProps) {
  return (
    <div className={`rounded-2xl ${tones[tone]} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  )
}
