import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Crosshair, MapPin, Compass, X, ChevronRight, Camera, Eye, Navigation } from 'lucide-react'
import { defaultUserPosition, getPeakById, getVisiblePeaks } from '../data/mock'
import ArPeakBadge, { type HeadingKey } from '../components/ArPeakBadge'
import CameraView from '../components/CameraView'
import SpatialTestPanel from '../components/SpatialTestPanel'
import { useCamera } from '../hooks/useCamera'
import { useLocationProvider } from '../hooks/useLocationProvider'
import { useOrientationProvider } from '../hooks/useOrientationProvider'
import { useArPeakOverlay } from '../hooks/useArPeakOverlay'
import { useIsMobile } from '../hooks/useIsMobile'
import type { Peak } from '../types'
import { analyzeLineOfSight, formatDistanceM, type ViewshedResult } from '../gis/viewshedService'
import { DEMTerrainProvider } from '../gis/DEMTerrainProvider'
import type { GeoPoint, TerrainProvider } from '../gis/TerrainProvider'
import { createTerrainProvider } from '../data/mockTerrain'

type ArMode = 'simulated' | 'camera'

/** 观察者人眼高度 */
const OBSERVER_EYE_HEIGHT = 1.6

export default function ArPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const highlightPeakId = searchParams.get('peakId')
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<ArMode>('simulated')
  const [heading, setHeading] = useState<HeadingKey>('E')
  const [selectedPeakId, setSelectedPeakId] = useState<string | null>(highlightPeakId)
  const [viewshedResult, setViewshedResult] = useState<ViewshedResult | null>(null)
  const [viewshedLoading, setViewshedLoading] = useState(false)
  const [showArHint, setShowArHint] = useState(false)
  const demProviderRef = useRef<DEMTerrainProvider | null>(null)

  const headingDegMap: Record<HeadingKey, number> = {
    N: 0, E: 90, S: 180, W: 270, SW: 225
  }
  const currentHeading = headingDegMap[heading]

  const visible = useMemo(
    () => getVisiblePeaks(defaultUserPosition, currentHeading).filter((v) => v.visible),
    [currentHeading]
  )

  // Stage 2: 摄像头
  const camera = useCamera()

  // Stage 4 空间数据 Provider（支持 Real ↔ Mock 切换）
  const location = useLocationProvider()
  const orientation = useOrientationProvider()

  // 当前使用的山峰数据源（测试面板可切换：'real' | Peak[]）
  const [overlayPeaks, setOverlayPeaks] = useState<Peak[] | 'real'>('real')

  // Stage 4 AR 山峰定位：使用 Provider 统一输出
  const overlay = useArPeakOverlay({
    userLatLng: location.latLng,
    heading: orientation.heading,
    peaks: overlayPeaks === 'real' ? undefined : overlayPeaks
  })
  const hasRealAR = location.latLng != null && orientation.heading != null && overlay.items.length > 0

  // 内联视域分析：点击「为什么能看到？」时调用
  const handleViewshed = (peakId: string) => {
    const peak = getPeakById(peakId)
    if (!peak) return
    setViewshedLoading(true)
    setViewshedResult(null)

    // 获取观察者位置（真实 GPS 或默认位置）
    const obsLat = location.latLng?.lat ?? defaultUserPosition.lat
    const obsLng = location.latLng?.lng ?? defaultUserPosition.lng

    // 延迟执行以显示 loading 状态
    setTimeout(async () => {
      try {
        // 尝试用 DEM Provider
        if (!demProviderRef.current) {
          demProviderRef.current = new DEMTerrainProvider('/dem-wugongshan.tif')
        }
        const dem = demProviderRef.current
        if (!dem.isReady) await dem.load()

        const groundElev = dem.getElevation(obsLat, obsLng) ?? defaultUserPosition.elevation
        const observer: GeoPoint = {
          lat: obsLat,
          lng: obsLng,
          elevation: groundElev + OBSERVER_EYE_HEIGHT
        }
        const target: GeoPoint = {
          lat: peak.lat,
          lng: peak.lng,
          elevation: peak.elevation
        }
        const provider: TerrainProvider = dem.isReady ? dem : createTerrainProvider([])
        const result = analyzeLineOfSight(observer, target, provider, dem.isReady ? 200 : 60)
        setViewshedResult(result)
      } catch {
        // DEM 失败时回退到 mock
        const observer: GeoPoint = {
          lat: obsLat,
          lng: obsLng,
          elevation: defaultUserPosition.elevation + OBSERVER_EYE_HEIGHT
        }
        const target: GeoPoint = { lat: peak.lat, lng: peak.lng, elevation: peak.elevation }
        const result = analyzeLineOfSight(observer, target, createTerrainProvider([]), 60)
        setViewshedResult(result)
      }
      setViewshedLoading(false)
    }, 50)
  }

  // 离开页面时清理所有资源
  useEffect(() => {
    return () => {
      camera.stop()
      location.stop()
      orientation.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEnterCamera = async () => {
    setMode('camera')
    await camera.start()
    // 首次进入摄像头模式时显示提示（约 1.5 秒自动消失）
    setShowArHint(true)
    setTimeout(() => setShowArHint(false), 1500)
  }

  const handleExitCamera = () => {
    camera.stop()
    setMode('simulated')
  }

  return (
    <div className="relative min-h-screen bg-ink">
      {/* ======== 摄像头模式：全屏沉浸式 ======== */}
      {mode === 'camera' && (
        <div className="fixed inset-0 z-40 bg-black">
          <CameraView
            videoRef={camera.videoRef}
            status={camera.status}
            error={camera.error}
            onStart={camera.start}
            onStop={handleExitCamera}
          />

          {/* AR Overlay 层：摄像头画面上叠加山峰 + 状态 */}
          {camera.status === 'streaming' && (
            <>
              {/* AR 首次使用 onboarding —— 极简、1.5 秒自动消失 */}
              {showArHint && (
                <div className="pointer-events-none absolute inset-0 z-[35] flex items-center justify-center px-6">
                  <div className="text-center glass-panel rounded-3xl px-8 py-6 animate-fade-out">
                    <Crosshair className="mx-auto mb-3 text-gold" size={32} strokeWidth={1.5} />
                    <p className="text-mist text-sm font-medium tracking-wide">寻找山峰</p>
                    <p className="text-mist/60 text-[11px] mt-1.5">转动手机，让山峰进入视野</p>
                  </div>
                </div>
              )}

              {/* 顶部状态栏 —— 极简玻璃 chip */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 px-4 pt-safe pb-3 flex items-start justify-between gap-3 bg-gradient-to-b from-black/50 to-transparent">
                {/* 左侧：GPS + Compass 状态 */}
                <div className="pointer-events-auto flex flex-col gap-1.5">
                  <GeoStatusChip location={location} />
                  <CompassStatusChip orientation={orientation} />
                </div>
                {/* 右侧：方位刻度 */}
                <div className="pointer-events-none flex items-center gap-2 text-mist/80 text-[11px] tracking-[0.2em] pt-1 font-mono">
                  <Navigation size={10} className="text-gold/70" />
                  <span>{az(currentHeading)}</span>
                </div>
              </div>

              {/* 十字准星 —— 极简 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/40" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/40" />
                  <div className="absolute inset-3 rounded-full border border-white/30" />
                  <div className="absolute inset-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/80" />
                </div>
              </div>

              {/* 山峰 Badge —— Stage 4 有真实数据时走 overlay，否则 fallback 到 Stage 2 mock */}
              <div className="pointer-events-none absolute inset-0">
                {hasRealAR
                  ? overlay.items.map((item) => (
                      <div key={item.peak.id} className="pointer-events-auto">
                        <ArPeakBadge
                          peak={item.peak}
                          overlay={item}
                          highlight={selectedPeakId === item.peak.id || highlightPeakId === item.peak.id}
                          onClick={() => { setSelectedPeakId(item.peak.id); setViewshedResult(null) }}
                        />
                      </div>
                    ))
                  : visible.map((v) => {
                      const peak = getPeakById(v.peakId)
                      if (!peak) return null
                      let offset = v.azimuthDeg - currentHeading
                      while (offset > 180) offset -= 360
                      while (offset < -180) offset += 360
                      const clamped = Math.max(-60, Math.min(60, offset))
                      const leftPct = 8 + ((clamped + 60) / 120) * 84
                      const verticalPct = 25 + ((v.distanceKm) / 8) * 40
                      return (
                        <div key={v.peakId} className="pointer-events-auto">
                          <ArPeakBadge
                            peak={peak}
                            visiblePeak={v}
                            highlight={selectedPeakId === v.peakId || highlightPeakId === v.peakId}
                            style={{ left: `${leftPct}%`, top: `${verticalPct}%` }}
                            onClick={() => { setSelectedPeakId(v.peakId); setViewshedResult(null) }}
                          />
                        </div>
                      )
                    })}
              </div>

              {/* AR 山峰信息卡（点击 badge 后弹出）—— 半透明玻璃信息卡 */}
              {selectedPeakId && (hasRealAR || visible.some(v => v.peakId === selectedPeakId)) && (() => {
                const peak = getPeakById(selectedPeakId)
                if (!peak) return null
                const overlayItem = overlay.items.find(i => i.peak.id === selectedPeakId)
                const visiblePeak = visible.find(v => v.peakId === selectedPeakId)
                const distKm = overlayItem ? overlayItem.distanceKm : visiblePeak?.distanceKm ?? 0
                const bearingDeg = overlayItem ? overlayItem.bearingDeg : visiblePeak?.azimuthDeg ?? 0
                return (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-30 w-[90%] max-w-sm pointer-events-auto animate-enter-fade">
                    <div className="glass-panel rounded-2xl p-4 shadow-2xl">
                      {/* 顶部：关闭 + 山峰名 */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-mist text-lg font-semibold">{peak.name}</h3>
                          <p className="mt-0.5 text-gold text-xs font-medium tabular-nums">{peak.elevation} m</p>
                        </div>
                        <button
                          onClick={() => { setSelectedPeakId(null); setViewshedResult(null) }}
                          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-mist/60 hover:text-mist transition"
                          aria-label="关闭"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      {/* 距离 + 方位 */}
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-mist/70">
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <MapPin size={11} className="text-moss" />
                          距离 {distKm.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <Compass size={11} className="text-moss" />
                          {azimuthCompassShort(bearingDeg)} {Math.round(bearingDeg)}°
                        </span>
                      </div>

                      {/* 视域分析结果（如果有） */}
                      {viewshedResult && (
                        <div className={`mt-3 pt-3 border-t border-white/10 text-xs ${viewshedResult.visible ? 'text-moss' : 'text-red-400'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${viewshedResult.visible ? 'bg-moss' : 'bg-red-500'} pulse-dot`} />
                            {viewshedResult.visible ? '可见 · 无地形遮挡' : '不可见 · 被地形遮挡'}
                          </div>
                          <div className="mt-1 text-[10px] text-mist/50 tabular-nums">
                            距离 {formatDistanceM(viewshedResult.distance)} · 海拔差 {viewshedResult.elevationDifference > 0 ? '+' : ''}{viewshedResult.elevationDifference.toFixed(1)} m
                          </div>
                          {viewshedResult.obstruction && (
                            <div className="mt-1 text-[10px] text-red-400/80 leading-relaxed">
                              在 {formatDistanceM(viewshedResult.obstruction.distance)} 处地形超出视线 {viewshedResult.obstruction.exceedAmount.toFixed(1)} m
                            </div>
                          )}
                        </div>
                      )}

                      {/* CTA：为什么能看到？ */}
                      <button
                        onClick={() => handleViewshed(selectedPeakId)}
                        disabled={viewshedLoading}
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-gold/90 text-ink text-xs font-semibold hover:bg-gold disabled:opacity-60 transition active:scale-[0.98]"
                      >
                        {viewshedLoading ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
                            分析中…
                          </>
                        ) : (
                          <>
                            <Eye size={13} />
                            {viewshedResult ? '重新分析视域' : '为什么能看到？'}
                            <ChevronRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* 底部：方位切换 + 关闭 */}
              <div className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-safe bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(['N', 'E', 'S', 'W', 'SW'] as HeadingKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setHeading(k)}
                        className={`h-8 px-3 rounded-full text-[11px] border transition active:scale-95 ${
                          heading === k
                            ? 'bg-mist text-ink border-mist font-medium'
                            : 'bg-white/10 text-mist border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {labelOf(k)}
                      </button>
                    ))}
                  </div>
                  {import.meta.env.DEV && <DevPanel camera={camera} location={location} orientation={orientation} isMobile={isMobile} />}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======== 模拟取景器模式（默认）—— 深色沉浸式 ======== */}
      {mode === 'simulated' && (
        <div className="min-h-screen bg-ink text-mist">
          <div className="max-w-3xl mx-auto px-3 py-4 sm:py-6 safe-top">
            {/* 顶部状态栏 */}
            <div className="flex items-center justify-between px-2 pb-3">
              <div>
                <div className="text-[10px] text-mist/40 tracking-wider uppercase">AR 看山</div>
                <div className="text-sm text-mist font-medium mt-0.5">
                  朝向 <span className="text-gold">{labelOf(heading)}</span>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/5 text-mist/70 text-[10px] px-2.5 py-1 border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-gold pulse-dot" />
                演示模式
              </span>
            </div>

            {/* 取景器 —— 深色山景 */}
            <div
              className="relative rounded-3xl overflow-hidden bg-ink border border-white/5 shadow-2xl"
              style={{ aspectRatio: '9 / 16' }}
              role="img"
              aria-label="模拟 AR 摄像头画面"
              data-testid="ar-viewfinder"
            >
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(180deg, #1a2820 0%, #17251D 35%, #0f1815 70%, #0a0f0d 100%)'
                }}
              >
                <svg viewBox="0 0 900 1600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                  {/* 远山 */}
                  <path d="M0,900 L90,840 L180,900 L290,820 L400,890 L520,810 L640,890 L760,830 L900,900 L900,1600 L0,1600 Z" fill="#2a3d32" opacity="0.7" />
                  {/* 中景 */}
                  <path d="M0,1060 L120,980 L240,1050 L360,970 L480,1050 L600,990 L720,1060 L840,1000 L900,1030 L900,1600 L0,1600 Z" fill="#1a2820" opacity="0.85" />
                  {/* 前景 */}
                  <path d="M0,1280 Q 220 1200 450 1260 T 900 1250 L 900 1600 L 0 1600 Z" fill="#0f1815" />
                  {/* 雾 */}
                  <path d="M0,520 Q 300 490 500 530 T 900 510 L 900 560 Q 620 570 450 560 T 0 560 Z" fill="#F4F1E8" opacity="0.06" />
                  {/* 星点 */}
                  <circle cx="120" cy="180" r="1.2" fill="#F4F1E8" opacity="0.6" />
                  <circle cx="280" cy="240" r="0.8" fill="#F4F1E8" opacity="0.4" />
                  <circle cx="620" cy="160" r="1.0" fill="#F4F1E8" opacity="0.5" />
                  <circle cx="780" cy="280" r="0.9" fill="#F4F1E8" opacity="0.4" />
                </svg>
              </div>

              {/* 十字准星 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-16 h-16">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50" />
                  <div className="absolute inset-3 rounded-full border border-white/30" />
                  <div className="absolute inset-1/2 w-1 h-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/80" />
                </div>
              </div>

              {/* 顶部方位刻度 */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 pt-2 pb-2 px-4 flex items-end justify-between text-mist/70 text-[11px] tracking-widest font-mono bg-gradient-to-b from-black/40 to-transparent">
                <span>◀ {leftAz(currentHeading - 60)}</span>
                <span className="text-gold">▲ {az(currentHeading)}</span>
                <span>{rightAz(currentHeading + 60)} ▶</span>
              </div>

              {/* 山峰 badge */}
              {visible.map((v) => {
                const peak = getPeakById(v.peakId)
                if (!peak) return null
                let offset = v.azimuthDeg - currentHeading
                while (offset > 180) offset -= 360
                while (offset < -180) offset += 360
                const clamped = Math.max(-60, Math.min(60, offset))
                const leftPct = 8 + ((clamped + 60) / 120) * 84
                const verticalPct = 25 + ((v.distanceKm) / 8) * 40
                return (
                  <ArPeakBadge
                    key={v.peakId}
                    peak={peak}
                    visiblePeak={v}
                    highlight={selectedPeakId === v.peakId || highlightPeakId === v.peakId}
                    style={{ left: `${leftPct}%`, top: `${verticalPct}%` }}
                    onClick={() => { setSelectedPeakId(v.peakId); setViewshedResult(null) }}
                  />
                )
              })}

              {/* AR 山峰信息卡（模拟模式）—— 半透明玻璃信息卡 */}
              {selectedPeakId && visible.some(v => v.peakId === selectedPeakId) && (() => {
                const peak = getPeakById(selectedPeakId)
                if (!peak) return null
                const vpeak = visible.find(v => v.peakId === selectedPeakId)!
                return (
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-24 z-30 w-[90%] max-w-sm animate-enter-fade">
                    <div className="glass-panel rounded-2xl p-4 shadow-2xl">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-serif text-mist text-lg font-semibold">{peak.name}</h3>
                          <p className="mt-0.5 text-gold text-xs font-medium tabular-nums">{peak.elevation} m</p>
                        </div>
                        <button
                          onClick={() => { setSelectedPeakId(null); setViewshedResult(null) }}
                          className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-mist/60 hover:text-mist transition"
                          aria-label="关闭"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-[11px] text-mist/70">
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <MapPin size={11} className="text-moss" />
                          距离 {vpeak.distanceKm.toFixed(1)} km
                        </span>
                        <span className="flex items-center gap-1.5 tabular-nums">
                          <Compass size={11} className="text-moss" />
                          {azimuthCompassShort(vpeak.azimuthDeg)} {Math.round(vpeak.azimuthDeg)}°
                        </span>
                      </div>
                      {viewshedResult && (
                        <div className={`mt-3 pt-3 border-t border-white/10 text-xs ${viewshedResult.visible ? 'text-moss' : 'text-red-400'}`}>
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${viewshedResult.visible ? 'bg-moss' : 'bg-red-500'} pulse-dot`} />
                            {viewshedResult.visible ? '可见 · 无地形遮挡' : '不可见 · 被地形遮挡'}
                          </div>
                          <div className="mt-1 text-[10px] text-mist/50 tabular-nums">
                            距离 {formatDistanceM(viewshedResult.distance)} · 海拔差 {viewshedResult.elevationDifference > 0 ? '+' : ''}{viewshedResult.elevationDifference.toFixed(1)} m
                          </div>
                          {viewshedResult.obstruction && (
                            <div className="mt-1 text-[10px] text-red-400/80 leading-relaxed">
                              在 {formatDistanceM(viewshedResult.obstruction.distance)} 处地形超出视线 {viewshedResult.obstruction.exceedAmount.toFixed(1)} m
                            </div>
                          )}
                        </div>
                      )}
                      <button
                        onClick={() => handleViewshed(selectedPeakId)}
                        disabled={viewshedLoading}
                        className="mt-3 w-full inline-flex items-center justify-center gap-2 h-10 rounded-full bg-gold/90 text-ink text-xs font-semibold hover:bg-gold disabled:opacity-60 transition active:scale-[0.98]"
                      >
                        {viewshedLoading ? (
                          <>
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-ink/40 border-t-ink animate-spin" />
                            分析中…
                          </>
                        ) : (
                          <>
                            <Eye size={13} />
                            {viewshedResult ? '重新分析视域' : '为什么能看到？'}
                            <ChevronRight size={13} />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })()}

              {/* 底部 —— 摄像头入口 + 山峰数 */}
              <div className="absolute left-0 right-0 bottom-0 h-16 px-4 flex items-center justify-between bg-gradient-to-t from-ink/80 to-transparent">
                <span className="text-mist/70 text-[11px]">
                  共 <span className="text-mist font-medium">{visible.length}</span> 座可见
                </span>
                <button
                  type="button"
                  onClick={handleEnterCamera}
                  className="inline-flex items-center gap-1.5 px-4 h-9 rounded-full bg-gold text-ink text-xs font-semibold hover:bg-gold/90 transition active:scale-95 shadow-lg"
                >
                  <Camera size={13} />
                  打开摄像头
                </button>
              </div>
            </div>

            {/* 控制面板 —— 深色玻璃 */}
            <div className="mt-4 glass-panel rounded-2xl p-4">
              {/* 方位切换 */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {(['N', 'E', 'S', 'W', 'SW'] as HeadingKey[]).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setHeading(k)}
                      className={`h-9 px-3.5 rounded-full text-xs border transition active:scale-95 ${
                        heading === k
                          ? 'bg-mist text-ink border-mist font-medium'
                          : 'bg-white/5 text-mist/80 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      {labelOf(k)}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/viewshed')}
                  className="text-xs text-gold hover:text-gold/80 whitespace-nowrap font-medium inline-flex items-center gap-1"
                >
                  视域分析 <ChevronRight size={12} />
                </button>
              </div>

              {/* 空间感知按钮组 */}
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 flex-wrap">
                <SensingButton
                  label={location.status === 'watching' ? '停止定位' : '获取我的位置'}
                  icon={<MapPin size={13} />}
                  active={location.status === 'watching'}
                  loading={location.status === 'requesting'}
                  onClick={() => {
                    if (location.status === 'watching') location.stop()
                    else location.start()
                  }}
                />
                <SensingButton
                  label={orientation.status === 'listening' ? '停止方向感知' : '开启方向感知'}
                  icon={<Compass size={13} />}
                  active={orientation.status === 'listening'}
                  loading={orientation.status === 'requesting'}
                  onClick={() => {
                    if (orientation.status === 'listening') orientation.stop()
                    else orientation.start()
                  }}
                />
              </div>
            </div>

            {/* 调试面板 + 空间模拟测试（仅 dev） */}
            {import.meta.env.DEV && (
              <>
                <DebugPanel location={location} orientation={orientation} overlay={overlay} hasRealAR={hasRealAR} />
                <SpatialTestPanel location={location} orientation={orientation} onPeaksChange={setOverlayPeaks} />
              </>
            )}

            {!isMobile && (
              <div className="mt-4 glass-panel rounded-2xl p-4 text-[11px] text-mist/60 leading-relaxed">
                <div className="font-medium mb-1 text-mist/80">提示</div>
                <div>真实摄像头 / GPS / 方向传感器功能建议在手机上体验（同一 Wi-Fi + HTTPS 访问）。</div>
                <div className="mt-1 text-mist/50">
                  Stage 3 仅采集真实空间数据，山峰标签仍使用模拟位置 — Stage 4 才会根据真实 heading 让山峰跟随手机移动。
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ========= 子组件 ========= */

/** 空间感知主按钮（获取位置 / 开启方向感知）—— 深色玻璃风 */
function SensingButton({
  label,
  icon,
  active,
  loading,
  onClick
}: {
  label: string
  icon: React.ReactNode
  active: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-xs border transition active:scale-95 ${
        active
          ? 'bg-gold/15 text-gold border-gold/40 font-medium'
          : 'bg-white/5 text-mist/80 border-white/15 hover:bg-white/10'
      } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {loading ? <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin" /> : icon}
      {label}
    </button>
  )
}

/** 正式 UI — GPS 状态 chip（接收 LocationProvider）—— 极简玻璃风 */
function GeoStatusChip({
  location,
  compact
}: {
  location: ReturnType<typeof useLocationProvider>
  compact?: boolean
}) {
  const isActive = location.latLng != null && (location.status === 'watching' || location.status === 'mock')
  if (isActive) {
    const label = location.isMock ? '模拟位置' : 'GPS 已定位'
    return (
      <button
        type="button"
        onClick={() => location.stop()}
        className={`inline-flex items-center gap-1.5 rounded-full glass-panel text-mist text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-white/10 transition`}
        title={`精度 ${Math.round(location.accuracy ?? 5)}m`}
      >
        <MapPin size={10} className="text-moss" />
        <span className="w-1 h-1 rounded-full bg-moss pulse-dot" />
        {label}
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => location.start()}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 text-mist/80 border border-white/15 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-white/10 transition`}
    >
      <MapPin size={10} />
      点此定位
    </button>
  )
}

/** 正式 UI — 方向状态 chip（接收 OrientationProvider）—— 极简玻璃风 */
function CompassStatusChip({
  orientation,
  compact
}: {
  orientation: ReturnType<typeof useOrientationProvider>
  compact?: boolean
}) {
  if (orientation.heading != null) {
    const label = orientation.isMock ? '模拟 ' : ''
    return (
      <button
        type="button"
        onClick={() => orientation.stop()}
        className={`inline-flex items-center gap-1.5 rounded-full glass-panel text-mist text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-white/10 transition`}
        title={`朝向 ${Math.round(orientation.heading)}°`}
      >
        <Compass size={10} className="text-moss" />
        <span className="w-1 h-1 rounded-full bg-moss pulse-dot" />
        {label}{Math.round(orientation.heading)}°
      </button>
    )
  }
  return (
    <button
      type="button"
      onClick={() => orientation.start()}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white/5 text-mist/80 border border-white/15 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-white/10 transition`}
    >
      <Compass size={10} />
      点此开启
    </button>
  )
}

/** 开发调试面板（接收 Provider）—— 深色风 */
function DebugPanel({
  location,
  orientation,
  overlay,
  hasRealAR
}: {
  location: ReturnType<typeof useLocationProvider>
  orientation: ReturnType<typeof useOrientationProvider>
  overlay: ReturnType<typeof useArPeakOverlay>
  hasRealAR: boolean
}) {
  return (
    <div className="mt-4 glass-panel rounded-2xl p-4 text-[11px]">
      <div className="text-[10px] text-gold font-medium mb-2 tracking-wider">
        开发调试面板（DEV ONLY）
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* GPS 区块 */}
        <div>
          <div className="text-[10px] text-mist/40 mb-1">GPS{location.isMock ? ' (模拟)' : ''}</div>
          <div className="font-mono leading-tight text-mist/90">
            <Line label="状态" value={location.status} />
            {location.latLng && (
              <>
                <Line label="纬度" value={location.latLng.lat.toFixed(6)} />
                <Line label="经度" value={location.latLng.lng.toFixed(6)} />
                <Line label="精度" value={`${Math.round(location.accuracy ?? 5)}m`} />
                {location.altitude != null && (
                  <Line label="海拔" value={`${Math.round(location.altitude)}m`} />
                )}
              </>
            )}
          </div>
        </div>
        {/* Compass 区块 */}
        <div>
          <div className="text-[10px] text-mist/40 mb-1">方向传感器{orientation.isMock ? ' (模拟)' : ''}</div>
          <div className="font-mono leading-tight text-mist/90">
            <Line label="状态" value={orientation.status} />
            <Line label="自动旋转" value={orientation.isAutoRotating ? 'YES' : 'NO'} />
            {orientation.heading != null && (
              <Line label="Heading" value={`${Math.round(orientation.heading)}°`} />
            )}
          </div>
        </div>
      </div>

      {/* Stage 4 AR 计算结果 */}
      <div className="mt-3 pt-3 border-t border-white/10">
        <div className="text-[10px] text-mist/40 mb-1 flex items-center justify-between">
          <span>Stage 4 AR 山峰定位</span>
          <span className={hasRealAR ? 'text-moss' : 'text-mist/50'}>
            {hasRealAR ? '● 实时' : '○ 待 位置+Heading'}
          </span>
        </div>
        <div className="text-[10px] text-mist/40 mb-1">
          FOV {overlay.fov}° · 共 {overlay.items.length} 座 · 视野内 {overlay.items.filter(i => i.inFOV).length}
        </div>
        <div className="space-y-0.5 font-mono leading-tight text-mist/90 max-h-32 overflow-auto">
          {overlay.items.length === 0 && (
            <div className="text-mist/30">暂无山峰数据（开启测试模式或获取真实 GPS+方向）</div>
          )}
          {overlay.items.map((it) => (
            <div key={it.peak.id} className={`flex justify-between gap-2 text-[10px] ${it.inFOV ? '' : 'text-mist/30'}`}>
              <span>{it.peak.name}</span>
              <span>
                {Math.round(it.bearingDeg)}° · {it.distanceKm.toFixed(1)}km · rel{it.relativeDeg > 0 ? '+' : ''}{Math.round(it.relativeDeg)}° · x{it.screenXPercent.toFixed(0)}% {it.inFOV ? '' : '(OUT)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 简易指南针可视化 */}
      {orientation.heading != null && (
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center">
          <CompassVisual heading={orientation.heading} />
        </div>
      )}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-mist/40">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

/** 简易指南针可视化 —— 圆形 + 箭头 + 方位 */
function CompassVisual({ heading }: { heading: number }) {
  const dir = headingToDirection(heading)
  return (
    <div className="relative w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
      {/* 方位文字 */}
      <span className="absolute top-1 text-[10px] text-mist/60">N</span>
      <span className="absolute bottom-1 text-[10px] text-mist/60">S</span>
      <span className="absolute left-1 text-[10px] text-mist/60">W</span>
      <span className="absolute right-1 text-[10px] text-mist/60">E</span>
      {/* 箭头 */}
      <div
        className="absolute inset-2 flex items-center justify-center transition-transform duration-100"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[22px] border-l-transparent border-r-transparent border-b-gold" />
      </div>
      {/* 中心数字 */}
      <span className="relative z-10 text-xs font-bold text-mist font-mono">
        {Math.round(heading)}°
      </span>
      {/* 方位 */}
      <span className="absolute bottom-4 text-[9px] text-mist/70 font-medium">{dir}</span>
    </div>
  )
}

function headingToDirection(heading: number): string {
  const idx = Math.round(((heading % 360) + 360) % 360 / 45) % 8
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][idx]
}

/** 摄像头模式底部 dev 小面板 */
function DevPanel({
  camera,
  location,
  orientation,
  isMobile
}: {
  camera: ReturnType<typeof useCamera>
  location: ReturnType<typeof useLocationProvider>
  orientation: ReturnType<typeof useOrientationProvider>
  isMobile: boolean
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 text-mist/50 text-[9px] leading-tight font-mono text-right">
      <span>cam · {camera.status}</span>
      <span>{location.isMock ? 'MOCK ' : ''}{location.latLng ? `${location.latLng.lat.toFixed(4)}, ${location.latLng.lng.toFixed(4)}` : location.status}</span>
      <span>{orientation.isMock ? 'MOCK ' : ''}{orientation.heading != null ? `${Math.round(orientation.heading)}°` : orientation.status}</span>
      <span>device · {isMobile ? 'Mobile' : 'Desktop'}</span>
    </div>
  )
}

/* ========= 工具函数 ========= */

function labelOf(h: HeadingKey | string): string {
  const map: Record<string, string> = {
    N: '正北', E: '正东', S: '正南', W: '正西', SW: '西南'
  }
  return map[h] ?? h
}

function az(deg: number): string { return formatDeg(deg) }
function leftAz(deg: number): string { if (deg < 0) deg += 360; return formatDeg(deg) }
function rightAz(deg: number): string { if (deg >= 360) deg -= 360; return formatDeg(deg) }
function formatDeg(deg: number): string {
  const d = ((deg % 360) + 360) % 360
  return `${Math.round(d)}°`
}

/** 方位角 → 简短方位文字 */
function azimuthCompassShort(deg: number): string {
  const idx = Math.round((((deg % 360) + 360) % 360) / 45) % 8
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][idx] ?? '—'
}
