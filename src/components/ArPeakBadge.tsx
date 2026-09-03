import type { CSSProperties } from 'react'
import type { Peak, VisiblePeak } from '../types'

export type HeadingKey = 'N' | 'E' | 'S' | 'W' | 'SW'

interface Props {
  peak: Peak
  visiblePeak: VisiblePeak
  style?: CSSProperties
  onClick?: () => void
}

/**
 * AR 山峰信息徽章
 * - 名称、海拔、距离
 * - 点击跳详情
 */
export default function ArPeakBadge({ peak, visiblePeak, style, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-full group"
      style={style}
      data-testid={`ar-badge-${peak.id}`}
      aria-label={`${peak.name} ${peak.elevation}米 距离${visiblePeak.distanceKm}公里`}
    >
      {/* 连线指示 */}
      <div className="mx-auto mb-0.5 w-px h-5 bg-white/80" />
      <div className="relative min-w-[110px] max-w-[160px] rounded-lg bg-forest-900/80 backdrop-blur border border-white/15 px-2.5 py-1.5 text-left text-white shadow-soft group-hover:bg-forest-800/90 transition">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium tracking-wide">{peak.name}</span>
          <span className="text-[10px] text-sand-200 tabular-nums">{visiblePeak.distanceKm} km</span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-white/75">
          <span>海拔 <span className="text-white tabular-nums">{peak.elevation} m</span></span>
          <span>{azimuthCompass(visiblePeak.azimuthDeg)}</span>
        </div>
        {/* 指示三角 */}
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 rotate-45 bg-forest-900/80 border-r border-b border-white/15" />
      </div>
    </button>
  )
}

function azimuthCompass(deg: number): string {
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][idx] ?? '—'
}
