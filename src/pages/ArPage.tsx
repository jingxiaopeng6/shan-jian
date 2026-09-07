import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultUserPosition, getPeakById, getVisiblePeaks } from '../data/mock'
import ArPeakBadge, { type HeadingKey } from '../components/ArPeakBadge'
import CameraView from '../components/CameraView'
import { useCamera } from '../hooks/useCamera'
import { useGeolocation } from '../hooks/useGeolocation'
import { useDeviceOrientation } from '../hooks/useDeviceOrientation'
import { useArPeakOverlay } from '../hooks/useArPeakOverlay'
import { useIsMobile } from '../hooks/useIsMobile'
import type { LatLng } from '../utils/geoUtils'

type ArMode = 'simulated' | 'camera'

export default function ArPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [mode, setMode] = useState<ArMode>('simulated')
  const [heading, setHeading] = useState<HeadingKey>('E')

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
  // Stage 3: GPS + 方向传感器
  const geo = useGeolocation()
  const compass = useDeviceOrientation()

  // Stage 4: 真实 AR 山峰定位（GPS + heading → 屏幕 X）
  const userLatLng: LatLng | null = geo.reading
    ? { lat: geo.reading.latitude, lng: geo.reading.longitude }
    : null
  const realHeading = compass.status === 'listening' && compass.reading
    ? compass.reading.heading
    : null
  const overlay = useArPeakOverlay({ userLatLng, heading: realHeading })
  // 是否具备 Stage 4 真实 AR 渲染条件
  const hasRealAR = userLatLng != null && realHeading != null && overlay.items.length > 0

  // 离开页面时清理所有资源
  useEffect(() => {
    return () => {
      camera.stop()
      geo.stop()
      compass.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleEnterCamera = async () => {
    setMode('camera')
    await camera.start()
  }

  const handleExitCamera = () => {
    camera.stop()
    setMode('simulated')
  }

  return (
    <div className="relative">
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
              {/* 顶部：📍 GPS + 🧭 方向 状态 + 方位刻度 */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 px-4 pt-3 pb-2 flex items-start justify-between gap-3 bg-gradient-to-b from-black/60 to-transparent">
                {/* 左侧：GPS + Compass 状态 */}
                <div className="pointer-events-auto flex flex-col gap-1.5">
                  <GeoStatusChip geo={geo} onRequest={geo.startWatching} onStop={geo.stop} />
                  <CompassStatusChip compass={compass} onRequest={compass.start} onStop={compass.stop} />
                </div>
                {/* 右侧：方位刻度（原功能） */}
                <div className="pointer-events-none flex items-center gap-3 text-white/80 text-[11px] tracking-widest pt-1">
                  <span>{az(currentHeading)}</span>
                </div>
              </div>

              {/* 十字准星 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60" />
                  <div className="absolute inset-4 rounded-full border border-white/40" />
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
                          onClick={() => navigate(`/peak/${item.peak.id}`)}
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
                            style={{ left: `${leftPct}%`, top: `${verticalPct}%` }}
                            onClick={() => navigate(`/peak/${v.peakId}`)}
                          />
                        </div>
                      )
                    })}
              </div>

              {/* 底部：视角切换按钮 + 关闭 */}
              <div className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-safe bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1.5">
                    {(['N', 'E', 'S', 'W', 'SW'] as HeadingKey[]).map((k) => (
                      <button
                        key={k}
                        type="button"
                        onClick={() => setHeading(k)}
                        className={`h-8 px-3 rounded-full text-[11px] border transition ${
                          heading === k
                            ? 'bg-white text-forest-900 border-white font-medium'
                            : 'bg-white/10 text-white border-white/30 hover:bg-white/20'
                        }`}
                      >
                        {labelOf(k)}
                      </button>
                    ))}
                  </div>
                  {import.meta.env.DEV && <DevPanel camera={camera} geo={geo} compass={compass} isMobile={isMobile} />}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ======== 模拟取景器模式（默认） ======== */}
      {mode === 'simulated' && (
        <div className="max-w-3xl mx-auto px-3 py-4 sm:py-6">
          {/* 顶部状态栏 */}
          <div className="flex items-center justify-between px-2 pb-3 flex-wrap gap-2">
            <div>
              <div className="text-xs text-stone2-400">
                模拟摄像头 · {defaultUserPosition.name}
              </div>
              <div className="text-sm text-forest-800 font-medium mt-0.5">
                AR 看山 · 朝向 {labelOf(heading)}
              </div>
            </div>
            {/* 正式 UI 上的 📍 🧭 状态 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <GeoStatusChip geo={geo} onRequest={geo.startWatching} onStop={geo.stop} compact />
              <CompassStatusChip compass={compass} onRequest={compass.start} onStop={compass.stop} compact />
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-700/10 text-forest-700 text-[10px] px-2 py-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                DEMO
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
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, #cfd8d2 0%, #e8e5d6 48%, #b8bda6 100%)'
              }}
            >
              <svg viewBox="0 0 900 1600" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full">
                <path d="M0,900 L90,840 L180,900 L290,820 L400,890 L520,810 L640,890 L760,830 L900,900 L900,1600 L0,1600 Z" fill="#8fa18d" opacity="0.7" />
                <path d="M0,1060 L120,980 L240,1050 L360,970 L480,1050 L600,990 L720,1060 L840,1000 L900,1030 L900,1600 L0,1600 Z" fill="#5c7260" opacity="0.85" />
                <path d="M0,1280 Q 220 1200 450 1260 T 900 1250 L 900 1600 L 0 1600 Z" fill="#3a5040" />
                <path d="M0,520 Q 300 490 500 530 T 900 510 L 900 560 Q 620 570 450 560 T 0 560 Z" fill="#ffffff" opacity="0.35" />
              </svg>
            </div>

            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="relative w-20 h-20">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/70" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/70" />
                <div className="absolute inset-4 rounded-full border border-white/50" />
              </div>
            </div>

            <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-1 text-white/90 text-[11px] tracking-widest bg-gradient-to-b from-black/40 to-transparent">
              <span>◀ {leftAz(currentHeading - 60)}</span>
              <span className="text-sand-200">▲ {az(currentHeading)}</span>
              <span>{rightAz(currentHeading + 60)} ▶</span>
            </div>

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
                  style={{ left: `${leftPct}%`, top: `${verticalPct}%` }}
                  onClick={() => navigate(`/peak/${v.peakId}`)}
                />
              )
            })}

            <div className="absolute left-0 right-0 bottom-0 h-14 px-4 flex items-center justify-between bg-gradient-to-t from-black/60 to-transparent">
              <span className="text-white/85 text-[11px]">
                共 {visible.length} 座山峰可见
              </span>
              <button
                type="button"
                onClick={handleEnterCamera}
                className="inline-flex items-center gap-1.5 px-3 h-8 rounded-full bg-sand-400 text-forest-900 text-[11px] font-medium hover:bg-sand-300 transition shadow-soft"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="6" width="14" height="12" rx="2" />
                  <path d="M22 8l-6 4 6 4V8z" />
                </svg>
                打开摄像头
              </button>
            </div>
          </div>

          {/* 方位切换 + GPS + 方向按钮 */}
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex flex-wrap gap-1.5">
                {(['N', 'E', 'S', 'W', 'SW'] as HeadingKey[]).map((k) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setHeading(k)}
                    className={`h-9 sm:h-8 px-3 rounded-full text-xs border transition ${
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

            {/* Stage 3 空间感知按钮组 */}
            <div className="flex items-center gap-2 flex-wrap">
              <SensingButton
                label={geo.status === 'watching' ? '📍 停止定位' : '📍 获取我的位置'}
                active={geo.status === 'watching'}
                loading={geo.status === 'requesting'}
                onClick={() => {
                  if (geo.status === 'watching') geo.stop()
                  else geo.startWatching()
                }}
              />
              <SensingButton
                label={compass.status === 'listening' ? '🧭 停止方向感知' : '🧭 开启方向感知'}
                active={compass.status === 'listening'}
                loading={compass.status === 'requesting'}
                onClick={() => {
                  if (compass.status === 'listening') compass.stop()
                  else compass.start()
                }}
              />
            </div>
          </div>

          {/* 调试面板（仅 dev） */}
          {import.meta.env.DEV && (
            <DebugPanel geo={geo} compass={compass} overlay={overlay} hasRealAR={hasRealAR} />
          )}

          {!isMobile && (
            <div className="mt-4 rounded-lg bg-forest-50 border border-forest-100 p-3 text-[11px] text-forest-700 leading-relaxed">
              <div className="font-medium mb-1 text-forest-800">💡 提示</div>
              <div>真实摄像头 / GPS / 方向传感器功能建议在手机上体验（同一 Wi-Fi + HTTPS 访问）。</div>
              <div className="mt-1">
                Stage 3 仅采集真实空间数据，山峰标签仍使用模拟位置 — Stage 4 才会根据真实 heading 让山峰跟随手机移动。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ========= 子组件 ========= */

/** 空间感知主按钮（获取位置 / 开启方向感知） */
function SensingButton({
  label,
  active,
  loading,
  onClick
}: {
  label: string
  active: boolean
  loading: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`inline-flex items-center gap-2 h-9 px-3.5 rounded-full text-xs border transition ${
        active
          ? 'bg-forest-700 text-white border-forest-700 font-medium'
          : 'bg-white text-forest-700 border-forest-200 hover:bg-forest-50'
      } ${loading ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {loading && <span className="w-2.5 h-2.5 rounded-full border-2 border-current border-t-transparent animate-spin" />}
      {label}
    </button>
  )
}

/** 正式 UI — GPS 状态 chip */
function GeoStatusChip({
  geo,
  onRequest,
  onStop,
  compact
}: {
  geo: ReturnType<typeof useGeolocation>
  onRequest: () => void
  onStop: () => void
  compact?: boolean
}) {
  if (geo.status === 'watching' && geo.reading) {
    const acc = geo.reading.accuracy
    const accLabel = acc < 20 ? `精度 好` : acc < 100 ? `精度 ${Math.round(acc)}m` : `精度 ${Math.round(acc)}m · 建议开阔区`
    return (
      <button
        type="button"
        onClick={onStop}
        className={`inline-flex items-center gap-1.5 rounded-full bg-forest-700/15 text-forest-800 border border-forest-200 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-forest-700/25 transition`}
        title={accLabel}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
        📍 GPS 已定位
      </button>
    )
  }
  if (geo.status === 'denied') {
    return (
      <button
        type="button"
        onClick={onRequest}
        className={`inline-flex items-center gap-1.5 rounded-full bg-sand-400/15 text-sand-700 border border-sand-300 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-sand-400/25 transition`}
      >
        📍 点此定位
      </button>
    )
  }
  if (geo.status === 'requesting') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-sand-300 animate-pulse" />
        📍 定位中…
      </span>
    )
  }
  return null // idle 或 error 时不显示 chip（按钮组里有主按钮）
}

/** 正式 UI — 方向状态 chip */
function CompassStatusChip({
  compass,
  onRequest,
  onStop,
  compact
}: {
  compass: ReturnType<typeof useDeviceOrientation>
  onRequest: () => void
  onStop: () => void
  compact?: boolean
}) {
  if (compass.status === 'listening' && compass.reading) {
    return (
      <button
        type="button"
        onClick={onStop}
        className={`inline-flex items-center gap-1.5 rounded-full bg-forest-700/15 text-forest-800 border border-forest-200 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-forest-700/25 transition`}
        title={`真实朝向 ${Math.round(compass.reading.heading)}°`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-forest-600 animate-pulse" />
        🧭 {Math.round(compass.reading.heading)}°
      </button>
    )
  }
  if (compass.status === 'denied') {
    return (
      <button
        type="button"
        onClick={onRequest}
        className={`inline-flex items-center gap-1.5 rounded-full bg-sand-400/15 text-sand-700 border border-sand-300 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'} hover:bg-sand-400/25 transition`}
      >
        🧭 点此开启
      </button>
    )
  }
  if (compass.status === 'requesting') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full bg-white/10 text-white/70 border border-white/20 text-[11px] px-2.5 ${compact ? 'py-0.5' : 'py-1'}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-sand-300 animate-pulse" />
        🧭 请在弹窗中允许
      </span>
    )
  }
  return null
}

/** 开发环境 GPS + 方向 + Stage 4 AR 调试面板（模拟模式下） */
function DebugPanel({
  geo,
  compass,
  overlay,
  hasRealAR
}: {
  geo: ReturnType<typeof useGeolocation>
  compass: ReturnType<typeof useDeviceOrientation>
  overlay: ReturnType<typeof useArPeakOverlay>
  hasRealAR: boolean
}) {
  return (
    <div className="mt-4 rounded-xl bg-white border border-forest-100 p-3 text-[11px]">
      <div className="text-[10px] text-forest-500 font-medium mb-2 tracking-wide">
        🧪 开发调试面板（DEV ONLY）
      </div>
      <div className="grid grid-cols-2 gap-3">
        {/* GPS 区块 */}
        <div>
          <div className="text-[10px] text-stone2-400 mb-1">📍 GPS</div>
          <div className="font-mono leading-tight text-forest-800">
            <Line label="状态" value={geo.status} />
            {geo.reading && (
              <>
                <Line label="纬度" value={geo.reading.latitude.toFixed(6)} />
                <Line label="经度" value={geo.reading.longitude.toFixed(6)} />
                <Line label="精度" value={`${Math.round(geo.reading.accuracy)}m`} />
                {geo.reading.altitude != null && (
                  <Line label="海拔" value={`${Math.round(geo.reading.altitude)}m`} />
                )}
              </>
            )}
            {geo.error && <Line label="错误" value={geo.error.code} />}
          </div>
        </div>
        {/* Compass 区块 */}
        <div>
          <div className="text-[10px] text-stone2-400 mb-1">🧭 方向传感器</div>
          <div className="font-mono leading-tight text-forest-800">
            <Line label="状态" value={compass.status} />
            <Line label="iOS 授权" value={compass.needsManualPermission ? 'YES' : 'NO'} />
            {compass.reading && (
              <>
                <Line label="Heading" value={`${Math.round(compass.reading.heading)}°`} />
                <Line label="Alpha" value={compass.reading.alpha?.toFixed(1) ?? '—'} />
                <Line label="Beta" value={compass.reading.beta?.toFixed(1) ?? '—'} />
                <Line label="Gamma" value={compass.reading.gamma?.toFixed(1) ?? '—'} />
              </>
            )}
            {compass.error && <Line label="错误" value={compass.error.code} />}
          </div>
        </div>
      </div>

      {/* Stage 4 AR 计算结果 */}
      <div className="mt-3 pt-3 border-t border-forest-100">
        <div className="text-[10px] text-stone2-400 mb-1 flex items-center justify-between">
          <span>🏔️ Stage 4 AR 山峰定位</span>
          <span className={hasRealAR ? 'text-forest-600' : 'text-sand-500'}>
            {hasRealAR ? '● 实时' : '○ 待 GPS+Heading'}
          </span>
        </div>
        <div className="text-[10px] text-stone2-400 mb-1">
          FOV {overlay.fov}° · 共 {overlay.items.length} 座 · 视野内 {overlay.items.filter(i => i.inFOV).length}
        </div>
        <div className="space-y-0.5 font-mono leading-tight text-forest-800 max-h-32 overflow-auto">
          {overlay.items.length === 0 && (
            <div className="text-stone2-300">暂无山峰数据（需要 GPS + Heading 均已开启）</div>
          )}
          {overlay.items.map((it) => (
            <div key={it.peak.id} className={`flex justify-between gap-2 text-[10px] ${it.inFOV ? '' : 'text-stone2-300'}`}>
              <span>{it.peak.name}</span>
              <span>
                {Math.round(it.bearingDeg)}° · {it.distanceKm.toFixed(1)}km · rel{it.relativeDeg > 0 ? '+' : ''}{Math.round(it.relativeDeg)}° · x{it.screenXPercent.toFixed(0)}% {it.inFOV ? '' : '(OUT)'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 简易指南针可视化 */}
      {compass.reading && (
        <div className="mt-3 pt-3 border-t border-forest-100 flex items-center justify-center">
          <CompassVisual heading={compass.reading.heading} />
        </div>
      )}
    </div>
  )
}

function Line({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-stone2-400">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  )
}

/** 简易指南针可视化 —— 圆形 + 箭头 + 方位 */
function CompassVisual({ heading }: { heading: number }) {
  const dir = headingToDirection(heading)
  return (
    <div className="relative w-24 h-24 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center">
      {/* 方位文字 */}
      <span className="absolute top-1 text-[10px] text-forest-600">N</span>
      <span className="absolute bottom-1 text-[10px] text-forest-600">S</span>
      <span className="absolute left-1 text-[10px] text-forest-600">W</span>
      <span className="absolute right-1 text-[10px] text-forest-600">E</span>
      {/* 箭头 */}
      <div
        className="absolute inset-2 flex items-center justify-center transition-transform duration-100"
        style={{ transform: `rotate(${heading}deg)` }}
      >
        <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-b-[22px] border-l-transparent border-r-transparent border-b-sand-500" />
      </div>
      {/* 中心数字 */}
      <span className="relative z-10 text-xs font-bold text-forest-800 font-mono">
        {Math.round(heading)}°
      </span>
      {/* 方位 */}
      <span className="absolute bottom-4 text-[9px] text-forest-600 font-medium">{dir}</span>
    </div>
  )
}

function headingToDirection(heading: number): string {
  const idx = Math.round(((heading % 360) + 360) % 360 / 45) % 8
  return ['北', '东北', '东', '东南', '南', '西南', '西', '西北'][idx]
}

/** 摄像头模式底部的 dev 小面板（空间状态一行） */
function DevPanel({
  camera,
  geo,
  compass,
  isMobile
}: {
  camera: ReturnType<typeof useCamera>
  geo: ReturnType<typeof useGeolocation>
  compass: ReturnType<typeof useDeviceOrientation>
  isMobile: boolean
}) {
  return (
    <div className="flex flex-col items-end gap-0.5 text-white/60 text-[9px] leading-tight font-mono text-right">
      <span>📷 {camera.status}</span>
      <span>📍 {geo.status === 'watching' && geo.reading ? `${geo.reading.latitude.toFixed(4)}, ${geo.reading.longitude.toFixed(4)}` : geo.status}</span>
      <span>🧭 {compass.status === 'listening' && compass.reading ? `${Math.round(compass.reading.heading)}°` : compass.status}</span>
      <span>Device · {isMobile ? 'Mobile' : 'Desktop'}</span>
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
