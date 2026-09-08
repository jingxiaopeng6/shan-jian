import { useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import ViewshedProfileView from '../components/ViewshedProfileView'
import { analyzeLineOfSight, formatDistanceM, type ViewshedResult } from '../gis/viewshedService'
import { MockTerrainProvider, createRidge, type TerrainModifier } from '../gis/TerrainProvider'
import { getPeakById, defaultUserPosition } from '../data/mock'
import { testCaseA, testCaseB, testObserverPositions, getAllPeaksAsGeoPoints, createTerrainProvider } from '../data/mockTerrain'
import type { GeoPoint } from '../gis/TerrainProvider'

export default function ViewshedPage() {
  const [searchParams] = useSearchParams()
  const peakId = searchParams.get('peakId') || 'jinding'
  const peak = getPeakById(peakId)

  // 开发模式：选择测试场景
  const [testMode, setTestMode] = useState<'auto' | 'caseA' | 'caseB' | 'custom'>('auto')
  const [customRidgeHeight, setCustomRidgeHeight] = useState(2100)
  const [selectedObserverId, setSelectedObserverId] = useState(testObserverPositions[0].id)

  // 确定观察者位置
  const observer: GeoPoint & { id?: string; name?: string } = useMemo(() => {
    if (testMode === 'caseA') return { ...testCaseA.observer, id: 'caseA', name: '案例A观察者' }
    if (testMode === 'caseB') return { ...testCaseB.observer, id: 'caseB', name: '案例B观察者' }
    if (testMode === 'custom') {
      const pos = testObserverPositions.find((p) => p.id === selectedObserverId)
      return pos || { ...defaultUserPosition, lat: 27.475, lng: 114.17, elevation: 1850 }
    }
    // auto 模式：用默认位置
    return { ...defaultUserPosition, lat: 27.475, lng: 114.17, elevation: 1850 }
  }, [testMode, selectedObserverId])

  // 确定目标山峰
  const target: GeoPoint & { id: string; name: string } = useMemo(() => {
    if (!peak) return { id: 'jinding', name: '金顶', lat: 27.4789, lng: 114.1728, elevation: 1918 }
    return { id: peak.id, name: peak.name, lat: peak.lat, lng: peak.lng, elevation: peak.elevation }
  }, [peak])

  // 构建 TerrainProvider（根据测试模式）
  const provider: MockTerrainProvider = useMemo(() => {
    if (testMode === 'caseB') return createTerrainProvider(testCaseB.modifiers)
    if (testMode === 'custom') {
      // custom 模式：可调山脊高度
      const mods: TerrainModifier[] = customRidgeHeight > 0
        ? [createRidge(1000, 2500, customRidgeHeight, '自定义山脊')]
        : []
      return createTerrainProvider(mods)
    }
    return createTerrainProvider([]) // 无遮挡
  }, [testMode, customRidgeHeight])

  // 执行视线分析
  const result: ViewshedResult = useMemo(() => {
    return analyzeLineOfSight(observer, target, provider, 60)
  }, [observer, target, provider])

  // 批量分析（dev only）：当前位置能看到哪些山峰
  const batchResults = useMemo(() => {
    if (!import.meta.env.DEV) return []
    const allPeaks = getAllPeaksAsGeoPoints()
    return allPeaks.map((p) => {
      const r = analyzeLineOfSight(observer, p, provider, 40)
      return {
        id: p.id,
        name: p.name,
        visible: r.visible,
        distance: r.distance,
        bearing: r.bearing,
        obstruction: r.obstruction
      }
    })
  }, [observer, provider])

  if (!peak) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <div className="font-serif text-forest-800 text-xl mb-2">山峰未找到</div>
          <Link to="/" className="text-forest-600 text-sm hover:underline">返回首页</Link>
        </div>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      {/* 标题 */}
      <section className="mb-6">
        <div className="text-xs text-stone2-400 mb-1">GIS · 视线分析</div>
        <h1 className="font-serif text-forest-900 text-2xl font-semibold">
          {result.visible ? '为什么能看到' : '为什么看不到'}
          <span className="text-sand-600"> {peak.name}</span>？
        </h1>
      </section>

      {/* 正式可视化区域 */}
      <section className="space-y-4">
        {/* 观察者信息 */}
        <div className="rounded-xl2 bg-white border border-forest-100 p-4 shadow-soft">
          <div className="text-[11px] text-stone2-400 tracking-wider mb-2">📍 当前位置</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-stone2-500">海拔</span>
              <span className="ml-2 text-forest-800 font-medium tabular-nums">{observer.elevation} m</span>
            </div>
            <div>
              <span className="text-stone2-500">坐标</span>
              <span className="ml-2 text-forest-800 font-mono text-xs">
                {observer.lat.toFixed(4)}°N, {observer.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>

        {/* 目标信息 */}
        <div className="rounded-xl2 bg-white border border-forest-100 p-4 shadow-soft">
          <div className="text-[11px] text-stone2-400 tracking-wider mb-2">🏔️ 目标山峰 · {peak.name}</div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-stone2-500">海拔</span>
              <span className="ml-2 text-forest-800 font-medium tabular-nums">{peak.elevation} m</span>
            </div>
            <div>
              <span className="text-stone2-500">坐标</span>
              <span className="ml-2 text-forest-800 font-mono text-xs">
                {peak.lat.toFixed(4)}°N, {peak.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>

        {/* 视线分析结果 */}
        <div className={`rounded-xl2 border p-4 shadow-soft ${
          result.visible
            ? 'bg-forest-50 border-forest-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${result.visible ? 'bg-forest-600' : 'bg-red-500'} animate-pulse`} />
            <span className={`text-sm font-medium ${result.visible ? 'text-forest-800' : 'text-red-700'}`}>
              {result.visible ? '🟢 当前视线无遮挡' : '🔴 当前视线被地形遮挡'}
            </span>
          </div>

          {/* 核心数据 */}
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-[10px] text-stone2-400">距离</div>
              <div className="text-forest-800 font-medium tabular-nums">{formatDistanceM(result.distance)}</div>
            </div>
            <div>
              <div className="text-[10px] text-stone2-400">海拔差</div>
              <div className="text-forest-800 font-medium tabular-nums">
                {result.elevationDifference > 0 ? '+' : ''}{result.elevationDifference} m
              </div>
            </div>
            <div>
              <div className="text-[10px] text-stone2-400">方位</div>
              <div className="text-forest-800 font-medium tabular-nums">{Math.round(result.bearing)}°</div>
            </div>
          </div>

          {/* 遮挡信息 */}
          {result.obstruction ? (
            <div className="mt-3 pt-3 border-t border-red-200 text-sm text-red-700 leading-6">
              在距离你约 <span className="font-medium tabular-nums">{formatDistanceM(result.obstruction.distance)}</span> 的位置，
              地形高度（<span className="tabular-nums">{result.obstruction.terrainElevation} m</span>）
              超过了你与{peak.name}之间的视线高度
              （<span className="tabular-nums">{result.obstruction.lineOfSightElevation} m</span>），
              超出 <span className="font-medium tabular-nums">{result.obstruction.exceedAmount} m</span>，
              因此{peak.name}被山体遮挡。
            </div>
          ) : (
            <div className="mt-3 pt-3 border-t border-forest-200 text-sm text-forest-700 leading-6">
              你与{peak.name}之间没有明显地形遮挡，因此从当前位置可以看到{peak.name}。
            </div>
          )}
        </div>

        {/* 剖面图 */}
        <div className="rounded-xl2 bg-white border border-forest-100 p-4 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-medium text-forest-800">地形剖面图</div>
              <div className="text-[11px] text-stone2-400 mt-0.5">横轴：距离 纵轴：海拔</div>
            </div>
            <div className="flex flex-col items-end gap-1 text-[10px]">
              <span className="inline-flex items-center gap-1.5 text-forest-700">
                <i className="w-5 h-0.5 bg-forest-700" style={{ borderTop: '1px dashed #325043' }} /> 视线
              </span>
              <span className="inline-flex items-center gap-1.5 text-sand-600">
                <i className="w-5 h-1 bg-sand-300 rounded-sm" /> 地形
              </span>
              <span className="inline-flex items-center gap-1.5 text-red-500">
                <i className="w-2 h-2 rounded-full bg-red-500" /> 遮挡点
              </span>
            </div>
          </div>
          <ViewshedProfileView
            samples={result.profile}
            obstructionDistance={result.obstruction?.distance ?? null}
          />
        </div>
      </section>

      {/* DEV: 测试场景选择 */}
      {import.meta.env.DEV && (
        <section className="mt-6 rounded-xl2 bg-white border border-sand-300 p-4">
          <div className="text-[10px] text-sand-700 font-medium tracking-wide mb-3">
            🧪 视域分析测试面板（DEV ONLY）
          </div>

          {/* 测试场景 */}
          <div className="mb-4">
            <div className="text-[10px] text-stone2-500 mb-1.5">选择测试场景</div>
            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'auto', label: '自动（默认位置）' },
                { id: 'caseA', label: '案例A：无遮挡' },
                { id: 'caseB', label: '案例B：有遮挡' },
                { id: 'custom', label: '自定义' }
              ] as const).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setTestMode(opt.id)}
                  className={`h-7 px-2.5 rounded text-[10px] border transition ${
                    testMode === opt.id
                      ? 'bg-forest-700 text-white border-forest-700'
                      : 'bg-forest-50 text-forest-700 border-forest-200 hover:bg-forest-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 自定义模式：山脊高度调节 */}
          {testMode === 'custom' && (
            <div className="mb-4">
              <div className="text-[10px] text-stone2-500 mb-1.5">
                模拟山脊高度：<span className="font-mono text-forest-700">{customRidgeHeight} m</span>
                <span className="ml-2 text-stone2-400">（0 = 无遮挡，越高越容易遮挡）</span>
              </div>
              <input
                type="range"
                min={0}
                max={2500}
                step={50}
                value={customRidgeHeight}
                onChange={(e) => setCustomRidgeHeight(Number(e.target.value))}
                className="w-full h-1.5 bg-forest-100 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-stone2-400 mt-0.5">
                <span>0m（平缓）</span>
                <span>1250m</span>
                <span>2500m（高脊）</span>
              </div>

              {/* 位置选择 */}
              <div className="mt-3">
                <div className="text-[10px] text-stone2-500 mb-1.5">选择观察位置</div>
                <div className="flex flex-wrap gap-1.5">
                  {testObserverPositions.map((pos) => (
                    <button
                      key={pos.id}
                      type="button"
                      onClick={() => setSelectedObserverId(pos.id)}
                      className={`h-7 px-2.5 rounded text-[10px] border transition ${
                        selectedObserverId === pos.id
                          ? 'bg-sand-400 text-forest-900 border-sand-500 font-medium'
                          : 'bg-white text-stone2-600 border-forest-100 hover:bg-sand-50'
                      }`}
                    >
                      {pos.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Debug 信息 */}
          <div className="mt-3 pt-3 border-t border-sand-200 font-mono text-[10px] leading-tight text-stone2-500">
            <div>Observer: {observer.lat.toFixed(6)}, {observer.lng.toFixed(6)} | elev={observer.elevation}m</div>
            <div>Target: {target.lat.toFixed(6)}, {target.lng.toFixed(6)} | elev={target.elevation}m</div>
            <div>Distance: {Math.round(result.distance)}m | ElevDiff: {result.elevationDifference}m | Bearing: {Math.round(result.bearing)}°</div>
            <div>Visible: <span className={result.visible ? 'text-forest-600 font-bold' : 'text-red-500 font-bold'}>{String(result.visible).toUpperCase()}</span></div>
            {result.obstruction && (
              <div>Obstruction: dist={Math.round(result.obstruction.distance)}m terrain={result.obstruction.terrainElevation}m los={result.obstruction.lineOfSightElevation}m exceed={result.obstruction.exceedAmount}m</div>
            )}
            <div>Terrain: {provider.source} | samples={result.profile.length}</div>
          </div>

          {/* 批量分析 */}
          {batchResults.length > 0 && (
            <div className="mt-3 pt-3 border-t border-sand-200">
              <div className="text-[10px] text-stone2-500 mb-1">📍 当前位置 → 所有山峰可见性</div>
              <div className="space-y-0.5 font-mono text-[10px]">
                {batchResults.map((r) => (
                  <div key={r.id} className={`flex justify-between ${r.visible ? 'text-forest-700' : 'text-red-400'}`}>
                    <span>{r.name}</span>
                    <span>
                      {r.visible ? '✓ 可见' : '✗ 遮挡'} · {formatDistanceM(r.distance)} · {Math.round(r.bearing)}°
                      {r.obstruction && ` | 遮挡@${Math.round(r.obstruction.distance)}m`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 换位置对比 */}
          <div className="mt-3 pt-3 border-t border-sand-200">
            <div className="text-[10px] text-stone2-500 mb-1.5">💡 换位置会怎样？</div>
            <div className="text-[10px] text-stone2-500 leading-4">
              切换上方的"观察位置"，同一座{peak.name}的可见性会因地形遮挡关系而变化。
              {testMode === 'custom' && ' → 试试把山脊高度调到 0，再调到 2000+，观察遮挡变化。'}
            </div>
          </div>
        </section>
      )}

      {/* 底部导航 */}
      <section className="mt-8 mb-4 flex flex-col sm:flex-row gap-3">
        <Link
          to={`/peak/${peakId}`}
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl2 bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 shadow-soft transition"
        >
          返回 {peak.name} 详情
        </Link>
        <Link
          to="/ar"
          className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl2 border border-forest-200 bg-white text-forest-800 text-sm font-medium hover:bg-forest-50 transition"
        >
          返回 AR 看山
        </Link>
      </section>
    </PageContainer>
  )
}
