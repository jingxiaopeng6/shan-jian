import type { ViewshedProfilePoint } from '../gis/viewshedService'

interface Props {
  samples: ViewshedProfilePoint[]
  /** 遮挡点（高亮标记） */
  obstructionDistance?: number | null
}

const W = 480
const H = 220
const PAD = { l: 36, r: 12, t: 16, b: 24 }

/**
 * 视域剖面图：地形折线 + 视线射线 + 遮挡点标记
 *
 * 横轴 = 距观察者距离（m）
 * 纵轴 = 海拔（m）
 * 棕色填充 = 地形剖面
 * 虚线 = 理论视线高度
 * 红点 = 遮挡点
 */
export default function ViewshedProfileView({ samples, obstructionDistance }: Props) {
  if (!samples || samples.length === 0) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
        <text x={W / 2} y={H / 2} textAnchor="middle" fontSize="12" fill="#A9ADA5">
          无剖面数据
        </text>
      </svg>
    )
  }

  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b

  const maxD = samples[samples.length - 1].distance
  const allE = samples.flatMap((s) => [s.terrainElevation, s.lineOfSight])
  const maxE = Math.max(...allE) + 30
  const minE = Math.min(...allE) - 30
  const eRange = Math.max(1, maxE - minE)

  const xAt = (d: number) => PAD.l + (d / maxD) * plotW
  const yAt = (e: number) => PAD.t + plotH - ((e - minE) / eRange) * plotH

  // 地形折线路径
  const terrainPath = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xAt(s.distance).toFixed(2)} ${yAt(s.terrainElevation).toFixed(2)}`)
    .join(' ')
  const terrainFill = `${terrainPath} L ${xAt(maxD).toFixed(2)} ${PAD.t + plotH} L ${PAD.l} ${PAD.t + plotH} Z`

  // 视线路径
  const losPath = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xAt(s.distance).toFixed(2)} ${yAt(s.lineOfSight).toFixed(2)}`)
    .join(' ')

  // 遮挡点
  const blockedSamples = samples.filter((s) => s.blocked)
  // 遮挡点垂直辅助线
  const obstructionX = obstructionDistance != null ? xAt(obstructionDistance) : null

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" data-testid="viewshed-profile-svg">
      {/* 网格 */}
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => (
        <line
          key={i}
          x1={PAD.l}
          y1={PAD.t + plotH * (1 - t)}
          x2={PAD.l + plotW}
          y2={PAD.t + plotH * (1 - t)}
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {/* 坐标轴 */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke="rgba(169,173,165,0.3)" />
      <line x1={PAD.l} y1={PAD.t + plotH} x2={PAD.l + plotW} y2={PAD.t + plotH} stroke="rgba(169,173,165,0.3)" />
      {/* 轴标签 */}
      <text x={PAD.l - 4} y={PAD.t + 4} textAnchor="end" fontSize="9" fill="#A9ADA5">{Math.round(maxE)}m</text>
      <text x={PAD.l - 4} y={PAD.t + plotH + 3} textAnchor="end" fontSize="9" fill="#A9ADA5">{Math.round(minE)}m</text>
      <text x={PAD.l} y={H - 6} textAnchor="start" fontSize="9" fill="#A9ADA5">0 m</text>
      <text x={PAD.l + plotW} y={H - 6} textAnchor="end" fontSize="9" fill="#A9ADA5">{maxD > 1000 ? `${(maxD / 1000).toFixed(1)} km` : `${Math.round(maxD)} m`}</text>

      {/* 遮挡点垂直辅助线 */}
      {obstructionX != null && (
        <line
          x1={obstructionX}
          y1={PAD.t}
          x2={obstructionX}
          y2={PAD.t + plotH}
          stroke="#ef4444"
          strokeWidth={1}
          strokeDasharray="2 3"
          opacity={0.5}
        />
      )}

      {/* 地形填充 */}
      <path d={terrainFill} fill="#D7A85C" opacity={0.25} />
      <path d={terrainPath} fill="none" stroke="#D7A85C" strokeWidth={1.5} opacity={0.8} />

      {/* 视线 */}
      <path d={losPath} fill="none" stroke="#8DAA91" strokeWidth={1.8} strokeDasharray="4 2" />

      {/* 遮挡点 */}
      {blockedSamples.map((s, i) => (
        <circle
          key={i}
          cx={xAt(s.distance)}
          cy={yAt(s.terrainElevation)}
          r={3.5}
          fill="#ef4444"
          stroke="#F4F1E8"
          strokeWidth={1}
        />
      ))}

      {/* 观察者标记 */}
      <circle cx={xAt(0)} cy={yAt(samples[0].terrainElevation)} r={4} fill="#8DAA91" stroke="#F4F1E8" strokeWidth={1.5} />
      <text x={xAt(0) + 8} y={yAt(samples[0].terrainElevation) - 6} fontSize="9" fill="#8DAA91" fontWeight="600">游客</text>

      {/* 目标标记 */}
      <circle cx={xAt(maxD)} cy={yAt(samples[samples.length - 1].terrainElevation)} r={4} fill="#D7A85C" stroke="#F4F1E8" strokeWidth={1.5} />
      <text x={xAt(maxD) - 8} y={yAt(samples[samples.length - 1].terrainElevation) - 6} textAnchor="end" fontSize="9" fill="#D7A85C" fontWeight="600">山峰</text>
    </svg>
  )
}
