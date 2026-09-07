import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { defaultUserPosition, getPeakById, getVisiblePeaks } from '../data/mock'
import ArPeakBadge, { type HeadingKey } from '../components/ArPeakBadge'
import CameraView from '../components/CameraView'
import { useCamera } from '../hooks/useCamera'
import { useIsMobile } from '../hooks/useIsMobile'

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

  // 摄像头 hook（在 camera 模式下才会真正启动）
  const camera = useCamera()

  // 离开页面时自动清理摄像头资源
  useEffect(() => {
    return () => {
      if (camera.status !== 'idle') {
        camera.stop()
      }
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

          {/* AR Overlay 层：山峰标签叠加在摄像头画面上方 */}
          {camera.status === 'streaming' && (
            <>
              {/* 方位刻度顶栏 */}
              <div className="pointer-events-none absolute top-0 left-0 right-0 h-10 flex items-end justify-between px-4 pb-1 text-white/90 text-[11px] tracking-widest bg-gradient-to-b from-black/50 to-transparent">
                <span className="text-white/70">◀ {leftAz(currentHeading - 60)}</span>
                <span className="text-sand-200">▲ {az(currentHeading)}</span>
                <span className="text-white/70">{rightAz(currentHeading + 60)} ▶</span>
              </div>

              {/* 十字准星 */}
              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                <div className="relative w-20 h-20">
                  <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60" />
                  <div className="absolute top-1/2 left-0 right-0 h-px bg-white/60" />
                  <div className="absolute inset-4 rounded-full border border-white/40" />
                </div>
              </div>

              {/* 山峰 Badge：位置逻辑与模拟取景器完全相同 */}
              <div className="pointer-events-none absolute inset-0">
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

              {/* 底部操作栏：全屏时也可切换视角 / 调试信息 */}
              <div className="absolute left-0 right-0 bottom-0 px-4 pt-3 pb-safe bg-gradient-to-t from-black/60 to-transparent">
                <div className="flex items-center justify-between">
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

                  {/* 开发调试信息（仅 dev 环境显示） */}
                  {import.meta.env.DEV && <DevChip isMobile={isMobile} camera={camera} />}
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
          <div className="flex items-center justify-between px-2 pb-3">
            <div>
              <div className="text-xs text-stone2-400">
                模拟摄像头 · {defaultUserPosition.name}
              </div>
              <div className="text-sm text-forest-800 font-medium mt-0.5">
                AR 看山 · 朝向 {labelOf(heading)}
              </div>
            </div>
            <div className="flex items-center gap-1.5">
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
            {/* 背景画面：克制的山景渐变模拟 */}
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

            {/* 山峰 Badge */}
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

            {/* 底部取景提示 + 进入真实摄像头按钮 */}
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

          {/* 视角切换 */}
          <div className="mt-4 flex items-center justify-between gap-2">
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

          {/* 电脑端提示（仅桌面端） */}
          {!isMobile && (
            <div className="mt-4 rounded-lg bg-forest-50 border border-forest-100 p-3 text-[11px] text-forest-700 leading-relaxed">
              <div className="font-medium mb-1 text-forest-800">💡 提示</div>
              <div>真实摄像头功能需要在手机上体验（同一局域网访问）。</div>
              <div className="mt-1">
                开发面板已显示局域网地址，手机连接同一 Wi-Fi 后输入该地址即可进入本页面并点击"打开摄像头"。
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/** 开发调试小标签（仅 dev） */
function DevChip({ isMobile, camera }: { isMobile: boolean; camera: ReturnType<typeof useCamera> }) {
  const statusLabel: Record<string, string> = {
    idle: '待机', requesting: '请求中', streaming: '实时', denied: '已拒绝', unsupported: '不支持', error: '错误'
  }
  return (
    <div className="flex flex-col items-end gap-0.5 text-white/60 text-[9px] leading-tight font-mono">
      <span>Camera · {statusLabel[camera.status] ?? camera.status}</span>
      <span>Device · {isMobile ? 'Mobile' : 'Desktop'}</span>
      <span>Secure · {camera.isSecureContext ? 'YES' : 'NO'}</span>
    </div>
  )
}

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
