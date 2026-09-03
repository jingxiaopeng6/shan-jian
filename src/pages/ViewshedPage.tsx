import { useMemo } from 'react'
import PageContainer from '../components/PageContainer'
import ViewshedPlanView from '../components/ViewshedPlanView'
import ViewshedProfileView from '../components/ViewshedProfileView'
import { defaultUserPosition, getPeakById, getViewshedProfile, getViewshedSectors, getVisiblePeaks } from '../data/mock'

export default function ViewshedPage() {
  const user = defaultUserPosition
  const sectors = useMemo(() => getViewshedSectors(user), [user])
  const profile = useMemo(() => getViewshedProfile(user), [user])
  const visibleList = useMemo(() => getVisiblePeaks(user).filter((v) => v.visible).slice(0, 8), [user])

  return (
    <PageContainer>
      {/* 顶部信息 */}
      <section className="mb-6">
        <div className="text-xs text-stone2-400 mb-1">GIS · 视域分析结果</div>
        <h1 className="font-serif text-forest-900 text-2xl font-semibold">
          站在 <span className="text-sand-600">{user.name}</span>，你能看到什么？
        </h1>
        <p className="mt-2 text-sm text-stone2-500 leading-6">
          以下为基于当前模拟位置的视域扇区与视线剖面图（Mock 可视化，不代表真实地形计算）。
        </p>
      </section>

      {/* 可视化两栏：俯视示意图 + 剖面图 */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl2 bg-white border border-forest-100 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-forest-800">俯视示意图</div>
              <div className="text-[11px] text-stone2-400 mt-0.5">不同颜色扇区代表视线可达范围</div>
            </div>
            <Legend />
          </div>
          <ViewshedPlanView user={user} sectors={sectors} peaks={visibleList.map((v) => ({
            ...v,
            peak: getPeakById(v.peakId)!
          }))} />
        </div>

        <div className="rounded-xl2 bg-white border border-forest-100 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-forest-800">视线剖面图</div>
              <div className="text-[11px] text-stone2-400 mt-0.5">横轴：距离 纵轴：海拔</div>
            </div>
            <div className="flex flex-col items-end gap-1 text-[10px]">
              <span className="inline-flex items-center gap-1.5 text-forest-700">
                <i className="w-5 h-0.5 bg-forest-700" /> 视线
              </span>
              <span className="inline-flex items-center gap-1.5 text-sand-600">
                <i className="w-5 h-1 bg-sand-300 rounded-sm" /> 地形
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-500">
                <i className="w-2 h-2 rounded-full bg-red-500" /> 遮挡点
              </span>
            </div>
          </div>
          <ViewshedProfileView samples={profile} />
        </div>
      </section>

      {/* 可见山峰清单 */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-serif text-forest-800 text-lg font-semibold">
            当前位置还能看到这些山峰
          </h2>
          <span className="text-[11px] text-stone2-400">共 {visibleList.length} 座</span>
        </div>
        <ul className="divide-y divide-forest-100 rounded-xl2 border border-forest-100 bg-white shadow-soft overflow-hidden">
          {visibleList.map((v, i) => {
            const p = getPeakById(v.peakId)
            if (!p) return null
            return (
              <li key={v.peakId} className="flex items-center gap-3 px-4 py-3">
                <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-700 flex items-center justify-center font-serif text-sm">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-forest-800 font-medium text-sm">{p.name}</span>
                    <span className="text-[11px] text-stone2-400">{p.pinyin}</span>
                  </div>
                  <div className="mt-0.5 text-[11px] text-stone2-500 truncate">{p.description}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sand-600 text-sm tabular-nums">{v.distanceKm} km</div>
                  <div className="text-[11px] text-stone2-400 tabular-nums">{p.elevation} m · {azimuth(v.azimuthDeg)}</div>
                </div>
              </li>
            )
          })}
        </ul>
      </section>
    </PageContainer>
  )
}

function Legend() {
  return (
    <div className="flex flex-col gap-1 text-[10px]">
      <span className="inline-flex items-center gap-1.5 text-forest-700">
        <i className="w-3 h-3 rounded-sm bg-forest-500/70" /> 完全可视
      </span>
      <span className="inline-flex items-center gap-1.5 text-sand-600">
        <i className="w-3 h-3 rounded-sm bg-sand-400/80" /> 部分遮挡
      </span>
      <span className="inline-flex items-center gap-1.5 text-red-500">
        <i className="w-3 h-3 rounded-sm bg-red-400/80" /> 遮挡
      </span>
    </div>
  )
}

function azimuth(deg: number): string {
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][idx] ?? '—'
}
