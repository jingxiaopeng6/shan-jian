/**
 * JourneyPage — 山见档案（个人旅行记录）
 *
 * 复用 travelLog + trackLog + attractions/nfcPoints 数据源
 * 展示：总览统计 / 已探索列表 / 未探索列表 / 旅行卡
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { attractions } from '../data/attractions'
import { nfcPoints } from '../data/nfcPoints'
import { getVisits, getVisit, type VisitRecord } from '../services/travelLog'
import { getTrackStats, clearTrack } from '../services/trackLog'

export default function JourneyPage() {
  const navigate = useNavigate()
  const [, forceUpdate] = useState(0)
  const [showCard, setShowCard] = useState(false)

  const stats = useMemo(() => {
    const visits = getVisits()
    const track = getTrackStats()
    const totalAttractions = nfcPoints.length // 有 NFC 的景点总数
    const exploredCount = nfcPoints.filter((p) => visits.some((v) => v.attractionId === p.attractionId)).length
    const badgeCount = visits.filter((v) => v.badge).length
    const lastVisit = visits.length > 0
      ? visits.reduce((a, b) => (a.timestamp > b.timestamp ? a : b))
      : null
    const firstVisit = visits.length > 0
      ? visits.reduce((a, b) => (a.timestamp < b.timestamp ? a : b))
      : null
    return {
      visits,
      track,
      totalAttractions,
      exploredCount,
      progress: totalAttractions > 0 ? Math.round((exploredCount / totalAttractions) * 100) : 0,
      badgeCount,
      lastVisit,
      firstVisit,
    }
  }, [])

  const refresh = () => forceUpdate((n) => n + 1)

  return (
    <div className="min-h-screen bg-forest-50">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 bg-forest-900 text-white px-4 py-3 shadow-soft">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sand-200 text-sm">← 返回</Link>
          <h1 className="font-serif text-lg font-semibold">山见档案</h1>
          <Link to="/map" className="text-sand-200 text-sm">地图</Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* 总览卡片 */}
        <div className="rounded-2xl bg-gradient-to-br from-forest-800 to-forest-900 text-white p-5 shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-xs text-sand-300">武功山探索度</div>
              <div className="text-2xl font-bold mt-1">{stats.exploredCount} / {stats.totalAttractions}</div>
              <div className="text-xs text-sand-300 mt-0.5">{stats.progress}% · 每一次抵达，都成为你的旅行记录</div>
            </div>
            <div className="w-16 h-16 relative">
              <svg viewBox="0 0 36 36" className="w-16 h-16 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e6d2a9" strokeWidth="3"
                  strokeDasharray={`${(stats.progress / 100) * 94.2} 94.2`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{stats.progress}%</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-white/10 py-2">
              <div className="text-lg font-bold">{stats.badgeCount}</div>
              <div className="text-[10px] text-sand-300">徽章</div>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <div className="text-lg font-bold">{stats.track.totalDistanceKm.toFixed(1)}</div>
              <div className="text-[10px] text-sand-300">轨迹 km</div>
            </div>
            <div className="rounded-lg bg-white/10 py-2">
              <div className="text-lg font-bold">{stats.track.pointCount}</div>
              <div className="text-[10px] text-sand-300">轨迹点</div>
            </div>
          </div>
          {stats.lastVisit && (
            <div className="mt-3 text-[11px] text-sand-300 text-center">
              最近打卡：{new Date(stats.lastVisit.timestamp).toLocaleString('zh-CN')}
            </div>
          )}
        </div>

        {/* 商业价值说明 */}
        <div className="rounded-xl bg-sand-50 border border-sand-200 p-3">
          <p className="text-[11px] text-stone2-500 leading-relaxed text-center">
            游客行为通过空间化记录沉淀为个人旅行资产
          </p>
        </div>

        {/* 生成旅行卡按钮 */}
        <button
          onClick={() => setShowCard(!showCard)}
          className="w-full h-12 rounded-xl bg-sand-500 text-white text-sm font-medium hover:bg-sand-600 transition flex items-center justify-center gap-2"
        >
          <span className="text-lg">🗺️</span>
          {showCard ? '收起旅行卡' : '生成我的旅行卡'}
        </button>

        {/* 旅行纪念卡 */}
        {showCard && <TravelCard stats={stats} firstVisit={stats.firstVisit} />}

        {/* 已探索景点 + 徽章体系 */}
        <div className="rounded-2xl bg-white border border-forest-100 shadow-soft p-4">
          <h2 className="text-sm font-medium text-forest-800 mb-3 flex items-center gap-1.5">
            <span>✓</span> 已探索景点 ({stats.exploredCount})
          </h2>
          {stats.exploredCount === 0 ? (
            <p className="text-xs text-stone2-400">还没有打卡记录，去 <Link to="/nfc" className="text-forest-600 underline">NFC 打卡</Link> 开启你的第一段旅程吧！</p>
          ) : (
            <div className="space-y-2">
              {nfcPoints
                .filter((p) => stats.visits.some((v) => v.attractionId === p.attractionId))
                .map((p) => {
                  const visit = getVisit(p.attractionId)!
                  const attraction = attractions.find((a) => a.id === p.attractionId)
                  return (
                    <button
                      key={p.nfcId}
                      onClick={() => navigate(`/map`)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-forest-50 hover:bg-forest-100 transition text-left"
                    >
                      <span className="text-2xl">{p.badgeIcon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-forest-800">{p.name}</div>
                        <div className="text-[10px] text-stone2-500">
                          {attraction?.elevation ?? '-'} m · {new Date(visit.timestamp).toLocaleDateString('zh-CN')}
                        </div>
                        <div className="text-[9px] text-stone2-400 mt-0.5">{p.badgeDescription}</div>
                      </div>
                      <span className="text-[10px] text-forest-600 bg-forest-100 px-2 py-0.5 rounded-full whitespace-nowrap">
                        {p.badge}
                      </span>
                    </button>
                  )
                })}
            </div>
          )}
        </div>

        {/* 未探索景点 */}
        {stats.exploredCount < stats.totalAttractions && (
          <div className="rounded-2xl bg-white border border-stone-200 shadow-soft p-4">
            <h2 className="text-sm font-medium text-stone2-600 mb-3 flex items-center gap-1.5">
              <span>🔒</span> 待探索景点 ({stats.totalAttractions - stats.exploredCount})
            </h2>
            <div className="space-y-2">
              {nfcPoints
                .filter((p) => !stats.visits.some((v) => v.attractionId === p.attractionId))
                .map((p) => {
                  const attraction = attractions.find((a) => a.id === p.attractionId)
                  return (
                    <div key={p.nfcId} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-stone-50">
                      <span className="text-2xl opacity-30">🔒</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-stone2-500">{p.name}</div>
                        <div className="text-[10px] text-stone2-400">
                          {attraction?.elevation ?? '-'} m · {p.description}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* 轨迹管理 */}
        {stats.track.pointCount > 0 && (
          <div className="rounded-2xl bg-white border border-forest-100 shadow-soft p-4">
            <h2 className="text-sm font-medium text-forest-800 mb-2">GPS 轨迹</h2>
            <div className="text-xs text-stone2-500 mb-3">
              {stats.track.totalDistanceKm.toFixed(2)} km · {stats.track.pointCount} 个点
              {stats.track.startTime && ` · ${new Date(stats.track.startTime).toLocaleDateString('zh-CN')} 起`}
            </div>
            <div className="flex gap-2">
              <Link to="/map" className="flex-1 h-9 rounded-lg bg-forest-700 text-white text-xs font-medium flex items-center justify-center hover:bg-forest-800">
                在地图中查看
              </Link>
              <button
                onClick={() => { clearTrack(); refresh() }}
                className="h-9 px-3 rounded-lg border border-red-200 text-red-600 text-xs hover:bg-red-50"
              >
                清空轨迹
              </button>
            </div>
          </div>
        )}

        {/* 底部导航 */}
        <div className="flex justify-center gap-3 pb-6">
          <Link to="/map" className="text-xs text-forest-600 hover:text-forest-800">地图</Link>
          <Link to="/ar" className="text-xs text-forest-600 hover:text-forest-800">AR 看山</Link>
          <Link to="/nfc" className="text-xs text-forest-600 hover:text-forest-800">NFC 打卡</Link>
          <Link to="/viewshed" className="text-xs text-forest-600 hover:text-forest-800">视域分析</Link>
        </div>
      </div>
    </div>
  )
}

/** 旅行纪念卡组件 */
function TravelCard({ stats, firstVisit }: { stats: any; firstVisit: VisitRecord | null }) {
  const dateStr = firstVisit
    ? new Date(firstVisit.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('zh-CN')

  const exploredNames = nfcPoints
    .filter((p) => stats.visits.some((v: VisitRecord) => v.attractionId === p.attractionId))
    .map((p) => p.name)

  return (
    <div className="rounded-2xl overflow-hidden shadow-soft border border-forest-200" data-testid="travel-card">
      {/* 卡片背景 */}
      <div className="bg-gradient-to-b from-forest-800 via-forest-900 to-sand-900 text-white p-6 relative">
        {/* 装饰山脉 */}
        <div className="absolute bottom-0 left-0 right-0 opacity-10">
          <svg viewBox="0 0 400 100" className="w-full h-20">
            <path d="M0 100 L50 40 L90 70 L130 20 L170 60 L210 30 L250 70 L290 25 L330 55 L400 35 L400 100 Z" fill="white" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* 品牌 */}
          <div className="text-center mb-4">
            <div className="font-serif text-2xl font-bold text-sand-200">山见</div>
            <div className="text-[10px] text-sand-400 mt-0.5">看见风景，也看懂风景</div>
          </div>

          {/* 标题 */}
          <div className="text-center mb-4">
            <div className="text-xs text-sand-300">武功山旅行纪念卡</div>
            <div className="text-[10px] text-sand-400 mt-0.5">{dateStr}</div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="text-center rounded-lg bg-white/10 py-2">
              <div className="text-xl font-bold">{stats.exploredCount}</div>
              <div className="text-[9px] text-sand-300">景点</div>
            </div>
            <div className="text-center rounded-lg bg-white/10 py-2">
              <div className="text-xl font-bold">{stats.badgeCount}</div>
              <div className="text-[9px] text-sand-300">徽章</div>
            </div>
            <div className="text-center rounded-lg bg-white/10 py-2">
              <div className="text-xl font-bold">{stats.track.totalDistanceKm.toFixed(1)}</div>
              <div className="text-[9px] text-sand-300">km</div>
            </div>
          </div>

          {/* 探索地点 */}
          {exploredNames.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] text-sand-400 mb-1">探索地点</div>
              <div className="flex flex-wrap gap-1">
                {exploredNames.map((name, i) => (
                  <span key={i} className="text-[10px] text-sand-200 bg-white/10 rounded-full px-2 py-0.5">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 徽章 */}
          {stats.visits.length > 0 && (
            <div className="flex justify-center gap-2 mb-3">
              {stats.visits.filter((v: VisitRecord) => v.badgeIcon).map((v: VisitRecord) => (
                <div key={v.visitId} className="flex flex-col items-center">
                  <span className="text-xl">{v.badgeIcon}</span>
                  <span className="text-[8px] text-sand-300 mt-0.5">{v.badge}</span>
                </div>
              ))}
            </div>
          )}

          {/* 路线 */}
          {exploredNames.length > 0 && (
            <div className="mb-3 text-center">
              <div className="text-[9px] text-sand-400 mb-1">探索路线</div>
              <div className="text-[10px] text-sand-200">
                {exploredNames.join(' → ')}
              </div>
            </div>
          )}

          {/* 进度条 */}
          <div className="rounded-full bg-white/10 h-2 overflow-hidden">
            <div className="h-full bg-sand-400 rounded-full" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="text-center text-[10px] text-sand-300 mt-1">
            探索进度 {stats.progress}%
          </div>
        </div>
      </div>
    </div>
  )
}
