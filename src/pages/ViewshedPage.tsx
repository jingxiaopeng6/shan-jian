import { useEffect, useMemo, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Mountain, MapPin, ArrowLeft, Crosshair, BarChart3 } from 'lucide-react'
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

/** DEM 文件 URL（放在 public/ 下，Vite 自动 serve；BASE_URL 适配 GitHub Pages 子路径） */
const DEM_URL = `${import.meta.env.BASE_URL}dem-wugongshan.tif`

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
      const ground = groundElev ?? observer.elevation
      return {
        ...observer,
        elevation: ground + OBSERVER_EYE_HEIGHT
      }
    }
    return {
      ...observer,
      elevation: observer.elevation + OBSERVER_EYE_HEIGHT
    }
  }, [observer, terrainMode, demProvider, demStatus])

  // 执行视线分析
  const result: ViewshedResult = useMemo(() => {
    if (terrainMode === 'dem' && !demProvider.isReady) {
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
          <div className="font-serif text-forest-700 text-xl mb-2">山峰未找到</div>
          <Link to="/" className="text-apple-600 text-sm hover:underline">返回首页</Link>
        </div>
      </PageContainer>
    )
  }

  const isDemReady = terrainMode === 'dem' && demProvider.isReady
  const showResult = terrainMode === 'mock' || isDemReady

  return (
    <div className="min-h-screen bg-cheese text-ink pb-20">
      <PageContainer className="safe-top">
        {/* ===== 标题区 ===== */}
        <section className="mb-6">
          <div className="flex items-center gap-2 text-overline text-apple-600 tracking-[0.2em] font-semibold mb-2">
            <Crosshair size={11} />
            山体可见性分析
          </div>
          <h1 className="font-serif text-forest-700 text-2xl font-bold">
            {result.visible ? '可以看到' : '无法看到'}
            <span className="text-apple-600"> {peak.name}</span>
          </h1>
          <p className="mt-1.5 text-sm text-ink-50">基于真实地形数据 · 分析你与山峰之间是否有遮挡</p>

          {/* 数据来源标识 */}
          <div className="mt-3">
            {isDemReady ? (
              <span className="inline-flex items-center gap-1.5 text-caption text-apple-700 glass-light rounded-full px-2.5 py-1 border border-apple-400/30 shadow-glass">
                <span className="w-1.5 h-1.5 rounded-full bg-apple-500 pulse-dot" />
                基于真实地形分析
              </span>
            ) : terrainMode === 'dem' && demStatus === 'loading' ? (
              <span className="inline-flex items-center gap-1.5 text-caption text-apple-600 glass-light rounded-full px-2.5 py-1 border border-apple-400/30 shadow-glass">
                <span className="w-1.5 h-1.5 rounded-full bg-apple-500 animate-pulse" />
                地形加载中…
              </span>
            ) : terrainMode === 'dem' && demStatus === 'error' ? (
              <span className="inline-flex items-center gap-1.5 text-caption text-amber-400 glass-light rounded-full px-2.5 py-1 border border-amber-400/30 shadow-glass">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                地形加载失败：{demError}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-caption text-rock-400 glass-light rounded-full px-2.5 py-1 border border-rock-200/40 shadow-glass">
                <span className="w-1.5 h-1.5 rounded-full bg-rock-400" />
                演示模式（模拟地形）
              </span>
            )}
          </div>
        </section>

        {/* ===== 正式可视化区域 ===== */}
        {showResult && (
          <section className="space-y-4">
            {/* 观察点 + 目标山峰 双栏 */}
            <div className="grid grid-cols-2 gap-3">
              {/* 观察点 */}
              <div className="glass-light rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-1.5 text-overline text-apple-600 tracking-wider mb-2 font-semibold">
                  <MapPin size={11} />
                  观察点
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-rock-400">地面海拔</span>
                    <span className="text-ink font-medium tabular-nums">
                      {(effectiveObserver.elevation - OBSERVER_EYE_HEIGHT).toFixed(1)} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rock-400">人眼高度</span>
                    <span className="text-ink-50 tabular-nums">+ {OBSERVER_EYE_HEIGHT} m</span>
                  </div>
                  <div className="pt-1.5 border-t border-apple-400/15">
                    <div className="text-overline text-rock-400 font-mono">
                      {effectiveObserver.lat.toFixed(4)}°N
                    </div>
                    <div className="text-overline text-rock-400 font-mono">
                      {effectiveObserver.lng.toFixed(4)}°E
                    </div>
                  </div>
                </div>
              </div>

              {/* 目标山峰 */}
              <div className="glass-light rounded-2xl p-4 shadow-card">
                <div className="flex items-center gap-1.5 text-overline text-apple-600 tracking-wider mb-2 font-semibold">
                  <Mountain size={11} />
                  目标山峰
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <span className="text-rock-400">名称</span>
                    <span className="text-ink font-medium">{peak.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-rock-400">海拔</span>
                    <span className="text-apple-600 font-medium tabular-nums">{peak.elevation} m</span>
                  </div>
                  <div className="pt-1.5 border-t border-apple-400/15">
                    <div className="text-overline text-rock-400 font-mono">
                      {peak.lat.toFixed(4)}°N
                    </div>
                    <div className="text-overline text-rock-400 font-mono">
                      {peak.lng.toFixed(4)}°E
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 视线分析结果 */}
            <div className={`glass-light rounded-2xl p-4 shadow-card ${
              result.visible ? 'border-apple-400/40' : 'border-amber-400/40'
            }`}>
              <div className="flex items-center gap-2 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${result.visible ? 'bg-apple-500' : 'bg-amber-400'} pulse-dot`} />
                <span className={`text-sm font-semibold ${result.visible ? 'text-apple-700' : 'text-amber-400'}`}>
                  {result.visible ? '当前视线无遮挡' : '当前视线被地形遮挡'}
                </span>
              </div>

              {/* 核心数据 */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-overline text-rock-400 tracking-wider mb-1 font-semibold">视线距离</div>
                  <div className="text-ink font-medium tabular-nums text-base">{formatDistanceM(result.distance)}</div>
                </div>
                <div>
                  <div className="text-overline text-rock-400 tracking-wider mb-1 font-semibold">相对高度</div>
                  <div className={`font-medium tabular-nums text-base ${result.elevationDifference > 0 ? 'text-apple-600' : 'text-amber-400'}`}>
                    {result.elevationDifference > 0 ? '+' : ''}{result.elevationDifference.toFixed(1)} m
                  </div>
                </div>
                <div>
                  <div className="text-overline text-rock-400 tracking-wider mb-1 font-semibold">方位角</div>
                  <div className="text-ink font-medium tabular-nums text-base">{Math.round(result.bearing)}°</div>
                </div>
              </div>

              {/* 遮挡信息 */}
              {result.obstruction ? (
                <div className="mt-4 pt-4 border-t border-amber-400/20 text-sm text-amber-400 leading-relaxed">
                  在距离你约 <span className="font-medium tabular-nums text-amber-400">{formatDistanceM(result.obstruction.distance)}</span> 处，
                  地形高度（<span className="tabular-nums">{result.obstruction.terrainElevation} m</span>）
                  超过了视线高度
                  （<span className="tabular-nums">{result.obstruction.lineOfSightElevation} m</span>），
                  超出 <span className="font-medium tabular-nums">{result.obstruction.exceedAmount} m</span>，
                  因此{peak.name}被山体遮挡。
                </div>
              ) : (
                <div className="mt-4 pt-4 border-t border-apple-400/20 text-sm text-apple-700 leading-relaxed">
                  你与{peak.name}之间没有明显地形遮挡，因此从当前位置可以看到{peak.name}。
                </div>
              )}
            </div>

            {/* 地形剖面图 */}
            <div className="glass-light rounded-2xl p-4 shadow-card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-forest-600">
                    <BarChart3 size={13} className="text-apple-500" />
                    视线方向地形剖面
                  </div>
                  <div className="text-overline text-rock-400 mt-0.5">
                    横轴：距离 (m) · 纵轴：海拔 (m){isDemReady ? ' · 真实地形采样' : ''}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 text-overline">
                  <span className="inline-flex items-center gap-1.5 text-apple-600">
                    <span className="w-5 h-0.5" style={{ borderTop: '1px dashed #8DB838' }} /> 观察点视线
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-apple-700">
                    <span className="w-5 h-1 bg-apple-300 rounded-sm" /> 真实地形
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-amber-400">
                    <span className="w-2 h-2 rounded-full bg-amber-400" /> 遮挡点
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
          <section className="mt-6 glass-light rounded-2xl p-4 shadow-card border border-apple-400/20">
            <div className="text-overline text-apple-600 font-semibold tracking-wider mb-3">
              视域分析测试面板（DEV ONLY）
            </div>

            {/* 地形模式切换 */}
            <div className="mb-4">
              <div className="text-overline text-rock-400 mb-1.5">地形数据来源</div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setTerrainMode('dem')}
                  className={`h-8 px-3 rounded text-overline border transition ${
                    terrainMode === 'dem'
                      ? 'bg-apple-400 text-cheese-50 border-apple-400 font-medium'
                      : 'bg-cheese-50 text-apple-600 border-apple-400/30 hover:bg-apple-50'
                  }`}
                >
                  真实 DEM
                </button>
                <button
                  type="button"
                  onClick={() => setTerrainMode('mock')}
                  className={`h-8 px-3 rounded text-overline border transition ${
                    terrainMode === 'mock'
                      ? 'bg-apple-400 text-cheese-50 border-apple-400 font-medium'
                      : 'bg-cheese-50 text-apple-600 border-apple-400/30 hover:bg-apple-50'
                  }`}
                >
                  模拟地形
                </button>
              </div>
            </div>

            {/* DEM Debug Panel — 单点高程查询 */}
            {terrainMode === 'dem' && (
              <div className="mb-4 pt-3 border-t border-apple-400/15">
                <div className="text-overline text-rock-400 mb-1.5">DEM 单点高程查询</div>
                {demProvider.latLngBBox && (
                  <div className="text-overline text-rock-400 font-mono mb-2">
                    DEM 范围: 纬度 {demProvider.latLngBBox[0].toFixed(4)}~{demProvider.latLngBBox[2].toFixed(4)}, 经度 {demProvider.latLngBBox[1].toFixed(4)}~{demProvider.latLngBBox[3].toFixed(4)}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.000001"
                    value={debugLat}
                    onChange={(e) => setDebugLat(e.target.value)}
                    className="w-24 h-8 px-2 text-overline border border-apple-400/30 rounded bg-cheese-50 font-mono text-ink focus:outline-none focus:border-apple-400"
                    placeholder="Lat"
                  />
                  <input
                    type="number"
                    step="0.000001"
                    value={debugLng}
                    onChange={(e) => setDebugLng(e.target.value)}
                    className="w-24 h-8 px-2 text-overline border border-apple-400/30 rounded bg-cheese-50 font-mono text-ink focus:outline-none focus:border-apple-400"
                    placeholder="Lng"
                  />
                  <button
                    type="button"
                    onClick={queryDebugElevation}
                    disabled={!demProvider.isReady}
                    className="h-8 px-3 rounded text-overline bg-apple-100 text-apple-700 hover:bg-apple-200 disabled:opacity-40 font-medium border border-apple-400/30"
                  >
                    查询
                  </button>
                </div>
                {debugResult != null && (
                  <div className="mt-1 text-overline text-apple-700 font-mono">
                    DEM Elevation: <span className="font-bold">{debugResult} m</span>
                  </div>
                )}
                {debugResult === null && terrainMode === 'dem' && demProvider.isReady && (
                  <div className="mt-1 text-overline text-amber-400">
                    坐标超出 DEM 范围
                  </div>
                )}
              </div>
            )}

            {/* Mock 模式的场景选择 */}
            {terrainMode === 'mock' && (
              <>
                <div className="mb-4">
                  <div className="text-overline text-rock-400 mb-1.5">选择测试场景</div>
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
                        className={`h-8 px-3 rounded text-overline border transition ${
                          testMode === opt.id
                            ? 'bg-apple-400 text-cheese-50 border-apple-400 font-medium'
                            : 'bg-cheese-50 text-apple-600 border-apple-400/30 hover:bg-apple-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {testMode === 'custom' && (
                  <div className="mb-4">
                    <div className="text-overline text-rock-400 mb-1.5">
                      模拟山脊高度：<span className="font-mono text-apple-600 font-bold">{customRidgeHeight} m</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={2500}
                      step={50}
                      value={customRidgeHeight}
                      onChange={(e) => setCustomRidgeHeight(Number(e.target.value))}
                      className="w-full h-1.5 bg-apple-100 rounded-lg appearance-none cursor-pointer accent-apple-500"
                    />
                    <div className="mt-3">
                      <div className="text-overline text-rock-400 mb-1.5">选择观察位置</div>
                      <div className="flex flex-wrap gap-1.5">
                        {testObserverPositions.map((pos) => (
                          <button
                            key={pos.id}
                            type="button"
                            onClick={() => setSelectedObserverId(pos.id)}
                            className={`h-8 px-3 rounded text-overline border transition ${
                              selectedObserverId === pos.id
                                ? 'bg-apple-400 text-cheese-50 border-apple-400 font-medium'
                                : 'bg-cheese-50 text-apple-600 border-apple-400/30 hover:bg-apple-50'
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
            <div className="mt-3 pt-3 border-t border-apple-400/15 font-mono text-overline leading-tight text-rock-400">
              <div>Observer: {effectiveObserver.lat.toFixed(6)}, {effectiveObserver.lng.toFixed(6)} | elev={(effectiveObserver.elevation - OBSERVER_EYE_HEIGHT).toFixed(1)}m + eye {OBSERVER_EYE_HEIGHT}m = {effectiveObserver.elevation.toFixed(1)}m</div>
              <div>Target: {target.lat.toFixed(6)}, {target.lng.toFixed(6)} | elev={target.elevation}m</div>
              <div>Distance: {Math.round(result.distance)}m | ElevDiff: {result.elevationDifference.toFixed(1)}m | Bearing: {Math.round(result.bearing)}°</div>
              <div>Visible: <span className={result.visible ? 'text-apple-700 font-bold' : 'text-amber-400 font-bold'}>{String(result.visible).toUpperCase()}</span></div>
              {result.obstruction && (
                <div>Obstruction: dist={Math.round(result.obstruction.distance)}m terrain={result.obstruction.terrainElevation}m los={result.obstruction.lineOfSightElevation}m exceed={result.obstruction.exceedAmount}m</div>
              )}
              <div>Terrain: {provider.source} | samples={result.profile.length} {isDemReady ? `| DEM ${demProvider.meta?.width}×${demProvider.meta?.height}` : ''}</div>
            </div>
          </section>
        )}

        {/* 底部导航 */}
        <section className="mt-8 mb-8 flex flex-col sm:flex-row gap-3">
          <Link
            to={`/peak/${peakId}`}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 transition active:scale-95 shadow-apple"
          >
            <ArrowLeft size={15} />
            返回 {peak.name} 详情
          </Link>
          <Link
            to="/ar"
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-cheese-50 text-apple-600 border border-apple-400/40 text-sm font-medium hover:bg-apple-50 transition active:scale-95"
          >
            返回 AR 看山
          </Link>
        </section>
      </PageContainer>
    </div>
  )
}
