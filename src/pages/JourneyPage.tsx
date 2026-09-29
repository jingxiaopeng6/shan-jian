/**
 * JourneyPage — 山见档案（个人旅行记录）
 *
 * 复用 travelLog + trackLog + attractions/nfcPoints 数据源
 * 展示：总览统计 / 已探索列表 / 未探索列表 / 旅行卡
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Map, Footprints, Award, Route, Download, ChevronRight, Lock, Trash2, Check } from 'lucide-react'
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
    <div className="min-h-screen bg-cheese text-ink">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5 safe-top pb-20">

        {/* 副标题 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-100 text-apple-700 text-overline border border-apple-400/30">
            <Footprints size={11} />
            山见档案
          </div>
          <p className="mt-3 font-serif text-2xl text-forest-700 font-bold">你的武功山探索记录</p>
        </div>

        {/* 探索进度总览 —— 主卡 */}
        <div className="glass-light rounded-3xl p-5 shadow-glass">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-overline text-apple-600 tracking-wider font-semibold mb-1">探索进度</div>
              <div className="text-5xl font-bold text-forest-700 tabular-nums leading-none">
                {stats.progress}<span className="text-2xl text-rock-400">%</span>
              </div>
              <div className="text-sm text-apple-600 mt-1 tabular-nums font-medium">{stats.exploredCount} / {stats.totalAttractions}</div>
            </div>
            {/* 进度环 —— 青苹果色调 */}
            <div className="w-20 h-20 relative">
              <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(141,184,56,0.15)" strokeWidth="2.5" />
                <circle cx="18" cy="18" r="15" fill="none" stroke="#8DB838" strokeWidth="2.5"
                  strokeDasharray={`${(stats.progress / 100) * 94.2} 94.2`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-apple-600">{stats.progress}%</span>
            </div>
          </div>

          {/* 统计网格 */}
          <div className="grid grid-cols-4 gap-2 text-center">
            <StatCard icon={<Route size={13} />} label="探索距离" value={`${stats.track.totalDistanceKm.toFixed(1)}`} unit="km" />
            <StatCard icon={<Map size={13} />} label="已访景点" value={`${stats.exploredCount}`} unit="处" />
            <StatCard icon={<Award size={13} />} label="探索印记" value={`${stats.badgeCount}`} unit="枚" />
            <StatCard icon={<Footprints size={13} />} label="我的足迹" value={`${stats.track.pointCount}`} unit="点" />
          </div>

          {stats.lastVisit && (
            <div className="mt-4 pt-3 border-t border-apple-400/15 text-caption text-rock-400 text-center">
              最近打卡：{new Date(stats.lastVisit.timestamp).toLocaleString('zh-CN')}
            </div>
          )}
        </div>

        {/* 生成旅行卡按钮 —— Primary 青苹果 */}
        <button
          onClick={() => setShowCard(!showCard)}
          className="w-full h-12 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 transition active:scale-95 inline-flex items-center justify-center gap-2 shadow-apple"
        >
          <Download size={15} />
          {showCard ? '收起旅行卡' : '生成旅行海报'}
        </button>

        {/* 旅行纪念卡 */}
        {showCard && <TravelCard stats={stats} firstVisit={stats.firstVisit} />}

        {/* 已探索景点 */}
        <div className="glass-light rounded-2xl p-4 shadow-card">
          <h2 className="text-sm font-semibold text-forest-600 mb-3 inline-flex items-center gap-1.5">
            <Check size={14} className="text-apple-500" />
            已探索 ({stats.exploredCount})
          </h2>
          {stats.exploredCount === 0 ? (
            <div className="py-4">
              <p className="text-sm text-rock-400">还没有打卡记录</p>
              <Link to="/nfc" className="mt-1 inline-flex items-center gap-1 text-sm text-apple-600 hover:underline">
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cheese-50 hover:bg-apple-50 transition text-left border border-apple-400/15"
                    >
                      <span className="text-2xl">{p.badgeIcon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-ink">{p.name}</div>
                        <div className="text-overline text-rock-400">
                          {attraction?.elevation ?? '-'} m · {new Date(visit.timestamp).toLocaleDateString('zh-CN')}
                        </div>
                      </div>
                      <span className="text-overline text-apple-700 bg-apple-100 px-2 py-0.5 rounded-full whitespace-nowrap border border-apple-400/30 font-medium">
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
          <div className="glass-light rounded-2xl p-4 shadow-card">
            <h2 className="text-sm font-semibold text-ink-50 mb-3 inline-flex items-center gap-1.5">
              <Lock size={14} className="text-rock-400" />
              待探索 ({stats.totalAttractions - stats.exploredCount})
            </h2>
            <div className="space-y-2">
              {nfcPoints
                .filter((p) => !stats.visits.some((v) => v.attractionId === p.attractionId))
                .map((p) => {
                  const attraction = attractions.find((a) => a.id === p.attractionId)
                  return (
                    <div key={p.nfcId} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-cheese-50/50 border border-apple-400/10">
                      <span className="text-2xl opacity-30">{p.badgeIcon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-rock-400">{p.name}</div>
                        <div className="text-overline text-rock-400">
                          {attraction?.elevation ?? '-'} m · {p.description}
                        </div>
                      </div>
                      <Lock size={12} className="text-rock-300" />
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* 我的足迹 */}
        {stats.track.pointCount > 0 && (
          <div className="glass-light rounded-2xl p-4 shadow-card">
            <h2 className="text-sm font-semibold text-forest-600 mb-2 inline-flex items-center gap-1.5">
              <Footprints size={14} className="text-apple-500" />
              我的足迹
            </h2>
            <div className="text-sm text-ink-50 mb-3">
              共走过 <span className="font-bold text-apple-600">{stats.track.totalDistanceKm.toFixed(2)} km</span> · 记录了 <span className="font-bold text-apple-600">{stats.track.pointCount}</span> 个点
              {stats.track.startTime && ` · 自 ${new Date(stats.track.startTime).toLocaleDateString('zh-CN')} 起`}
            </div>
            <div className="flex gap-2">
              <Link to="/map" className="flex-1 h-9 rounded-full bg-apple-400 text-cheese-50 text-xs font-medium inline-flex items-center justify-center hover:bg-apple-300 transition shadow-apple">
                在地图中查看
              </Link>
              <button
                onClick={() => { clearTrack(); refresh() }}
                className="h-9 px-3 rounded-full border border-amber-400/40 text-amber-400 text-xs hover:bg-amber-50 inline-flex items-center gap-1"
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
    <div className="rounded-xl bg-apple-50 py-2.5 px-1 border border-apple-400/15" title={label}>
      <div className="flex items-center justify-center text-apple-600 mb-1">{icon}</div>
      <div className="text-ink font-bold text-sm tabular-nums">{value}</div>
      <div className="text-[9px] text-rock-400">{unit}</div>
    </div>
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
    <div className="rounded-3xl overflow-hidden glass-light shadow-glass border border-apple-400/20" data-testid="travel-card">
      {/* 卡片背景 —— 奶酪渐变 */}
      <div className="relative p-6 overflow-hidden bg-cheese-gradient">
        {/* 装饰山脉 */}
        <div className="absolute bottom-0 left-0 right-0 opacity-25 pointer-events-none">
          <svg viewBox="0 0 400 100" className="w-full h-20">
            <path d="M0 100 L50 40 L90 70 L130 20 L170 60 L210 30 L250 70 L290 25 L330 55 L400 35 L400 100 Z" fill="#8DB838" />
          </svg>
        </div>

        <div className="relative z-10">
          {/* 品牌 */}
          <div className="text-center mb-5">
            <div className="font-serif text-3xl font-bold text-forest-700 tracking-wider">山见</div>
            <div className="text-overline text-rock-400 mt-1">看见风景，也看懂风景</div>
          </div>

          {/* 标题 */}
          <div className="text-center mb-5">
            <div className="text-sm text-apple-600 font-semibold">我的武功山</div>
            <div className="text-overline text-rock-400 mt-0.5 tabular-nums">{dateStr}</div>
          </div>

          {/* 统计 */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div className="text-center rounded-xl bg-cheese-50 py-3 border border-apple-400/15">
              <div className="text-2xl font-bold text-ink tabular-nums">{stats.track.totalDistanceKm.toFixed(1)}</div>
              <div className="text-[9px] text-rock-400 mt-0.5">km 距离</div>
            </div>
            <div className="text-center rounded-xl bg-cheese-50 py-3 border border-apple-400/15">
              <div className="text-2xl font-bold text-ink tabular-nums">{stats.exploredCount}</div>
              <div className="text-[9px] text-rock-400 mt-0.5">山峰</div>
            </div>
            <div className="text-center rounded-xl bg-apple-100 py-3 border border-apple-400/30">
              <div className="text-2xl font-bold text-apple-700 tabular-nums">{stats.badgeCount}</div>
              <div className="text-[9px] text-apple-600 mt-0.5">印记</div>
            </div>
          </div>

          {/* 探索地点 */}
          {exploredNames.length > 0 && (
            <div className="mb-4">
              <div className="text-overline text-rock-400 mb-1.5 tracking-wider font-semibold">探索路线</div>
              <div className="text-caption text-ink leading-relaxed">
                {exploredNames.map((name, i) => (
                  <span key={i}>
                    {i > 0 && <span className="text-apple-500 mx-1">→</span>}
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
                  <span className="text-[8px] text-rock-400 mt-0.5">{v.badge}</span>
                </div>
              ))}
            </div>
          )}

          {/* 进度条 —— 青苹果渐变 */}
          <div className="rounded-full bg-apple-100 h-1.5 overflow-hidden">
            <div className="h-full bg-apple-gradient rounded-full transition-all duration-500" style={{ width: `${stats.progress}%` }} />
          </div>
          <div className="text-center text-overline text-apple-700 mt-1.5 font-semibold">
            探索进度 {stats.progress}%
          </div>
        </div>
      </div>
    </div>
  )
}
