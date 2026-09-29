import { useState, useEffect } from 'react'
import CesiumMap from '../components/CesiumMap'
import { Link, useNavigate } from 'react-router-dom'
import { useGeolocation } from '../hooks/useGeolocation'
import { attractions } from '../data/attractions'
import { calculateDistanceKm } from '../utils/geoUtils'
import { getPeakById } from '../data/mock'
import { hasVisited } from '../services/travelLog'
import { findNfcByAttraction } from '../data/nfcPoints'
import { getTrackPoints } from '../services/trackLog'
import BottomSheet from '../components/ui/BottomSheet'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import { ChevronLeft, MapPin, Camera, Crosshair, Navigation, X, Eye, FileText, Mountain } from 'lucide-react'

export default function MapPage() {
  const geo = useGeolocation()
  const navigate = useNavigate()
  const [locating, setLocating] = useState(false)
  const [targetId, setTargetId] = useState<string>('')
  const [selectedPeakId, setSelectedPeakId] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const trackPoints = getTrackPoints().map((p) => ({ lat: p.lat, lng: p.lng }))

  const selectedPeak = selectedPeakId ? getPeakById(selectedPeakId) : null
  const selectedVisited = selectedPeakId ? (() => {
    const nfcPoint = findNfcByAttraction(selectedPeakId)
    return nfcPoint ? hasVisited(nfcPoint.attractionId) : false
  })() : false

  const userPosition = geo.reading
    ? { lat: geo.reading.latitude, lng: geo.reading.longitude }
    : null

  const from = userPosition ?? { lat: 27.4789, lng: 114.1728 }
  const target = attractions.find((a) => a.id === targetId) ?? null
  const route = target
    ? { from, to: { lat: target.latitude, lng: target.longitude } }
    : null
  const distanceKm = target
    ? calculateDistanceKm(from, { lat: target.latitude, lng: target.longitude })
    : 0

  const handleLocate = () => {
    setLocating(true)
    geo.get()
    setTimeout(() => setLocating(false), 3000)
  }

  return (
    <div className="fixed inset-0 bg-ink-300">
      {/* 全屏 Cesium 地图（地形渲染保持原状） */}
      <CesiumMap
        userPosition={userPosition}
        route={route}
        onPeakSelect={(id) => setSelectedPeakId(id)}
        trackPoints={trackPoints}
      />

      {/* ===== 顶部栏：奶酪玻璃 + 青苹果控件 ===== */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center justify-between px-3 pt-3">
          {/* 左侧：返回 + GIS 标签 */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/')}
              aria-label="返回"
              className="w-10 h-10 flex items-center justify-center rounded-xl glass-light text-apple-600 hover:bg-apple-50 active:bg-apple-100 shadow-glass transition"
            >
              <ChevronLeft size={20} strokeWidth={2} />
            </button>
            <div className="hidden sm:flex flex-col gap-0.5 px-2.5 py-1.5 glass-light rounded-lg shadow-glass">
              <span className="text-overline text-apple-600 tracking-wider font-mono font-semibold">3D TERRAIN</span>
              <span className="text-overline text-ink-50 tracking-wider">ASTER GDEM · 30m</span>
            </div>
          </div>

          {/* 右侧：操作控件（统一 IconButton 风格） */}
          <div className="flex items-center gap-2">
            <ControlButton
              onClick={handleLocate}
              disabled={locating}
              icon={locating ? <Spinner /> : <Crosshair size={16} />}
              label="定位"
            />
            <ControlLink to="/ar" icon={<Camera size={16} />} label="AR" />
            <ControlLink to="/viewshed" icon={<Eye size={16} />} label="视域" />
          </div>
        </div>

        {/* 提示 */}
        {showHint && (
          <div className="mt-3 flex justify-center animate-fade-out">
            <span className="text-caption text-ink-50 px-3 py-1 glass-light rounded-full shadow-glass">
              探索一座山，从地图开始
            </span>
          </div>
        )}

        {/* 路线距离 */}
        {target && (
          <div className="mt-3 flex justify-center">
            <div className="glass-light rounded-xl px-3 py-2 flex items-center gap-2 text-sm text-ink shadow-glass">
              <Navigation size={14} className="text-apple-500" />
              <span className="font-medium">{target.name}</span>
              <span className="text-apple-600 font-bold">{distanceKm.toFixed(2)} km</span>
              <span className="text-overline text-rock-400">示意直线</span>
              <button onClick={() => setTargetId('')} className="text-rock-300 hover:text-amber-400 ml-1" aria-label="关闭">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {geo.status === 'denied' && (
          <div className="mt-3 flex justify-center">
            <span className="text-caption text-amber-400 px-3 py-1 glass-light rounded-full shadow-glass">
              定位权限被拒绝
            </span>
          </div>
        )}
      </div>

      {/* ===== 底部路线选择器 ===== */}
      {!selectedPeak && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
          <div className="px-4 pb-4">
            <div className="glass-light rounded-2xl p-4 shadow-glass">
              <div className="flex items-center gap-2 mb-3">
                <Navigation size={14} className="text-apple-500" />
                <span className="text-overline text-ink-50 tracking-wider font-semibold">路线导航</span>
              </div>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-cheese-50 text-ink text-sm border border-apple-400/30 focus:outline-none focus:border-apple-400 transition"
              >
                <option value="">选择目标景点</option>
                {attractions.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              {target && (
                <p className="mt-2 text-caption text-rock-400">直线距离 {distanceKm.toFixed(2)} km · MVP 示意路线</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 山峰信息 BottomSheet（奶酪底）===== */}
      <BottomSheet open={!!selectedPeak} onClose={() => setSelectedPeakId(null)} tone="light">
        {selectedPeak && (
          <div className="space-y-4">
            {/* 标题区 */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-2xl text-forest-700 font-bold leading-tight">{selectedPeak.name}</h2>
                <p className="text-overline text-rock-400 tracking-wider mt-1">{selectedPeak.pinyin?.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-serif font-bold text-apple-600">{selectedPeak.elevation}</div>
                <div className="text-overline text-rock-400">m</div>
              </div>
            </div>

            {/* 距离 + 打卡状态 */}
            {userPosition && (() => {
              const dist = calculateDistanceKm(userPosition, { lat: selectedPeak.lat, lng: selectedPeak.lng })
              return (
                <div className="flex items-center gap-3 text-sm">
                  <span className="inline-flex items-center gap-1.5 text-ink-50">
                    <MapPin size={14} className="text-apple-500" />
                    {dist.toFixed(1)} km
                  </span>
                  {selectedVisited && <Badge tone="apple">已打卡</Badge>}
                  <span className="text-overline text-rock-400 ml-auto">江西 · 武功山</span>
                </div>
              )
            })()}

            {/* 分割线 */}
            <div className="divider-apple" />

            {/* 简介 */}
            <p className="text-sm text-ink-50 leading-relaxed">{selectedPeak.description}</p>

            {/* 操作按钮：三级层级 */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                leftIcon={<Camera size={16} />}
                onClick={() => navigate(`/ar?peakId=${selectedPeak.id}`)}
              >
                AR 看山
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Eye size={14} />}
                  onClick={() => navigate(`/viewshed?peakId=${selectedPeak.id}`)}
                >
                  视域分析
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<FileText size={14} />}
                  onClick={() => navigate(`/peak/${selectedPeak.id}`)}
                >
                  详情
                </Button>
              </div>
            </div>

            {/* NFC 入口 */}
            <button
              onClick={() => navigate('/nfc')}
              className="w-full text-center text-caption text-apple-600 hover:text-apple-700 transition py-1 inline-flex items-center justify-center gap-1"
            >
              <Mountain size={12} />
              探索印记 →
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}

// ===== 控件子组件：统一奶酪玻璃风格 =====
function ControlButton({ onClick, disabled, icon, label }: {
  onClick: () => void
  disabled?: boolean
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-10 px-3 rounded-xl glass-light text-apple-600 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-apple-50 active:bg-apple-100 shadow-glass transition disabled:opacity-50 active:scale-95"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

function ControlLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      aria-label={label}
      className="h-10 px-3 rounded-xl glass-light text-apple-600 text-sm font-medium inline-flex items-center gap-1.5 hover:bg-apple-50 active:bg-apple-100 shadow-glass transition active:scale-95"
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function Spinner() {
  return <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
}
