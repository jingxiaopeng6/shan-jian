/**
 * NfcPage — NFC 空间互动页面
 *
 * 功能链路：
 * 游客到达景点 → NFC 标签 → 手机读取 → 识别景点 → 完成打卡 → 解锁内容 → 写入"山见档案"
 *
 * 支持两种模式：
 * 1. 真实 Web NFC（Android Chrome 81+）
 * 2. 模拟打卡（演示模式，所有设备可用）
 */

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

  return (
    <div className="min-h-screen bg-forest-50">
      {/* 顶部标题栏 */}
      <div className="sticky top-0 z-30 bg-forest-900 text-white px-4 py-3 shadow-soft">
        <div className="flex items-center justify-between">
          <Link to="/" className="text-sand-200 text-sm">← 返回</Link>
          <h1 className="font-serif text-lg font-semibold">山见档案 · NFC 打卡</h1>
          <Link to="/map" className="text-sand-200 text-sm">地图</Link>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* NFC 扫描区 */}
        <div className="rounded-2xl bg-white border border-forest-100 shadow-soft p-6 text-center">
          {nfc.status === 'idle' && (
            <>
              <div className="text-5xl mb-3">📱</div>
              <p className="text-forest-800 font-medium text-sm">NFC 空间打卡</p>
              <p className="mt-1 text-xs text-stone2-500">
                将手机靠近景点 NFC 标签，自动识别并打卡
              </p>
              <button
                onClick={nfc.startScan}
                disabled={!nfc.supported}
                className="mt-4 w-full h-12 rounded-xl bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 disabled:opacity-50 transition"
              >
                {nfc.supported ? '🔍 开始扫描 NFC' : '⚠️ 当前浏览器不支持 Web NFC'}
              </button>
              {!nfc.supported && (
                <p className="mt-2 text-[11px] text-stone2-400">
                  Web NFC API 仅支持 Android Chrome 81+，请使用下方模拟打卡
                </p>
              )}
            </>
          )}

          {nfc.status === 'scanning' && (
            <>
              <div className="text-5xl mb-3 animate-pulse">📡</div>
              <p className="text-forest-800 font-medium text-sm">正在寻找 NFC 标签……</p>
              <p className="mt-1 text-xs text-stone2-500">请将手机靠近景点标签</p>
              <button
                onClick={nfc.stopScan}
                className="mt-4 w-full h-10 rounded-xl bg-stone-100 text-stone-600 text-xs hover:bg-stone-200 transition"
              >
                取消扫描
              </button>
            </>
          )}

          {nfc.status === 'success' && nfc.result && (
            <div className="text-left">
              <div className="text-center mb-3">
                <span className="text-4xl inline-block badge-animate">{nfc.result.badgeIcon}</span>
                <p className="mt-1 text-forest-800 font-semibold text-sm">
                  {nfc.result.name} 打卡成功！
                </p>
                {nfc.isSimulated && (
                  <span className="inline-block mt-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full">
                    演示模式
                  </span>
                )}
              </div>
              <div className="space-y-2 text-xs">
                <Row label="海拔" value={`${attractions.find(a => a.id === nfc.result!.attractionId)?.elevation ?? '-'} m`} />
                <Row label="徽章" value={`${nfc.result.badgeIcon} ${nfc.result.badge}`} />
                <Row label="打卡时间" value={new Date().toLocaleString('zh-CN')} />
              </div>
              <div className="mt-3 p-3 rounded-lg bg-forest-50 text-xs text-forest-700 leading-5">
                {nfc.result.unlockedContent}
              </div>
              {checkinResult && !checkinResult.ok && (
                <p className="mt-2 text-[11px] text-amber-600">该景点 5 分钟内已打卡，请稍后再试</p>
              )}
              <button
                onClick={() => { nfc.reset(); setCheckinResult(null) }}
                className="mt-3 w-full h-10 rounded-xl bg-forest-700 text-white text-xs font-medium hover:bg-forest-800 transition"
              >
                继续打卡下一个
              </button>
            </div>
          )}

          {nfc.status === 'error' && (
            <>
              <div className="text-5xl mb-3">⚠️</div>
              <p className="text-red-600 font-medium text-sm">扫描失败</p>
              <p className="mt-1 text-xs text-stone2-500">{nfc.error}</p>
              <button
                onClick={() => { nfc.reset(); setCheckinResult(null) }}
                className="mt-4 w-full h-10 rounded-xl bg-forest-700 text-white text-xs font-medium hover:bg-forest-800 transition"
              >
                重试
              </button>
            </>
          )}
        </div>

        {/* 模拟 NFC 打卡（演示模式） */}
        <div className="rounded-2xl bg-white border border-amber-200 shadow-soft p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full font-medium">
              演示模式
            </span>
            <h2 className="text-sm font-medium text-forest-800">模拟 NFC 打卡</h2>
          </div>
          <p className="mb-3 text-[11px] text-stone2-500">
            无需 NFC 标签，选择景点完成模拟打卡，用于开发测试和比赛演示
          </p>
          <div className="space-y-2">
            {nfcPoints.map((p) => {
              const visited = hasVisited(p.attractionId)
              return (
                <button
                  key={p.nfcId}
                  onClick={() => handleSimulate(p.nfcId)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg border border-stone-200 bg-stone-50 hover:bg-forest-50 hover:border-forest-200 transition text-left"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{p.badgeIcon}</span>
                    <div>
                      <div className="text-sm font-medium text-forest-800">{p.name}</div>
                      <div className="text-[10px] text-stone2-500">{p.badge}</div>
                    </div>
                  </div>
                  {visited && (
                    <span className="text-[10px] text-forest-600 bg-forest-100 px-2 py-0.5 rounded-full">
                      ✓ 已打卡
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* 旅行档案（已打卡记录） */}
        <div className="rounded-2xl bg-white border border-forest-100 shadow-soft p-4">
          <h2 className="text-sm font-medium text-forest-800 mb-3">山见档案</h2>
          {visits.length === 0 ? (
            <p className="text-xs text-stone2-400">暂无打卡记录，去探索吧！</p>
          ) : (
            <div className="space-y-2">
              {visits.map((v) => (
                <div
                  key={v.visitId}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg bg-forest-50"
                >
                  <span className="text-lg">{v.badgeIcon ?? '🏔️'}</span>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-forest-800">{v.name}</div>
                    <div className="text-[10px] text-stone2-500">
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
              className="mt-3 text-[11px] text-stone2-400 hover:text-red-500"
            >
              清除记录
            </button>
          )}
        </div>

        {/* 底部导航 */}
        <div className="flex justify-center gap-3 pb-6">
          <Link to="/map" className="text-xs text-forest-600 hover:text-forest-800">地图</Link>
          <Link to="/ar" className="text-xs text-forest-600 hover:text-forest-800">AR 看山</Link>
          <Link to="/viewshed" className="text-xs text-forest-600 hover:text-forest-800">视域分析</Link>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-stone2-500">{label}</span>
      <span className="text-forest-800 font-medium">{value}</span>
    </div>
  )
}
