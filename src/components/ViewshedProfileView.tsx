import type { ViewshedProfileSample } from '../types'

interface Props {
  samples: ViewshedProfileSample[]
}

const W = 480
const H = 200
const PAD = { l: 32, r: 12, t: 16, b: 22 }

/** 视域剖面图：地形折线 + 视线射线 + 遮挡点标记 */
export default function ViewshedProfileView({ samples }: Props) {
  const plotW = W - PAD.l - PAD.r
  const plotH = H - PAD.t - PAD.b

  const maxD = samples[samples.length - 1].distance
  const maxE = Math.max(...samples.map((s) => Math.max(s.terrainElevation, s.lineOfSight))) + 30
  const minE = Math.min(...samples.map((s) => Math.min(s.terrainElevation, s.lineOfSight))) - 30
  const eRange = Math.max(1, maxE - minE)

  const xAt = (d: number) => PAD.l + (d / maxD) * plotW
  const yAt = (e: number) => PAD.t + plotH - ((e - minE) / eRange) * plotH

  const terrainPath = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xAt(s.distance).toFixed(2)} ${yAt(s.terrainElevation).toFixed(2)}`)
    .join(' ')
  const terrainFill = `${terrainPath} L ${xAt(maxD).toFixed(2)} ${PAD.t + plotH} L ${PAD.l} ${PAD.t + plotH} Z`
  const losPath = samples
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${xAt(s.distance).toFixed(2)} ${yAt(s.lineOfSight).toFixed(2)}`)
    .join(' ')

  const blockedSamples = samples.filter((s) => s.blocked)

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
          stroke="#e1ebe5"
          strokeWidth={1}
        />
      ))}
      {/* 坐标轴 */}
      <line x1={PAD.l} y1={PAD.t} x2={PAD.l} y2={PAD.t + plotH} stroke="#c3d6cb" />
      <line x1={PAD.l} y1={PAD.t + plotH} x2={PAD.l + plotW} y2={PAD.t + plotH} stroke="#c3d6cb" />
      {/* 轴标签 */}
      <text x={PAD.l - 6} y={PAD.t + 4} textAnchor="end" fontSize="9" fill="#5f4f3f">{Math.round(maxE)}m</text>
      <text x={PAD.l - 6} y={PAD.t + plotH} textAnchor="end" fontSize="9" fill="#5f4f3f">{Math.round(minE)}m</text>
      <text x={PAD.l} y={H - 6} textAnchor="start" fontSize="9" fill="#5f4f3f">0 m</text>
      <text x={PAD.l + plotW} y={H - 6} textAnchor="end" fontSize="9" fill="#5f4f3f">{maxD} m</text>

      {/* 地形填充 */}
      <path d={terrainFill} fill="#e6d2a9" opacity={0.85} />
      <path d={terrainPath} fill="none" stroke="#c49851" strokeWidth={1.5} />

      {/* 视线 */}
      <path d={losPath} fill="none" stroke="#325043" strokeWidth={1.8} strokeDasharray="4 2" />

      {/* 遮挡点 */}
      {blockedSamples.map((s, i) => (
        <g key={i}>
          <circle cx={xAt(s.distance)} cy={yAt(s.terrainElevation)} r={3} fill="#e55" stroke="#fff" strokeWidth={1} />
        </g>
      ))}
    </svg>
  )
}
