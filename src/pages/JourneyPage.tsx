/**
 * JourneyPage — 山见档案（个人旅行记录）
 *
 * 复用 travelLog + trackLog + attractions/nfcPoints 数据源
 * 展示：成就等级 + 徽章墙 / 总览统计 / 已探索列表 / 未探索列表 / 明信片生成
 */

import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Map, Footprints, Award, Route, ChevronRight, Lock, Trash2, Check, Camera } from 'lucide-react'
import { attractions } from '../data/attractions'
import { nfcPoints } from '../data/nfcPoints'
import { getVisits, getVisit } from '../services/travelLog'
import { getTrackStats, clearTrack } from '../services/trackLog'
import { getMilestones } from '../services/achievementService'
import AchievementPanel from '../components/AchievementPanel'
import PhotoUpload from '../components/PhotoUpload'
import TravelPoster from '../components/TravelPoster'
import BottomSheet from '../components/ui/BottomSheet'

/** sessionStorage 标志位：用户是否已生成过明信片海报 */
const POSTER_FLAG_KEY = 'has-generated-poster'

export default function JourneyPage() {
  const navigate = useNavigate()
  const [tick, forceUpdate] = useState(0)
  const [showPoster, setShowPoster] = useState(false)
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  // 已生成海报标志（解锁「旅行印记」徽章）
  const [hasGeneratedPoster, setHasGeneratedPoster] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(POSTER_FLAG_KEY) === '1'
    } catch {
      return false
    }
  })

  const stats = useMemo(() => {
    const visits = getVisits()
    const track = getTrackStats()
    const totalAttractions = nfcPoints.length // 有 NFC 的景点总数
    const exploredCount = nfcPoints.filter((p) => visits.some((v) => v.attractionId === p.attractionId)).length
    const visitedAttractionIds = visits.map((v) => v.attractionId)
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
      visitedAttractionIds,
      progress: totalAttractions > 0 ? Math.round((exploredCount / totalAttractions) * 100) : 0,
      badgeCount,
      lastVisit,
      firstVisit,
    }
  }, [tick])

  const refresh = () => forceUpdate((n) => n + 1)

  // 处理首次生成海报：解锁徽章 + 持久标志
  const handleFirstPoster = () => {
    setHasGeneratedPoster(true)
    try {
      sessionStorage.setItem(POSTER_FLAG_KEY, '1')
    } catch {
      // sessionStorage 不可用时静默降级
    }
  }

  // BottomSheet 关闭时同步清空照片，下次打开重新上传
  const closePoster = () => {
    setShowPoster(false)
    setPhotoDataUrl(null)
  }

  // 海报所需的徽章列表（已解锁在前，最多 5 枚）
  const milestones = useMemo(
    () => getMilestones(
      {
        exploredCount: stats.exploredCount,
        totalDistanceKm: stats.track.totalDistanceKm,
        totalAttractions: stats.totalAttractions,
        visitedAttractionIds: stats.visitedAttractionIds,
      },
      hasGeneratedPoster
    ),
    [stats.exploredCount, stats.track.totalDistanceKm, stats.totalAttractions, stats.visitedAttractionIds, hasGeneratedPoster]
  )

  // 已探索景点名列表（用于海报展示路线）
  const exploredNames = useMemo(
    () => nfcPoints
      .filter((p) => stats.visits.some((v) => v.attractionId === p.attractionId))
      .map((p) => p.name),
    [stats.visits]
  )

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

        {/* 成就面板：等级卡 + 徽章墙 */}
        <AchievementPanel
          stats={{
            exploredCount: stats.exploredCount,
            totalDistanceKm: stats.track.totalDistanceKm,
            totalAttractions: stats.totalAttractions,
            visitedAttractionIds: stats.visitedAttractionIds,
          }}
          hasGeneratedPoster={hasGeneratedPoster}
        />

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

        {/* 制作明信片按钮 —— 打开 BottomSheet */}
        <button
          onClick={() => setShowPoster(true)}
          className="w-full h-12 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 transition active:scale-95 inline-flex items-center justify-center gap-2 shadow-apple"
          data-testid="open-poster-btn"
        >
          <Camera size={15} />
          制作明信片
        </button>

        {/* 明信片 BottomSheet —— 上传照片 + 生成海报 */}
        <BottomSheet open={showPoster} onClose={closePoster}>
          <div className="pt-2 pb-4 space-y-4">
            <div className="text-center">
              <div className="text-sm font-semibold text-forest-700 inline-flex items-center gap-1.5">
                <Camera size={14} className="text-apple-500" />
                制作旅行明信片
              </div>
              <p className="text-caption text-rock-400 mt-1">上传一张你最满意的旅行照片，生成专属明信片</p>
            </div>

            <PhotoUpload
              onPhotoLoaded={setPhotoDataUrl}
              photoDataUrl={photoDataUrl}
              onClear={() => setPhotoDataUrl(null)}
            />

            {photoDataUrl && (
              <TravelPoster
                photoDataUrl={photoDataUrl}
                stats={{
                  totalDistanceKm: stats.track.totalDistanceKm,
                  exploredCount: stats.exploredCount,
                  badgeCount: stats.badgeCount,
                }}
                exploredNames={exploredNames}
                milestones={milestones}
                date={new Date()}
                onFirstPoster={handleFirstPoster}
              />
            )}
          </div>
        </BottomSheet>

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
