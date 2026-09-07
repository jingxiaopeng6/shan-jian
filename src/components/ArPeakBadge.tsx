import type { CSSProperties } from 'react'
import type { Peak, VisiblePeak } from '../types'
import type { ArPeakOverlayItem } from '../hooks/useArPeakOverlay'

export type HeadingKey = 'N' | 'E' | 'S' | 'W' | 'SW'

interface Props {
  peak: Peak
  /** Stage 2 mock 模式 */
  visiblePeak?: VisiblePeak
  /** Stage 4 overlay 模式（真实 GPS + heading 计算结果） */
  overlay?: ArPeakOverlayItem
  /** 强制隐藏 */
  hidden?: boolean
  style?: CSSProperties
  onClick?: () => void
}

export default function ArPeakBadge({ peak, visiblePeak, overlay, hidden, style, onClick }: Props) {
  // 统一数据读取：overlay 优先
  const distanceKm = overlay ? overlay.distanceKm : visiblePeak?.distanceKm ?? 0
  const bearingDeg = overlay ? overlay.bearingDeg : visiblePeak?.azimuthDeg ?? 0

  // Stage 4：超出 FOV 范围则隐藏
  if (hidden || (overlay && !overlay.inFOV)) return null

  // Stage 4 overlay 模式下，由父组件传入的 overlay.screenXPercent 决定屏幕位置
  const computedStyle: CSSProperties = overlay
    ? { left: `${overlay.screenXPercent}%`, top: '45%', ...style }
    : style ?? {}
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute -translate-x-1/2 -translate-y-full group"
      style={computedStyle}
      data-testid={`ar-badge-${peak.id}`}
      aria-label={`${peak.name} ${peak.elevation}米 距离${distanceKm.toFixed(1)}公里`}
    >
      {/* 连线指示 */}
      <div className="mx-auto mb-0.5 w-px h-5 bg-white/80" />
      <div className="relative min-w-[110px] max-w-[180px] rounded-lg bg-forest-900/80 backdrop-blur border border-white/15 px-2.5 py-1.5 text-left text-white shadow-soft group-hover:bg-forest-800/90 transition">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-medium tracking-wide">{peak.name}</span>
          <span className="text-[10px] text-sand-200 tabular-nums">
            {distanceKm.toFixed(distanceKm < 10 ? 1 : 0)} km
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2 text-[10px] text-white/75">
          <span>海拔 <span className="text-white tabular-nums">{peak.elevation} m</span></span>
          <span>{azimuthCompass(bearingDeg)}</span>
        </div>
        {overlay && (
          <div className="mt-0.5 text-[9px] text-white/55 tabular-nums">
            方位 {Math.round(bearingDeg)}° · 相对 {overlay.relativeDeg > 0 ? '+' : ''}{Math.round(overlay.relativeDeg)}°
          </div>
        )}
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
