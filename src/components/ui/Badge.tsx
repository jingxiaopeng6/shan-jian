import { ReactNode } from 'react'

type Tone = 'apple' | 'amber' | 'forest' | 'rock'

const tones: Record<Tone, string> = {
  // 青苹果标签 — 主标签/CTA 旁注
  apple:   'bg-apple-100 text-apple-700 border-apple-400/40',
  // 暮色橙 — 警示/数据高亮
  amber:   'bg-amber-50 text-amber-400 border-amber-200/40',
  // 深森林 — 状态/类型标签
  forest:  'bg-forest-100 text-forest-600 border-forest-300/40',
  // 中性灰 — 弱化标签
  rock:    'bg-rock-50 text-rock-400 border-rock-200/50',
}

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

export default function Badge({ children, tone = 'apple', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-overline border ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}
