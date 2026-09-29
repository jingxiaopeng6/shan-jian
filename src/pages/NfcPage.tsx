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
import { Check, Nfc, Sparkles, ChevronRight, Trash2 } from 'lucide-react'
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
    <div className="min-h-screen bg-cheese text-ink">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6 safe-top pb-20">

        {/* 副标题区 */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-apple-100 text-apple-700 text-overline border border-apple-400/30">
            <Nfc size={11} />
            探索印记
          </div>
          <p className="mt-3 font-serif text-2xl text-forest-700 font-bold">把你的脚步留在武功山</p>
          <p className="mt-1.5 text-sm text-ink-50">将手机靠近景点 NFC 标签，自动识别并完成打卡</p>
        </div>

        {/* NFC 感应核心区 */}
        <div className="glass-light rounded-3xl p-8 text-center shadow-glass">
          {nfc.status === 'idle' && (
            <>
              {/* NFC 感应动画 —— 青苹果色脉冲圆环 */}
              <div className="relative mx-auto mb-6 w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-apple-400/20" />
                <div className="absolute inset-4 rounded-full border border-apple-400/30" />
                <div className="absolute inset-8 rounded-full border border-apple-400/40" />
                <div className="absolute inset-12 rounded-full border-2 border-apple-400/60 pulse-dot" />
                {/* 多层脉冲圆环 */}
                <div className="absolute inset-0 rounded-full border border-apple-400/40 pulse-ring" />
                <div className="absolute inset-4 rounded-full border border-apple-400/30 pulse-ring" style={{ animationDelay: '0.6s' }} />
                <Nfc size={32} className="text-apple-500 relative z-10" strokeWidth={2} />
              </div>
              <p className="text-ink font-medium text-base">靠近景点感应</p>
              <p className="mt-1.5 text-sm text-rock-400">将手机靠近景点 NFC 标签，自动识别并完成打卡</p>
              <button
                onClick={nfc.startScan}
                disabled={!nfc.supported}
                className="mt-6 w-full h-12 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 disabled:opacity-50 disabled:cursor-not-allowed transition active:scale-95 inline-flex items-center justify-center gap-2 shadow-apple"
              >
                <Nfc size={16} />
                {nfc.supported ? '开始扫描 NFC' : '当前浏览器不支持 Web NFC'}
              </button>
              {!nfc.supported && (
                <p className="mt-2 text-caption text-rock-400">
                  Web NFC API 仅支持 Android Chrome 81+
                </p>
              )}
            </>
          )}

          {nfc.status === 'scanning' && (
            <>
              {/* 扫描中动画 */}
              <div className="relative mx-auto mb-6 w-32 h-32 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-apple-400/20 animate-ping" />
                <div className="absolute inset-4 rounded-full border border-apple-400/40 animate-ping" style={{ animationDelay: '0.3s' }} />
                <div className="absolute inset-8 rounded-full border-2 border-apple-400/60 animate-ping" style={{ animationDelay: '0.6s' }} />
                <Nfc size={32} className="text-apple-500 relative z-10 animate-pulse" strokeWidth={2} />
              </div>
              <p className="text-ink font-medium text-base">正在寻找 NFC 标签…</p>
              <p className="mt-1.5 text-sm text-rock-400">请将手机靠近景点标签</p>
              <button
                onClick={nfc.stopScan}
                className="mt-6 w-full h-10 rounded-full bg-cheese-50 text-apple-600 border border-apple-400/40 text-xs hover:bg-apple-50 transition"
              >
                取消扫描
              </button>
            </>
          )}

          {nfc.status === 'success' && nfc.result && (
            <div className="text-left">
              {/* 成功状态 —— 青苹果色调 */}
              <div className="text-center mb-4">
                <div className="relative mx-auto mb-3 w-20 h-20 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-apple-100 badge-animate" />
                  <div className="absolute inset-2 rounded-full bg-apple-200 badge-animate" />
                  <Check size={36} className="text-apple-600 relative z-10" strokeWidth={3} />
                </div>
                <p className="text-apple-600 text-overline tracking-widest font-semibold">已发现</p>
                <p className="font-serif text-ink text-2xl font-bold mt-1">{nfc.result.name}</p>
                <p className="mt-1 text-sm text-apple-600 font-medium">
                  {attractions.find(a => a.id === nfc.result!.attractionId)?.elevation ?? '-'} m · 武功山
                </p>
                {nfc.isSimulated && isDev && (
                  <span className="inline-block mt-2 px-2 py-0.5 bg-apple-50 text-apple-700 text-overline rounded-full border border-apple-400/40 font-medium">
                    演示模式
                  </span>
                )}
              </div>

              {/* 探索印记 +1 —— 青苹果高亮 */}
              <div className="mb-4 text-center py-3 rounded-2xl bg-apple-50 border border-apple-400/30">
                <div className="inline-flex items-center gap-1.5 text-apple-700 text-sm font-semibold">
                  <Sparkles size={14} />
                  探索印记 +1
                </div>
              </div>

              {/* 解锁内容 */}
              <div className="space-y-2 text-sm">
                <Row label="徽章" value={`${nfc.result.badge}`} />
                <Row label="打卡时间" value={new Date().toLocaleString('zh-CN')} />
              </div>
              <div className="mt-3 p-3 rounded-xl bg-apple-50 text-sm text-ink-50 leading-5 border border-apple-400/20">
                {nfc.result.unlockedContent}
              </div>

              {checkinResult && !checkinResult.ok && (
                <p className="mt-2 text-caption text-amber-400">该景点 5 分钟内已打卡，请稍后再试</p>
              )}

              {/* CTA：查看档案 */}
              <Link
                to="/journey"
                className="mt-4 w-full h-12 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 transition active:scale-95 inline-flex items-center justify-center gap-2 shadow-apple"
              >
                查看我的山见档案
                <ChevronRight size={16} />
              </Link>
              <button
                onClick={() => { nfc.reset(); setCheckinResult(null) }}
                className="mt-2 w-full h-10 rounded-full bg-cheese-50 text-apple-600 border border-apple-400/40 text-xs hover:bg-apple-50 transition"
              >
                继续打卡下一个
              </button>
            </div>
          )}

          {nfc.status === 'error' && (
            <>
              <div className="relative mx-auto mb-6 w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-amber-50" />
                <div className="absolute inset-2 rounded-full bg-amber-100" />
                <span className="relative z-10 text-amber-400 text-3xl font-bold">!</span>
              </div>
              <p className="text-amber-400 font-medium text-sm">扫描失败</p>
              <p className="mt-1.5 text-xs text-rock-400">{nfc.error}</p>
              <button
                onClick={() => { nfc.reset(); setCheckinResult(null) }}
                className="mt-6 w-full h-10 rounded-full bg-apple-400 text-cheese-50 text-xs font-medium hover:bg-apple-300 transition shadow-apple"
              >
                重试
              </button>
            </>
          )}
        </div>

        {/* 模拟 NFC 打卡（仅 DEV 环境展示） */}
        {isDev && (
          <div className="glass-light rounded-2xl p-4 shadow-card border border-apple-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2 py-0.5 bg-apple-50 text-apple-700 text-overline rounded-full font-medium border border-apple-400/40">
                DEV · 演示模式
              </span>
              <h2 className="text-sm font-medium text-ink-50">模拟 NFC 打卡</h2>
            </div>
            <p className="mb-3 text-caption text-rock-400">
              无需 NFC 标签，选择景点完成模拟打卡，用于开发测试和比赛演示
            </p>
            <div className="space-y-2">
              {nfcPoints.map((p) => {
                const visited = hasVisited(p.attractionId)
                return (
                  <button
                    key={p.nfcId}
                    onClick={() => handleSimulate(p.nfcId)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl border border-apple-400/20 bg-cheese-50 hover:bg-apple-50 transition text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{p.badgeIcon}</span>
                      <div>
                        <div className="text-sm font-medium text-ink">{p.name}</div>
                        <div className="text-overline text-rock-400">{p.badge}</div>
                      </div>
                    </div>
                    {visited && (
                      <span className="text-overline text-apple-700 bg-apple-100 px-2 py-0.5 rounded-full border border-apple-400/30">
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
        <div className="glass-light rounded-2xl p-4 shadow-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-forest-600">山见档案</h2>
            <span className="text-overline text-rock-400">{visits.length} 条记录</span>
          </div>
          {visits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="text-sm text-rock-400">暂无打卡记录</p>
              <p className="mt-1 text-overline text-rock-400">去探索，把脚步留在武功山</p>
            </div>
          ) : (
            <div className="space-y-2">
              {visits.map((v) => (
                <div
                  key={v.visitId}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl bg-cheese-50 border border-apple-400/15"
                >
                  <span className="text-lg">{v.badgeIcon ?? '🏔'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-ink">{v.name}</div>
                    <div className="text-overline text-rock-400">
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
              className="mt-3 inline-flex items-center gap-1.5 text-caption text-rock-400 hover:text-amber-400 transition"
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
      <span className="text-rock-400">{label}</span>
      <span className="text-ink font-medium">{value}</span>
    </div>
  )
}
