import type { Peak, UserPosition, ViewshedSector, VisiblePeak } from '../types'

interface Props {
  user: UserPosition
  sectors: ViewshedSector[]
  peaks: Array<VisiblePeak & { peak: Peak }>
}

const SIZE = 320
const CX = SIZE / 2
const CY = SIZE / 2
const R_MAX = 130 // 最大半径（像素）

/** 俯视示意图：扇区 + 标注用户中心点 + 山峰点 */
export default function ViewshedPlanView({ user, sectors, peaks }: Props) {
  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto" data-testid="viewshed-plan-svg">
      {/* 背景圆 */}
      <circle cx={CX} cy={CY} r={R_MAX + 12} fill="#f3f6f4" stroke="#c3d6cb" />
      {/* 距离刻度圆 */}
      {[0.33, 0.66, 1].map((r, i) => (
        <circle
          key={i}
          cx={CX}
          cy={CY}
          r={R_MAX * r}
          fill="none"
          stroke="#c3d6cb"
          strokeDasharray={i === 2 ? '' : '2 3'}
          strokeWidth={1}
        />
      ))}
      {/* 方位十字 */}
      <line x1={CX - R_MAX - 5} y1={CY} x2={CX + R_MAX + 5} y2={CY} stroke="#c3d6cb" strokeDasharray="2 3" />
      <line x1={CX} y1={CY - R_MAX - 5} x2={CX} y2={CY + R_MAX + 5} stroke="#c3d6cb" strokeDasharray="2 3" />
      <text x={CX} y={CY - R_MAX - 8} textAnchor="middle" fontSize="10" fill="#5f4f3f">N</text>
      <text x={CX + R_MAX + 8} y={CY + 3} textAnchor="start" fontSize="10" fill="#5f4f3f">E</text>

      {/* 视域扇区 */}
      {sectors.map((s, i) => {
        const rPx = Math.min(1, s.distanceM / 8000) * R_MAX
        const color = sectorColor(s.status)
        const path = sectorPath(CX, CY, rPx, s.azimuthStartDeg, s.azimuthEndDeg)
        return (
          <path key={i} d={path} fill={color} opacity={0.65} stroke={color} strokeWidth={1} />
        )
      })}

      {/* 用户中心 */}
      <circle cx={CX} cy={CY} r={7} fill="#325043" stroke="#e6d2a9" strokeWidth={2} />
      <text x={CX} y={CY + 30} textAnchor="middle" fontSize="11" fill="#23362f" fontWeight={600}>
        {user.name}
      </text>

      {/* 山峰点：按方位 + 距离分布 */}
      {peaks.map((v) => {
        const distPx = Math.min(1, (v.distanceKm * 1000) / 8000) * R_MAX
        const { x, y } = polar(CX, CY, distPx, v.azimuthDeg)
        return (
          <g key={v.peakId}>
            <line x1={CX} y1={CY} x2={x} y2={y} stroke="#4f7d67" strokeDasharray="2 2" strokeWidth={0.8} opacity={0.45} />
            <circle cx={x} cy={y} r={4} fill="#b3813d" stroke="#23362f" strokeWidth={1} />
            <text x={x} y={y - 7} textAnchor="middle" fontSize="10" fill="#23362f" fontWeight={500}>
              {v.peak.name}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function sectorColor(status: ViewshedSector['status']): string {
  switch (status) {
    case 'visible': return '#4f7d67'
    case 'partial': return '#c49851'
    case 'blocked': return '#d46a4f'
  }
}

/** 极坐标 → 直角坐标（0° 向上 = 北） */
function polar(cx: number, cy: number, r: number, azDeg: number) {
  const rad = ((azDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

/** 生成扇区 path */
function sectorPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  let span = a1 - a0
  if (span <= 0) span += 360
  const start = polar(cx, cy, r, a0)
  const end = polar(cx, cy, r, a1)
  const large = span > 180 ? 1 : 0
  // 用一条细线将中心外延伸以产生扇区
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`
}
