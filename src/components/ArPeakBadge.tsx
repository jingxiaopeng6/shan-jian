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
  /** 突出显示（从地图跳转过来时高亮） */
  highlight?: boolean
  style?: CSSProperties
  onClick?: () => void
}

/**
 * AR 山峰标签 —— 极简沉浸式设计
 * 只显示：山峰名 + 海拔
 * 高亮时使用日落金强调
 */
export default function ArPeakBadge({ peak, visiblePeak, overlay, hidden, highlight, style, onClick }: Props) {
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
      className={`absolute -translate-x-1/2 -translate-y-full group transition-transform active:scale-95 ${highlight ? 'z-10' : ''}`}
      style={computedStyle}
      data-testid={`ar-badge-${peak.id}`}
      aria-label={`${peak.name} ${peak.elevation}米 距离${distanceKm.toFixed(1)}公里 方位${azimuthCompass(bearingDeg)}`}
    >
      {/* 连线指示 */}
      <div className={`mx-auto mb-1 w-px h-6 ${highlight ? 'bg-gold/80' : 'bg-white/70'}`} />
      {/* 极简标签 */}
      <div className={`relative rounded-full backdrop-blur-md px-3 py-1.5 text-center text-white shadow-lg transition ${
        highlight
          ? 'bg-gold/90 ring-2 ring-gold/40'
          : 'bg-ink/70 border border-white/15 group-active:bg-ink/90'
      }`}>
        <div className="flex items-baseline justify-center gap-1.5">
          <span className="text-xs font-semibold tracking-wide">{peak.name}</span>
          <span className="text-[10px] text-mist/70 tabular-nums">{peak.elevation}m</span>
        </div>
        {/* 指示三角 */}
        <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rotate-45 ${
          highlight ? 'bg-gold/90' : 'bg-ink/70 border-r border-b border-white/15'
        }`} />
      </div>
    </button>
  )
}

function azimuthCompass(deg: number): string {
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][idx] ?? '—'
}
