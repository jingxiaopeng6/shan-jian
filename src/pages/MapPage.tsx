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
import IconButton from '../components/ui/IconButton'
import Badge from '../components/ui/Badge'
import { ChevronLeft, MapPin, Camera, Crosshair, Navigation, X } from 'lucide-react'

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
    <div className="fixed inset-0 bg-ink">
      {/* 全屏地图 */}
      <CesiumMap
        userPosition={userPosition}
        route={route}
        onPeakSelect={(id) => setSelectedPeakId(id)}
        trackPoints={trackPoints}
      />

      {/* 顶部栏 */}
      <div className="absolute top-0 left-0 right-0 z-20 pt-safe">
        <div className="flex items-center justify-between px-3 pt-3">
          {/* 返回 + GIS 标签 */}
          <div className="flex items-center gap-2">
            <IconButton
              icon={<ChevronLeft size={20} />}
              variant="glass"
              size="sm"
              label="返回"
              onClick={() => navigate('/')}
            />
            <div className="hidden sm:flex flex-col gap-0.5 px-2 py-1 glass-panel rounded-lg">
              <span className="text-3xs text-rock-300 tracking-wider font-mono">3D TERRAIN</span>
              <span className="text-3xs text-rock-400 tracking-wider">ASTER GDEM · 30m</span>
            </div>
          </div>

          {/* 右侧操作 */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleLocate}
              disabled={locating}
              className="glass-panel text-mist h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium hover:bg-ink-100 transition disabled:opacity-50"
            >
              {locating ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Crosshair size={14} />}
              定位
            </button>
            <Link to="/ar" className="glass-panel text-mist h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium hover:bg-ink-100 transition">
              <Camera size={14} />
              AR
            </Link>
            <Link to="/viewshed" className="glass-panel text-mist h-9 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-medium hover:bg-ink-100 transition">
              视域
            </Link>
          </div>
        </div>

        {/* 提示 */}
        {showHint && (
          <div className="mt-2 flex justify-center animate-fade-out">
            <span className="text-2xs text-rock-300 px-3 py-1 glass-panel rounded-full">
              探索一座山，从地图开始
            </span>
          </div>
        )}

        {/* 路线距离 */}
        {target && (
          <div className="mt-2 flex justify-center">
            <div className="glass-panel rounded-xl px-3 py-2 flex items-center gap-2 text-xs text-mist">
              <Navigation size={12} className="text-gold-200" />
              <span className="font-medium">{target.name}</span>
              <span className="text-gold-200 font-semibold">{distanceKm.toFixed(2)} km</span>
              <span className="text-3xs text-rock-400">示意直线</span>
              <button onClick={() => setTargetId('')} className="text-rock-400 hover:text-red-400">
                <X size={12} />
              </button>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {geo.status === 'denied' && (
          <div className="mt-2 flex justify-center">
            <span className="text-2xs text-red-400 px-3 py-1 glass-panel rounded-full">定位权限被拒绝</span>
          </div>
        )}
      </div>

      {/* 底部路线选择器（无山峰选中时显示） */}
      {!selectedPeak && (
        <div className="absolute bottom-0 left-0 right-0 z-20 pb-safe">
          <div className="px-4 pb-3">
            <div className="glass-panel rounded-xl p-3">
              <div className="flex items-center gap-2 mb-2">
                <Navigation size={14} className="text-gold-200" />
                <span className="text-2xs text-rock-300 tracking-wider">路线导航</span>
              </div>
              <div className="flex gap-2">
                <select
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-ink-200 text-mist text-xs border border-white/10 focus:outline-none focus:border-gold-200/30"
                >
                  <option value="">选择目标景点</option>
                  {attractions.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              {target && (
                <p className="mt-1.5 text-3xs text-rock-400">直线距离 {distanceKm.toFixed(2)} km · MVP 示意路线</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 山峰信息 BottomSheet */}
      <BottomSheet open={!!selectedPeak} onClose={() => setSelectedPeakId(null)} dark>
        {selectedPeak && (
          <div className="space-y-4">
            {/* 标题 */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-serif text-2xl text-mist font-semibold">{selectedPeak.name}</h2>
                <p className="text-2xs text-rock-300 tracking-wider mt-0.5">{selectedPeak.pinyin?.toUpperCase()}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-serif text-gold-200">{selectedPeak.elevation}</div>
                <div className="text-3xs text-rock-400">m</div>
              </div>
            </div>

            {/* 距离 */}
            {userPosition && (() => {
              const dist = calculateDistanceKm(userPosition, { lat: selectedPeak.lat, lng: selectedPeak.lng })
              return (
                <div className="flex items-center gap-3 text-xs text-rock-300">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} /> {dist.toFixed(1)} km
                  </span>
                  {selectedVisited && <Badge tone="gold">已打卡</Badge>}
                </div>
              )
            })()}

            {/* 简介 */}
            <p className="text-xs text-rock-300 leading-relaxed">{selectedPeak.description}</p>

            {/* 操作按钮 */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => navigate(`/ar?peakId=${selectedPeak.id}`)}
                className="h-10 rounded-xl bg-gold-200 text-ink text-xs font-medium hover:bg-gold-100 transition flex items-center justify-center gap-1.5"
              >
                <Camera size={14} /> AR 看山
              </button>
              <button
                onClick={() => navigate(`/viewshed?peakId=${selectedPeak.id}`)}
                className="h-10 rounded-xl glass-panel text-mist text-xs font-medium hover:bg-ink-100 transition flex items-center justify-center gap-1.5 border border-white/10"
              >
                视域分析
              </button>
              <button
                onClick={() => navigate(`/peak/${selectedPeak.id}`)}
                className="h-10 rounded-xl glass-panel text-mist text-xs font-medium hover:bg-ink-100 transition flex items-center justify-center gap-1.5 border border-white/10"
              >
                详情
              </button>
            </div>

            {/* NFC 链接 */}
            <button
              onClick={() => navigate('/nfc')}
              className="w-full text-center text-2xs text-rock-400 hover:text-rock-300 transition py-1"
            >
              探索印记 →
            </button>
          </div>
        )}
      </BottomSheet>
    </div>
  )
}
