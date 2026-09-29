import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import ViewshedProfileView from '../components/ViewshedProfileView'
import { analyzeLineOfSight, formatDistanceM, type ViewshedResult } from '../gis/viewshedService'
import { createRidge, type TerrainModifier, type TerrainProvider } from '../gis/TerrainProvider'
import { DEMTerrainProvider } from '../gis/DEMTerrainProvider'
import { getPeakById, defaultUserPosition } from '../data/mock'
import { testObserverPositions, createTerrainProvider } from '../data/mockTerrain'
import type { GeoPoint } from '../gis/TerrainProvider'

/** 观察者人眼高度（米） */
const OBSERVER_EYE_HEIGHT = 1.6

/** DEM 文件 URL（放在 public/ 下，Vite 自动 serve） */
const DEM_URL = '/dem-wugongshan.tif'

export default function ViewshedPage() {
  const [searchParams] = useSearchParams()
  const peakId = searchParams.get('peakId') || 'jinding'
  const peak = getPeakById(peakId)

  // 地形模式：mock / dem（默认 mock，用户可手动切换到真实 DEM）
  const [terrainMode, setTerrainMode] = useState<'dem' | 'mock'>('mock')

  // DEM Provider 状态
  const demProvider = useMemo(() => new DEMTerrainProvider(DEM_URL), [])
  const [demStatus, setDemStatus] = useState(demProvider.status)
  const [demError, setDemError] = useState<string | null>(null)

  // 开发模式：选择测试场景（mock 模式用）
  const [testMode, setTestMode] = useState<'auto' | 'caseA' | 'caseB' | 'custom'>('auto')
  const [customRidgeHeight, setCustomRidgeHeight] = useState(2100)
  const [selectedObserverId, setSelectedObserverId] = useState(testObserverPositions[0].id)

  // DEM Debug Panel 状态
  const [debugLat, setDebugLat] = useState('27.4789')
  const [debugLng, setDebugLng] = useState('114.1728')
  const [debugResult, setDebugResult] = useState<number | null>(null)

  // 异步加载 DEM
  useEffect(() => {
    if (terrainMode !== 'dem') return
    if (demProvider.status !== 'idle') return
    setDemStatus('loading')
    demProvider.load().then(() => {
      setDemStatus(demProvider.status)
      setDemError(demProvider.error)
    })
  }, [terrainMode, demProvider])

  // 确定观察者位置
  const observer: GeoPoint & { id?: string; name?: string } = useMemo(() => {
    if (testMode === 'custom') {
      const pos = testObserverPositions.find((p) => p.id === selectedObserverId)
      return pos || { ...defaultUserPosition, lat: 27.475, lng: 114.17, elevation: 1850 }
    }
    // auto / caseA / caseB 模式
    return { ...defaultUserPosition, lat: 27.475, lng: 114.17, elevation: 1850 }
  }, [testMode, selectedObserverId])

  // 确定目标山峰
  const target: GeoPoint & { id: string; name: string } = useMemo(() => {
    if (!peak) return { id: 'jinding', name: '金顶', lat: 27.4789, lng: 114.1728, elevation: 1918 }
    return { id: peak.id, name: peak.name, lat: peak.lat, lng: peak.lng, elevation: peak.elevation }
  }, [peak])

  // 构建 TerrainProvider（根据地形模式）
  const provider: TerrainProvider = useMemo(() => {
    if (terrainMode === 'dem' && demProvider.isReady) {
      return demProvider
    }
    // Mock 模式
    if (testMode === 'caseB') return createTerrainProvider([
      createRidge(1500, 2500, 2100, '遮挡山脊')
    ])
    if (testMode === 'custom') {
      const mods: TerrainModifier[] = customRidgeHeight > 0
        ? [createRidge(1000, 2500, customRidgeHeight, '自定义山脊')]
        : []
      return createTerrainProvider(mods)
    }
    return createTerrainProvider([])
  }, [terrainMode, demProvider, demStatus, testMode, customRidgeHeight])

  // 当使用 DEM 模式时，从 DEM 获取观察者真实地面高程
  const effectiveObserver: GeoPoint = useMemo(() => {
    if (terrainMode === 'dem' && demProvider.isReady) {
      const groundElev = demProvider.getElevation(observer.lat, observer.lng)
      // 如果 DEM 有数据，用 DEM 高程 + 人眼高度
      const ground = groundElev ?? observer.elevation
      return {
        ...observer,
        elevation: ground + OBSERVER_EYE_HEIGHT
      }
    }
    // Mock 模式：加人眼高度
    return {
      ...observer,
      elevation: observer.elevation + OBSERVER_EYE_HEIGHT
    }
  }, [observer, terrainMode, demProvider, demStatus])

  // 执行视线分析
  const result: ViewshedResult = useMemo(() => {
    if (terrainMode === 'dem' && !demProvider.isReady) {
      // DEM 还没加载好，返回空结果
      return {
        visible: false,
        distance: 0,
        elevationDifference: 0,
        bearing: 0,
        obstruction: null,
        profile: []
      }
    }
    return analyzeLineOfSight(effectiveObserver, target, provider, terrainMode === 'dem' ? 200 : 60)
  }, [effectiveObserver, target, provider, terrainMode, demProvider, demStatus])

  // 查询 DEM 单点高程
  const queryDebugElevation = () => {
    const lat = parseFloat(debugLat)
    const lng = parseFloat(debugLng)
    if (isNaN(lat) || isNaN(lng)) return
    const elev = demProvider.getElevation(lat, lng)
    setDebugResult(elev)
  }

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

  const isDemReady = terrainMode === 'dem' && demProvider.isReady
  const showResult = terrainMode === 'mock' || isDemReady

  return (
    <PageContainer>
      {/* 标题 */}
      <section className="mb-6">
        <div className="text-xs text-forest-600 font-medium tracking-wide mb-1">GIS 视域分析</div>
        <h1 className="font-serif text-forest-900 text-2xl font-semibold">
          {result.visible ? '可以看到' : '无法看到'}
          <span className="text-sand-600"> {peak.name}</span>
        </h1>
        <p className="mt-1 text-xs text-stone2-500">基于 DEM 地形进行视线分析 · LOS (Line of Sight) 算法</p>
        {/* 数据来源标识 */}
        <div className="mt-2">
          {isDemReady ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-forest-700 bg-forest-50 border border-forest-200 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
              ✓ 基于真实 DEM 分析
            </span>
          ) : terrainMode === 'dem' && demStatus === 'loading' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-sand-600 bg-sand-50 border border-sand-300 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sand-400 animate-pulse" />
              DEM 加载中…
            </span>
          ) : terrainMode === 'dem' && demStatus === 'error' ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-red-600 bg-red-50 border border-red-200 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              DEM 加载失败：{demError}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-sand-600 bg-sand-50 border border-sand-300 rounded-full px-2.5 py-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sand-400" />
              演示模式（模拟地形）
            </span>
          )}
        </div>
      </section>

      {/* 正式可视化区域 */}
      {showResult && (
        <section className="space-y-4">
          {/* 观察者信息 */}
          <div className="rounded-xl2 bg-white border border-forest-100 p-4 shadow-soft">
            <div className="text-[11px] text-stone2-400 tracking-wider mb-2">📍 观察点 · 当前位置</div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-stone2-500">地面海拔</span>
                <span className="ml-2 text-forest-800 font-medium tabular-nums">
                  {(effectiveObserver.elevation - OBSERVER_EYE_HEIGHT).toFixed(1)} m
                  <span className="text-[10px] text-stone2-400 ml-1">+ {OBSERVER_EYE_HEIGHT}m 人眼</span>
                </span>
              </div>
              <div>
                <span className="text-stone2-500">坐标 (WGS84)</span>
                <span className="ml-2 text-forest-800 font-mono text-xs">
                  {effectiveObserver.lat.toFixed(4)}°N, {effectiveObserver.lng.toFixed(4)}°E
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
                <span className="text-stone2-500">坐标 (WGS84)</span>
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
                  {result.elevationDifference > 0 ? '+' : ''}{result.elevationDifference.toFixed(1)} m
                </div>
              </div>
              <div>
                <div className="text-[10px] text-stone2-400">方位角</div>
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
                <div className="text-sm font-medium text-forest-800">视线方向地形剖面</div>
                <div className="text-[11px] text-stone2-400 mt-0.5">
                  横轴：距离 (m) · 纵轴：海拔 (m){isDemReady ? ' · 真实 DEM 采样' : ''}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 text-[10px]">
                <span className="inline-flex items-center gap-1.5 text-forest-700">
                  <i className="w-5 h-0.5 bg-forest-700" style={{ borderTop: '1px dashed #325043' }} /> 观察点视线
                </span>
                <span className="inline-flex items-center gap-1.5 text-sand-600">
                  <i className="w-5 h-1 bg-sand-300 rounded-sm" /> DEM 地形
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
      )}

      {/* DEV: 测试面板 */}
      {import.meta.env.DEV && (
        <section className="mt-6 rounded-xl2 bg-white border border-sand-300 p-4">
          <div className="text-[10px] text-sand-700 font-medium tracking-wide mb-3">
            🧪 视域分析测试面板（DEV ONLY）
          </div>

          {/* 地形模式切换 */}
          <div className="mb-4">
            <div className="text-[10px] text-stone2-500 mb-1.5">地形数据来源</div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTerrainMode('dem')}
                className={`h-7 px-2.5 rounded text-[10px] border transition ${
                  terrainMode === 'dem'
                    ? 'bg-forest-700 text-white border-forest-700'
                    : 'bg-forest-50 text-forest-700 border-forest-200 hover:bg-forest-100'
                }`}
              >
                真实 DEM
              </button>
              <button
                type="button"
                onClick={() => setTerrainMode('mock')}
                className={`h-7 px-2.5 rounded text-[10px] border transition ${
                  terrainMode === 'mock'
                    ? 'bg-sand-400 text-forest-900 border-sand-500 font-medium'
                    : 'bg-white text-stone2-600 border-forest-100 hover:bg-sand-50'
                }`}
              >
                模拟地形
              </button>
            </div>
          </div>

          {/* DEM Debug Panel — 单点高程查询 */}
          {terrainMode === 'dem' && (
            <div className="mb-4 pt-3 border-t border-sand-200">
              <div className="text-[10px] text-stone2-500 mb-1.5">DEM 单点高程查询</div>
              {/* DEM 覆盖范围 */}
              {demProvider.latLngBBox && (
                <div className="text-[10px] text-stone2-400 font-mono mb-2">
                  DEM 范围: 纬度 {demProvider.latLngBBox[0].toFixed(4)}~{demProvider.latLngBBox[2].toFixed(4)}, 经度 {demProvider.latLngBBox[1].toFixed(4)}~{demProvider.latLngBBox[3].toFixed(4)}
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  step="0.000001"
                  value={debugLat}
                  onChange={(e) => setDebugLat(e.target.value)}
                  className="w-24 h-7 px-1.5 text-[10px] border border-forest-200 rounded bg-white font-mono text-forest-800"
                  placeholder="Lat"
                />
                <input
                  type="number"
                  step="0.000001"
                  value={debugLng}
                  onChange={(e) => setDebugLng(e.target.value)}
                  className="w-24 h-7 px-1.5 text-[10px] border border-forest-200 rounded bg-white font-mono text-forest-800"
                  placeholder="Lng"
                />
                <button
                  type="button"
                  onClick={queryDebugElevation}
                  disabled={!demProvider.isReady}
                  className="h-7 px-2 rounded text-[10px] bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-40"
                >
                  查询 DEM 高程
                </button>
              </div>
              {debugResult != null && (
                <div className="mt-1 text-[10px] text-forest-700 font-mono">
                  DEM Elevation: <span className="font-bold">{debugResult} m</span>
                </div>
              )}
              {debugResult === null && terrainMode === 'dem' && demProvider.isReady && (
                <div className="mt-1 text-[10px] text-red-400">
                  坐标超出 DEM 范围
                </div>
              )}
            </div>
          )}

          {/* Mock 模式的场景选择 */}
          {terrainMode === 'mock' && (
            <>
              <div className="mb-4">
                <div className="text-[10px] text-stone2-500 mb-1.5">选择测试场景</div>
                <div className="flex flex-wrap gap-1.5">
                  {([
                    { id: 'auto', label: '自动（无遮挡）' },
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

              {testMode === 'custom' && (
                <div className="mb-4">
                  <div className="text-[10px] text-stone2-500 mb-1.5">
                    模拟山脊高度：<span className="font-mono text-forest-700">{customRidgeHeight} m</span>
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
            </>
          )}

          {/* Debug 信息 */}
          <div className="mt-3 pt-3 border-t border-sand-200 font-mono text-[10px] leading-tight text-stone2-500">
            <div>Observer: {effectiveObserver.lat.toFixed(6)}, {effectiveObserver.lng.toFixed(6)} | elev={(effectiveObserver.elevation - OBSERVER_EYE_HEIGHT).toFixed(1)}m + eye {OBSERVER_EYE_HEIGHT}m = {effectiveObserver.elevation.toFixed(1)}m</div>
            <div>Target: {target.lat.toFixed(6)}, {target.lng.toFixed(6)} | elev={target.elevation}m</div>
            <div>Distance: {Math.round(result.distance)}m | ElevDiff: {result.elevationDifference.toFixed(1)}m | Bearing: {Math.round(result.bearing)}°</div>
            <div>Visible: <span className={result.visible ? 'text-forest-600 font-bold' : 'text-red-500 font-bold'}>{String(result.visible).toUpperCase()}</span></div>
            {result.obstruction && (
              <div>Obstruction: dist={Math.round(result.obstruction.distance)}m terrain={result.obstruction.terrainElevation}m los={result.obstruction.lineOfSightElevation}m exceed={result.obstruction.exceedAmount}m</div>
            )}
            <div>Terrain: {provider.source} | samples={result.profile.length} {isDemReady ? `| DEM ${demProvider.meta?.width}×${demProvider.meta?.height}` : ''}</div>
          </div>

          {/* 换位置对比 */}
          {terrainMode === 'dem' && (
            <div className="mt-3 pt-3 border-t border-sand-200">
              <div className="text-[10px] text-stone2-500 mb-1.5">💡 换位置会怎样？</div>
              <div className="text-[10px] text-stone2-500 leading-4">
                同一座{peak.name}，从不同位置观察，可见性会因真实地形遮挡关系而变化。
                切换观察位置，距离/方位/遮挡都会基于真实 DEM 重新计算。
              </div>
            </div>
          )}
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
