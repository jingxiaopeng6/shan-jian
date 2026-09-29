import { useState, useEffect } from 'react'
import PageContainer from '../components/PageContainer'
import CesiumMap from '../components/CesiumMap'
import { Link, useNavigate } from 'react-router-dom'
import { useGeolocation } from '../hooks/useGeolocation'
import { attractions } from '../data/attractions'
import { calculateDistanceKm } from '../utils/geoUtils'
import { getPeakById } from '../data/mock'
import { hasVisited } from '../services/travelLog'
import { findNfcByAttraction } from '../data/nfcPoints'
import { getTrackPoints } from '../services/trackLog'

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

  // 读取 GPS 轨迹点（传给 CesiumMap 显示）
  const trackPoints = getTrackPoints().map((p) => ({ lat: p.lat, lng: p.lng }))

  const selectedPeak = selectedPeakId ? getPeakById(selectedPeakId) : null
  const selectedVisited = selectedPeakId ? (() => {
    const nfcPoint = findNfcByAttraction(selectedPeakId)
    return nfcPoint ? hasVisited(nfcPoint.attractionId) : false
  })() : false

  const userPosition = geo.reading
    ? { lat: geo.reading.latitude, lng: geo.reading.longitude }
    : null

  // 起点：GPS 位置或默认位置
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
    <div className="relative">
      <div className="w-full relative h-[60vh] sm:h-[68vh]">
        <CesiumMap
          userPosition={userPosition}
          route={route}
          onPeakSelect={(id) => setSelectedPeakId(id)}
          trackPoints={trackPoints}
        />

        {/* 浮动工具栏 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl flex gap-2 pointer-events-none">
          <button
            onClick={handleLocate}
            disabled={locating}
            className="pointer-events-auto inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-full bg-forest-700/90 text-white text-xs sm:text-sm hover:bg-forest-800 disabled:opacity-60 backdrop-blur shadow-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>
            {locating ? '定位中…' : '定位'}
          </button>
          <Link
            to="/ar"
            className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-forest-700/90 text-white text-xs sm:text-sm hover:bg-forest-800 backdrop-blur shadow-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3"/></svg>
            AR 看山
          </Link>
          <Link
            to="/viewshed"
            className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-white/90 text-forest-800 text-xs sm:text-sm hover:bg-white border border-forest-100 backdrop-blur shadow-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20l10-7 10 7"/><circle cx="12" cy="9" r="4"/></svg>
            视域分析
          </Link>
        </div>

        {/* 产品提示（3 秒后自动消失） */}
        {showHint && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-forest-800/80 text-white text-xs rounded-full backdrop-blur transition-opacity">
            探索一座山，从地图开始。
          </div>
        )}

        {/* 路线选择 + 距离 */}
        {target && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-2 bg-white/90 backdrop-blur rounded-xl shadow-soft border border-forest-100 text-xs">
            <span className="text-forest-800 font-medium">→ {target.name}</span>
            <span className="text-amber-600 font-semibold">{distanceKm.toFixed(2)} km</span>
            <span className="text-stone2-400 text-[10px]">（示意直线）</span>
            <button
              onClick={() => setTargetId('')}
              className="text-stone2-400 hover:text-red-500 ml-1"
            >✕</button>
          </div>
        )}

        {/* 定位状态提示 */}
        {geo.status === 'denied' && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-red-500/90 text-white text-xs rounded-full">
            定位权限被拒绝
          </div>
        )}
        {geo.status === 'error' && geo.error && (
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 bg-amber-500/90 text-white text-xs rounded-full">
            {geo.error.message}
          </div>
        )}

        {/* 山峰信息卡弹窗（点击地图山峰后显示） */}
        {selectedPeak && (
          <div className="absolute left-1/2 -translate-x-1/2 bottom-3 z-30 w-[92%] max-w-md rounded-xl bg-white/95 backdrop-blur border border-forest-200 shadow-soft p-4 pointer-events-auto">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-serif text-forest-900 text-lg font-semibold">{selectedPeak.name}</div>
                <div className="text-xs text-sand-600 mt-0.5">{selectedPeak.pinyin} · {selectedPeak.elevation} m</div>
              </div>
              <button
                onClick={() => setSelectedPeakId(null)}
                className="text-stone2-400 hover:text-red-500 text-sm leading-none"
              >✕</button>
            </div>
            <p className="mt-2 text-xs text-stone2-600 leading-5 line-clamp-2">{selectedPeak.description}</p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => navigate(`/ar?peakId=${selectedPeak.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg bg-forest-700 text-white text-xs font-medium hover:bg-forest-800 transition"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3"/></svg>
                进入 AR 看山
              </button>
              <button
                onClick={() => navigate(`/peak/${selectedPeak.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-forest-200 bg-white text-forest-800 text-xs font-medium hover:bg-forest-50 transition"
              >
                查看详情
              </button>
              <button
                onClick={() => navigate(`/viewshed?peakId=${selectedPeak.id}`)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-lg border border-forest-200 bg-white text-forest-800 text-xs font-medium hover:bg-forest-50 transition"
              >
                视域分析
              </button>
            </div>
            <div className="mt-2 flex items-center gap-2">
              {selectedVisited && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-forest-100 text-forest-700 text-[10px] rounded-full">
                  ✓ 已打卡
                </span>
              )}
              <button
                onClick={() => navigate('/nfc')}
                className="text-[11px] text-forest-600 hover:text-forest-800 underline"
              >
                NFC 打卡 →
              </button>
            </div>
          </div>
        )}

        {/* 左下说明卡 */}
        <div className="absolute left-3 bottom-3 z-20 max-w-[60%] rounded-xl bg-white/85 backdrop-blur border border-forest-100 px-3 py-2 text-[11px] sm:text-xs text-forest-800 shadow-soft">
          <div className="font-medium mb-0.5">武功山 · 江西萍乡</div>
          <div className="text-stone2-500">罗霄山脉北支 · 主峰金顶 1918 m</div>
          <div className="mt-1 flex items-center gap-1 text-[10px] text-forest-600">
            <span className="w-1.5 h-1.5 rounded-full bg-forest-500" />
            真实 DEM 地形 · ASTER GDEM · 30m
          </div>
        </div>
      </div>

      <PageContainer className="pt-4">
        <section className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-forest-800 text-lg sm:text-xl font-semibold">
              主要山峰导览
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone2-500">
              点击地图标注或下方卡片进入山峰详情。
            </p>
          </div>
          <Link
            to="/"
            className="text-xs text-forest-600 hover:text-forest-800 self-center"
          >
            返回首页
          </Link>
        </section>

        {/* 路线导航：选择目标景点 */}
        <section className="mt-4 rounded-xl border border-forest-100 bg-forest-50/50 p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forest-600"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            <h3 className="font-medium text-forest-800 text-sm">路线导航（示意）</h3>
          </div>
          <div className="flex gap-2">
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="flex-1 px-3 py-2 rounded-lg border border-forest-200 bg-white text-sm text-forest-800 focus:outline-none focus:ring-2 focus:ring-forest-300"
            >
              <option value="">选择目标景点…</option>
              {attractions.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          {target && (
            <p className="mt-2 text-xs text-stone2-500">
              直线距离 {distanceKm.toFixed(2)} km · 此为 MVP 示意路线，非真实步行导航
            </p>
          )}
        </section>
      </PageContainer>
    </div>
  )
}
