/**
 * NfcPage — 探索印记（NFC 空间互动页面）
 *
 * 功能链路：
 * 游客到达景点 → NFC 标签 → 手机读取 → 识别景点 → 完成打卡 → 解锁内容 → 写入"山见档案"
 *
 * 支持两种模式：
 * 1. 真实 Web NFC（Android Chrome 81+）
 * 2. 模拟打卡（仅 DEV 环境展示，用于开发测试和比赛演示）
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Nfc, Sparkles, ChevronRight, Trash2 } from 'lucide-react'
import { useNfc } from '../hooks/useNfc'
import { nfcPoints } from '../data/nfcPoints'
import { attractions } from '../data/attractions'
import { getVisits, addVisit, hasVisited, type VisitRecord } from '../services/travelLog'
import { useGeolocation } from '../hooks/useGeolocation'

export default function NfcPage() {
  const nfc = useNfc()
  const geo = useGeolocation()
  const [visits, setVisits] = useState<VisitRecord[]>([])
  const [checkinResult, setCheckinResult] = useState<{ ok: boolean; record?: VisitRecord } | null>(null)

  // 初始化加载旅行记录
  useEffect(() => {
    setVisits(getVisits())
  }, [])

  // NFC 扫描成功后自动打卡
  useEffect(() => {
    if (nfc.status === 'success' && nfc.result) {
      handleCheckin(nfc.result.attractionId, nfc.result.name, nfc.result.badge, nfc.result.badgeIcon)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfc.status, nfc.result])

  /** 执行打卡 */
  const handleCheckin = (
    attractionId: string,
    name: string,
    badge?: string,
    badgeIcon?: string
  ) => {
    const record = addVisit(attractionId, name, {
      badge,
      badgeIcon,
      latitude: geo.reading?.latitude,
      longitude: geo.reading?.longitude,
    })
    setCheckinResult({ ok: !!record, record: record ?? undefined })
    setVisits(getVisits())
  }

  /** 模拟打卡（演示模式） */
  const handleSimulate = (nfcId: string) => {
    nfc.simulateScan(nfcId)
  }

  const isDev = import.meta.env.DEV

  return (
    <div className="min-h-screen bg-ink text-mist">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 glass-panel px-4 py-3 safe-top">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link to="/" className="text-mist/70 text-sm inline-flex items-center gap-1 hover:text-mist transition">
            <ArrowLeft size={14} />
            返回
          </Link>
          <h1 className="font-serif text-base font-semibold tracking-wide">探索印记</h1>
          <Link to="/journey" className="text-gold text-sm inline-flex items-center gap-1 hover:text-gold/80 transition">
            档案
          </Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* 副标题 */}
        <div className="text-center">
          <p className="text-xs text-rock tracking-wider">把你的脚步留在武功山</p>
        </div>

        {/* NFC 感应核心区 */}
        <div className="glass-panel rounded-3xl p-8 text-center">
          {nfc.status === 'idle' && (
            <>
              {/* NFC 感应动画 */}
              <div className="relative mx-auto mb-6 w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-gold/20" />
                <div className="absolute inset-4 rounded-full border border-gold/30" />
                <div className="absolute inset-8 rounded-full border border-gold/40" />
                <div className="absolute inset-12 rounded-full border-2 border-gold/60 pulse-dot" />
                <Nfc size={32} className="text-gold relative z-10" />
              </div>
              <p className="text-mist font-medium text-sm">靠近景点感应</p>
              <p className="mt-1.5 text-xs text-rock">将手机靠近景点 NFC 标签，自动识别并完成打卡</p>
              <button
                onClick={nfc.startScan}
                disabled={!nfc.supported}
                className="mt-6 w-full h-12 rounded-full bg-gold text-ink text-sm font-semibold hover:bg-gold/90 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 inline-flex items-center justify-center gap-2"
              >
                <Nfc size={16} />
                {nfc.supported ? '开始扫描 NFC' : '当前浏览器不支持 Web NFC'}
              </button>
              {!nfc.supported && (
                <p className="mt-2 text-[11px] text-rock/60">
                  Web NFC API 仅支持 Android Chrome 81+
                </p>
              )}
            </>
          )}

          {nfc.status === 'scanning' && (
            <>
              {/* 扫描中动画 */}
              <div className="relative mx-auto mb-6 w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-gold/20 animate-ping" />
                <div className="absolute inset-4 rounded-full border border-gold/40 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-8 rounded-full border-2 border-gold/60 animate-ping" style={{ animationDelay: '0.6s' }} />
                <Nfc size={32} className="text-gold relative z-10 animate-pulse" />
              </div>
              <p className="text-mist font-medium text-sm">正在寻找 NFC 标签…</p>
              <p className="mt-1.5 text-xs text-rock">请将手机靠近景点标签</p>
              <button
                onClick={nfc.stopScan}
                className="mt-6 w-full h-10 rounded-full glass-panel text-mist/70 text-xs hover:text-mist transition"
              >
                取消扫描
              </button>
            </>
          )}

          {nfc.status === 'success' && nfc.result && (
            <div className="text-left">
              {/* 成功状态 */}
              <div className="text-center mb-4">
                <div className="relative mx-auto mb-3 w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-gold/20 badge-animate" />
                  <div className="absolute inset-2 rounded-full bg-gold/30 badge-animate" />
                  <Check size={36} className="text-gold relative z-10" strokeWidth={3} />
                </div>
                <p className="text-mist/60 text-[10px] tracking-widest uppercase">已发现</p>
                <p className="font-serif text-mist text-xl font-semibold mt-1">{nfc.result.name}</p>
                <p className="mt-1 text-xs text-gold">
                  {attractions.find(a => a.id === nfc.result!.attractionId)?.elevation ?? '-'} m · 武功山
                </p>
                {nfc.isSimulated && isDev && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-gold/15 text-gold text-[10px] rounded-full border border-gold/30">
                    演示模式
                  </span>
                )}
              </div>

              {/* 探索印记 +1 */}
              <div className="mb-4 text-center py-3 rounded-2xl bg-gold/10 border border-gold/20">
                <div className="inline-flex items-center gap-1.5 text-gold text-sm font-medium">
                  <Sparkles size={14} />
                  探索印记 +1
                </div>
              </div>

              {/* 解锁内容 */}
              <div className="space-y-2 text-xs">
                <Row label="徽章" value={`${nfc.result.badge}`} />
                <Row label="打卡时间" value={new Date().toLocaleString('zh-CN')} />
              </div>
              <div className="mt-3 p-3 rounded-xl bg-white/5 text-xs text-mist/80 leading-5">
                {nfc.result.unlockedContent}
              </div>

              {checkinResult && !checkinResult.ok && (
                <p className="mt-2 text-[11px] text-amber-400">该景点 5 分钟内已打卡，请稍后再试</p>
              )}

              {/* CTA：查看档案 */}
              <Link
                to="/journey"
                className="mt-4 w-full h-12 rounded-full bg-gold text-ink text-sm font-semibold hover:bg-gold/90 transition active:scale-95 inline-flex items-center justify-center gap-2"
              >
                查看我的山见档案
                <ChevronRight size={16} />
              </Link>
              <button
                onClick={() => { nfc.reset(); setCheckinResult(null) }}
                className="mt-2 w-full h-10 rounded-full glass-panel text-mist/70 text-xs hover:text-mist transition"
              >
                继续打卡下一个
              </button>
            </div>
          )}

          {nfc.status === 'error' && (
            <>
              <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-red-500/15" />
                <div className="absolute inset-2 rounded-full bg-red-500/25" />
                <span className="relative z-10 text-red-400 text-3xl">!</span>
              </div>
              <p className="text-red-400 font-medium text-sm">扫描失败</p>
              <p className="mt-1.5 text-xs text-rock/70">{nfc.error}</p>
              <button
                onClick={() => { nfc.reset(); setCheckinResult(null) }}
                className="mt-6 w-full h-10 rounded-full bg-gold text-ink text-xs font-medium hover:bg-gold/90 transition"
              >
                重试
              </button>
            </>
          )}
        </div>

        {/* 模拟 NFC 打卡（仅 DEV 环境展示） */}
        {isDev && (
          <div className="glass-panel rounded-2xl p-4 border-gold/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-gold/15 text-gold text-[10px] rounded-full font-medium border border-gold/30">
                DEV · 演示模式
              </span>
              <h2 className="text-sm font-medium text-mist/80">模拟 NFC 打卡</h2>
            </div>
            <p className="mb-3 text-[11px] text-rock/70">
              无需 NFC 标签，选择景点完成模拟打卡，用于开发测试和比赛演示
            </p>
            <div className="space-y-2">
              {nfcPoints.map((p) => {
                const visited = hasVisited(p.attractionId)
                return (
                  <button
                    key={p.nfcId}
                    onClick={() => handleSimulate(p.nfcId)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.badgeIcon}</span>
                      <div>
                        <div className="text-sm font-medium text-mist">{p.name}</div>
                        <div className="text-[10px] text-rock/70">{p.badge}</div>
                      </div>
                    </div>
                    {visited && (
                      <span className="text-[10px] text-moss bg-moss/15 px-2 py-0.5 rounded-full">
                        ✓ 已打卡
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* 山见档案（已打卡记录） */}
        <div className="glass-panel rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-mist">山见档案</h2>
            <span className="text-[10px] text-rock">{visits.length} 条记录</span>
          </div>
          {visits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-xs text-rock/60">暂无打卡记录</p>
              <p className="mt-1 text-[10px] text-rock/50">去探索，把脚步留在武功山</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visits.map((v) => (
                <div
                  key={v.visitId}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5"
                >
                  <span className="text-lg">{v.badgeIcon ?? '🏔'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-mist">{v.name}</div>
                    <div className="text-[10px] text-rock/70">
                      {new Date(v.timestamp).toLocaleString('zh-CN')}
                      {v.badge && ` · ${v.badge}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {visits.length > 0 && (
            <button
              onClick={() => { localStorage.removeItem('shan-jian-travel-log'); setVisits([]) }}
              className="mt-3 inline-flex items-center gap-1.5 text-[11px] text-rock/50 hover:text-red-400 transition"
            >
              <Trash2 size={11} />
              清除记录
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-rock">{label}</span>
      <span className="text-mist font-medium">{value}</span>
    </div>
  )
}
