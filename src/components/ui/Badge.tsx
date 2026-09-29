import { ReactNode } from 'react'

type Tone = 'forest' | 'gold' | 'rock' | 'moss'

const tones: Record<Tone, string> = {
  forest: 'bg-forest-900/40 text-moss-300 border-forest-700/40',
  gold: 'bg-gold-200/15 text-gold-200 border-gold-200/30',
  rock: 'bg-white/5 text-rock-300 border-white/10',
  moss: 'bg-moss-300/15 text-moss-300 border-moss-300/30',
}

interface BadgeProps {
  children: ReactNode
  tone?: Tone
  className?: string
}

export default function Badge({ children, tone = 'forest', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-medium border ${tones[tone]} ${className}`}>
      {children}
    </span>
  )
}
