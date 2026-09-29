/**
 * JourneyPage — 山见档案（个人旅行记录）
 *
 * 复用 travelLog + trackLog + attractions/nfcPoints 数据源
 * 展示：总览统计 / 已探索列表 / 未探索列表 / 旅行卡
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Map, Footprints, Award, Route, Download, ChevronRight, Lock, Trash2 } from 'lucide-react'
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
    <div className="min-h-screen bg-ink text-mist">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 glass-panel px-4 py-3 safe-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/" className="text-mist/70 text-sm inline-flex items-center gap-1 hover:text-mist transition">
            <ArrowLeft size={14} />
            返回
          </Link>
          <h1 className="font-serif text-base font-semibold tracking-wide">山见档案</h1>
          <Link to="/nfc" className="text-gold text-sm hover:text-gold/80 transition">
            打卡
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* 副标题 */}
        <div className="text-center">
          <p className="text-xs text-rock tracking-wider">你的武功山探索记录</p>
        </div>

        {/* 探索进度总览 */}
        <div className="glass-panel rounded-3xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[10px] text-rock tracking-wider uppercase mb-1">探索进度</div>
              <div className="text-4xl font-bold text-mist tabular-nums">
                {stats.progress}<span className="text-xl text-rock">%</span>
              </div>
              <div className="text-xs text-gold mt-1 tabular-nums">{stats.exploredCount} / {stats.totalAttractions}</div>
            </div>
            {/* 进度环 */}
            <div className="w-20 h-20 relative">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#D7A85C" strokeWidth="2.5"
                  strokeDasharray={`${(stats.progress / 100) * 94.2} 94.2`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gold">{stats.progress}%</span>
            </div>
          </div>

          {/* 统计网格 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <StatCard icon={<Route size={13} />} label="探索距离" value={`${stats.track.totalDistanceKm.toFixed(1)}`} unit="km" />
            <StatCard icon={<Map size={13} />} label="探索山峰" value={`${stats.exploredCount}`} unit="座" />
            <StatCard icon={<Award size={13} />} label="探索印记" value={`${stats.badgeCount}`} unit="枚" />
            <StatCard icon={<Footprints size={13} />} label="GPS 轨迹" value={`${stats.track.pointCount}`} unit="点" />
          </div>

          {stats.lastVisit && (
            <div className="mt-4 pt-3 border-t border-white/10 text-[11px] text-rock/70 text-center">
              最近打卡：{new Date(stats.lastVisit.timestamp).toLocaleString('zh-CN')}
            </div>
          )}
        </div>

        {/* 生成旅行卡按钮 */}
        <button
          onClick={() => setShowCard(!showCard)}
          className="w-full h-12 rounded-full bg-gold text-ink text-sm font-semibold hover:bg-gold/90 transition active:scale-95 inline-flex items-center justify-center gap-2"
        >
          <Download size={15} />
          {showCard ? '收起旅行卡' : '生成旅行海报'}
        </button>

        {/* 旅行纪念卡 */}
        {showCard && <TravelCard stats={stats} firstVisit={stats.firstVisit} />}

        {/* 已探索景点 */}
        <div className="glass-panel rounded-2xl p-4">
          <h2 className="text-sm font-medium text-mist mb-3 inline-flex items-center gap-1.5">
            <Check size={14} className="text-moss" />
            已探索 ({stats.exploredCount})
          </h2>
          {stats.exploredCount === 0 ? (
            <div className="py-4">
              <p className="text-xs text-rock/60">还没有打卡记录</p>
              <Link to="/nfc" className="mt-1 inline-flex items-center gap-1 text-xs text-gold hover:underline">
                去探索印记开启第一段旅程 <ChevronRight size={11} />
              </Link>
            </div>
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition text-left"
                    >
                      <span className="text-2xl">{p.badgeIcon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-mist">{p.name}</div>
                        <div className="text-[10px] text-rock/70">
                          {attraction?.elevation ?? '-'} m · {new Date(visit.timestamp).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <span className="text-[10px] text-gold bg-gold/10 px-2 py-0.5 rounded-full whitespace-nowrap border border-gold/20">
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
          <div className="glass-panel rounded-2xl p-4">
            <h2 className="text-sm font-medium text-mist/80 mb-3 inline-flex items-center gap-1.5">
              <Lock size={14} className="text-rock" />
              待探索 ({stats.totalAttractions - stats.exploredCount})
            </h2>
            <div className="space-y-2">
              {nfcPoints
                .filter((p) => !stats.visits.some((v) => v.attractionId === p.attractionId))
                .map((p) => {
                  const attraction = attractions.find((a) => a.id === p.attractionId)
                  return (
                    <div key={p.nfcId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-white/[0.03]">
                      <span className="text-2xl opacity-20">{p.badgeIcon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-rock">{p.name}</div>
                        <div className="text-[10px] text-rock/60">
                          {attraction?.elevation ?? '-'} m · {p.description}
                        </div>
                      </div>
                      <Lock size={12} className="text-rock/40" />
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* GPS 轨迹 */}
        {stats.track.pointCount > 0 && (
          <div className="glass-panel rounded-2xl p-4">
            <h2 className="text-sm font-medium text-mist mb-2 inline-flex items-center gap-1.5">
              <Footprints size={14} className="text-moss" />
              GPS 轨迹
            </h2>
            <div className="text-xs text-rock mb-3">
              {stats.track.totalDistanceKm.toFixed(2)} km · {stats.track.pointCount} 个点
              {stats.track.startTime && ` · ${new Date(stats.track.startTime).toLocaleDateString('zh-CN')} 起`}
            </div>
            <div className="flex gap-2">
              <Link to="/map" className="flex-1 h-9 rounded-full bg-gold text-ink text-xs font-medium inline-flex items-center justify-center hover:bg-gold/90 transition">
                在地图中查看
              </Link>
              <button
                onClick={() => { clearTrack(); refresh() }}
                className="h-9 px-3 rounded-full border border-red-500/30 text-red-400 text-xs hover:bg-red-500/10 inline-flex items-center gap-1"
              >
                <Trash2 size={11} />
                清空
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** 统计小卡片 */
function StatCard({ icon, label, value, unit }: { icon: React.ReactNode; label: string; value: string; unit: string }) {
  return (
    <div className="rounded-xl bg-white/5 py-2.5 px-1" title={label}>
      <div className="flex items-center justify-center text-rock/70 mb-1">{icon}</div>
      <div className="text-mist font-bold text-sm tabular-nums">{value}</div>
      <div className="text-[9px] text-rock/60">{unit}</div>
    </div>
  )
}

function Check({ size, className }: { size: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

/** 旅行纪念卡组件 */
function TravelCard({ stats, firstVisit }: { stats: any; firstVisit: VisitRecord | null }) {
  const dateStr = firstVisit
    ? new Date(firstVisit.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, ' · ')
    : new Date().toLocaleDateString('zh-CN').replace(/\//g, ' · ')

  const exploredNames = nfcPoints
    .filter((p) => stats.visits.some((v: VisitRecord) => v.attractionId === p.attractionId))
    .map((p) => p.name)

  return (
    <div className="rounded-3xl overflow-hidden glass-panel" data-testid="travel-card">
      {/* 卡片背景 */}
      <div className="relative p-6 overflow-hidden">
        {/* 装饰山脉 */}
        <div className="absolute bottom-0 left-0 right-0 opacity-10 pointer-events-none">
          <svg viewBox="0 0 400 100" className="w-full h-20">
            <path d="M0 100 L50 40 L90 70 L130 20 L170 60 L210 30 L250 70 L290 25 L330 55 L400 35 L400 100 Z" fill="#D7A85C" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* 品牌 */}
          <div className="text-center mb-5">
            <div className="font-serif text-3xl font-bold text-mist tracking-wider">山见</div>
            <div className="text-[10px] text-rock mt-1">看见风景，也看懂风景</div>
          </div>

          {/* 标题 */}
          <div className="text-center mb-5">
            <div className="text-sm text-gold font-medium">我的武功山</div>
            <div className="text-[10px] text-rock mt-0.5 tabular-nums">{dateStr}</div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="text-center rounded-xl bg-white/10 py-3">
              <div className="text-2xl font-bold text-mist tabular-nums">{stats.track.totalDistanceKm.toFixed(1)}</div>
              <div className="text-[9px] text-rock mt-0.5">km 距离</div>
            </div>
            <div className="text-center rounded-xl bg-white/10 py-3">
              <div className="text-2xl font-bold text-mist tabular-nums">{stats.exploredCount}</div>
              <div className="text-[9px] text-rock mt-0.5">山峰</div>
            </div>
            <div className="text-center rounded-xl bg-white/10 py-3">
              <div className="text-2xl font-bold text-gold tabular-nums">{stats.badgeCount}</div>
              <div className="text-[9px] text-rock mt-0.5">印记</div>
            </div>
          </div>

          {/* 探索地点 */}
          {exploredNames.length > 0 && (
            <div className="mb-4">
              <div className="text-[9px] text-rock/60 mb-1.5 tracking-wider">探索路线</div>
              <div className="text-[11px] text-mist/90 leading-relaxed">
                {exploredNames.map((name, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-gold mx-1">→</span>}
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 徽章 */}
          {stats.visits.length > 0 && (
            <div className="flex justify-center gap-3 mb-4">
              {stats.visits.filter((v: VisitRecord) => v.badgeIcon).map((v: VisitRecord) => (
                <div key={v.visitId} className="flex flex-col items-center">
                  <span className="text-xl">{v.badgeIcon}</span>
                  <span className="text-[8px] text-rock mt-0.5">{v.badge}</span>
                </div>
              ))}
            </div>
          )}

          {/* 进度条 */}
          <div className="rounded-full bg-white/10 h-1.5 overflow-hidden">
            <div className="h-full bg-gold rounded-full transition-all duration-500" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="text-center text-[10px] text-gold mt-1.5">
            探索进度 {stats.progress}%
          </div>
        </div>
      </div>
    </div>
  )
}
