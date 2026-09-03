import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultUserPosition, getPeakById, getVisiblePeaks } from '../data/mock'
import ArPeakBadge, { type HeadingKey } from '../components/ArPeakBadge'

export default function ArPage() {
  const navigate = useNavigate()
  const [heading, setHeading] = useState<HeadingKey>('E')
  const headingDegMap: Record<HeadingKey, number> = { N: 0, E: 90, S: 180, W: 270, SW: 225 }
  const currentHeading = headingDegMap[heading]

  const visible = useMemo(
    () => getVisiblePeaks(defaultUserPosition, currentHeading).filter((v) => v.visible),
    [currentHeading]
  )

  return (
    <div className="max-w-3xl mx-auto px-3 py-4 sm:py-6">
      {/* 顶部状态栏 */}
      <div className="flex items-center justify-between px-2 pb-3">
        <div>
          <div className="text-xs text-stone2-400">模拟摄像头 · {defaultUserPosition.name}</div>
          <div className="text-sm text-forest-800 font-medium mt-0.5">AR 看山 · 朝向 {labelOf(heading)}</div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-forest-700/10 text-forest-700 text-[10px] px-2 py-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
            LIVE · 模拟
          </span>
        </div>
      </div>

      {/* 取景器 */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black border border-forest-900/20 shadow-soft"
        style={{ aspectRatio: '9 / 16' }}
        role="img"
        aria-label="模拟 AR 摄像头画面"
        data-testid="ar-viewfinder"
      >
        {/* 背景画面：克制的山景渐变模拟 */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(180deg, #cfd8d2 0%, #e8e5d6 48%, #b8bda6 100%)'
          }}
        >
          <svg viewBox="0 0 900 1600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
            {/* 远山 */}
            <path d="M0,900 L90,840 L180,900 L290,820 L400,890 L520,810 L640,890 L760,830 L900,900 L900,1600 L0,1600 Z" fill="#8fa18d" opacity="0.7"/>
            {/* 中山 */}
            <path d="M0,1060 L120,980 L240,1050 L360,970 L480,1050 L600,990 L720,1060 L840,1000 L900,1030 L900,1600 L0,1600 Z" fill="#5c7260" opacity="0.85"/>
            {/* 前景草坡 */}
            <path d="M0,1280 Q 220 1200 450 1260 T 900 1250 L 900 1600 L 0 1600 Z" fill="#3a5040"/>
            {/* 云带 */}
            <path d="M0,520 Q 300 490 500 530 T 900 510 L 900 560 Q 620 570 450 560 T 0 560 Z" fill="#ffffff" opacity="0.35"/>
          </svg>
        </div>

        {/* 十字准星 */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="relative w-20 h-20">
            <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/70" />
            <div className="absolute top-1/2 left-0 right-0 h-px bg-white/70" />
            <div className="absolute inset-4 rounded-full border border-white/50" />
          </div>
        </div>

        {/* 方位刻度顶栏 */}
        <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-1 text-white/90 text-[11px] tracking-widest bg-gradient-to-b from-black/40 to-transparent">
          <span>◀ {leftAz(currentHeading - 60)}</span>
          <span className="text-sand-200">▲ {az(currentHeading)}</span>
          <span>{rightAz(currentHeading + 60)} ▶</span>
        </div>

        {/* 山峰 Badge：根据 azimuth → left% 映射（±60° → 8%~92%） */}
        {visible.map((v) => {
          const peak = getPeakById(v.peakId)
          if (!peak) return null
          // 将 azimuth 在 [heading-60, heading+60] 区间线性映射
          let offset = v.azimuthDeg - currentHeading
          while (offset > 180) offset -= 360
          while (offset < -180) offset += 360
          const clamped = Math.max(-60, Math.min(60, offset))
          const leftPct = 8 + ((clamped + 60) / 120) * 84
          const verticalPct = 25 + ((v.distanceKm) / 8) * 40 // 越近越靠下
          return (
            <ArPeakBadge
              key={v.peakId}
              peak={peak}
              visiblePeak={v}
              style={{ left: `${leftPct}%`, top: `${verticalPct}%` }}
              onClick={() => navigate(`/peak/${v.peakId}`)}
            />
          )
        })}

        {/* 底部取景提示 */}
        <div className="absolute left-0 right-0 bottom-0 h-14 px-4 flex items-center justify-between text-white/85 text-[11px] bg-gradient-to-t from-black/60 to-transparent">
          <span>共 {visible.length} 座山峰可见</span>
          <span className="text-sand-200">点击标签查看详情 →</span>
        </div>
      </div>

      {/* 视角切换 */}
      <div className="mt-4 flex items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {(['N', 'E', 'S', 'W', 'SW'] as HeadingKey[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setHeading(k)}
              className={`h-8 px-3 rounded-full text-xs border transition ${
                heading === k
                  ? 'bg-forest-700 text-white border-forest-700'
                  : 'bg-white text-forest-700 border-forest-200 hover:bg-forest-50'
              }`}
            >
              {labelOf(k)}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/viewshed')}
          className="text-xs text-forest-600 hover:text-forest-800 whitespace-nowrap"
        >
          视域分析 →
        </button>
      </div>
    </div>
  )
}

function labelOf(h: HeadingKey | string): string {
  const map: Record<string, string> = { N: '正北', E: '正东', S: '正南', W: '正西', SW: '西南' }
  return map[h] ?? h
}

function az(deg: number): string {
  return formatDeg(deg)
}
function leftAz(deg: number): string {
  if (deg < 0) deg += 360
  return formatDeg(deg)
}
function rightAz(deg: number): string {
  if (deg >= 360) deg -= 360
  return formatDeg(deg)
}
function formatDeg(deg: number): string {
  const d = ((deg % 360) + 360) % 360
  return `${Math.round(d)}°`
}
