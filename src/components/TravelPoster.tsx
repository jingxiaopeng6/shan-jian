/**
 * TravelPoster — Canvas 手绘旅行明信片
 *
 * 布局（1080×1620 竖版）：
 * - 上部 60%：用户照片（圆角 clip + 奶酪色边框）
 * - 照片底部叠装饰山脉
 * - 中部：品牌 + 日期
 * - 3 个统计卡：距离 / 山峰 / 印记
 * - 探索路线：A → B → C
 * - 5 枚徽章一行
 * - 底部水印
 *
 * 生成时机：组件挂载且 photoDataUrl 有值时自动绘制；
 * 调用 onFirstPoster() 解锁「旅行印记」徽章。
 */

import { useEffect, useRef, useState } from 'react'
import { Download, Sparkles, RefreshCw } from 'lucide-react'
import type { Milestone } from '../services/achievementService'

export interface TravelPosterProps {
  photoDataUrl: string | null
  stats: {
    totalDistanceKm: number
    exploredCount: number
    badgeCount: number
  }
  exploredNames: string[]
  milestones: Milestone[]
  date: Date
  onFirstPoster?: () => void
}

const CANVAS_W = 1080
const CANVAS_H = 1620
const PHOTO_TOP = 60
const PHOTO_LEFT = 60
const PHOTO_W = CANVAS_W - 120
const PHOTO_H = 972 // 60% 高度

export default function TravelPoster({
  photoDataUrl,
  stats,
  exploredNames,
  milestones,
  date,
  onFirstPoster,
}: TravelPosterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [ready, setReady] = useState(false)
  const [generating, setGenerating] = useState(false)
  const firstPosterFiredRef = useRef(false)

  // 重新绘制
  const draw = async () => {
    if (!photoDataUrl || !canvasRef.current) return
    setGenerating(true)
    try {
      const ctx = canvasRef.current.getContext('2d')
      if (!ctx) return

      // 1. 奶酪渐变背景
      const bgGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_H)
      bgGrad.addColorStop(0, '#FBFAF4')
      bgGrad.addColorStop(1, '#EAE5D3')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      // 2. 用户照片（圆角矩形 clip）
      const img = await loadImage(photoDataUrl)
      ctx.save()
      roundRectPath(ctx, PHOTO_LEFT, PHOTO_TOP, PHOTO_W, PHOTO_H, 32)
      ctx.clip()
      drawImageCover(ctx, img, PHOTO_LEFT, PHOTO_TOP, PHOTO_W, PHOTO_H)
      ctx.restore()
      // 奶酪色边框
      ctx.strokeStyle = '#F4F1E8'
      ctx.lineWidth = 8
      roundRectPath(ctx, PHOTO_LEFT, PHOTO_TOP, PHOTO_W, PHOTO_H, 32)
      ctx.stroke()

      // 3. 装饰山脉叠在照片底部
      ctx.fillStyle = 'rgba(141, 184, 56, 0.92)'
      ctx.beginPath()
      ctx.moveTo(0, PHOTO_TOP + PHOTO_H + 20)
      ctx.lineTo(80, PHOTO_TOP + PHOTO_H - 60)
      ctx.lineTo(180, PHOTO_TOP + PHOTO_H - 10)
      ctx.lineTo(300, PHOTO_TOP + PHOTO_H - 90)
      ctx.lineTo(420, PHOTO_TOP + PHOTO_H - 30)
      ctx.lineTo(540, PHOTO_TOP + PHOTO_H - 70)
      ctx.lineTo(660, PHOTO_TOP + PHOTO_H - 20)
      ctx.lineTo(780, PHOTO_TOP + PHOTO_H - 80)
      ctx.lineTo(900, PHOTO_TOP + PHOTO_H - 40)
      ctx.lineTo(CANVAS_W, PHOTO_TOP + PHOTO_H - 60)
      ctx.lineTo(CANVAS_W, PHOTO_TOP + PHOTO_H + 20)
      ctx.closePath()
      ctx.fill()

      // 4. 品牌
      ctx.textAlign = 'center'
      ctx.fillStyle = '#1F2818'
      ctx.font = 'bold 64px "Noto Sans SC", "Microsoft YaHei", sans-serif'
      ctx.fillText('山见', CANVAS_W / 2, PHOTO_TOP + PHOTO_H + 110)

      ctx.fillStyle = '#6F726C'
      ctx.font = '20px "Noto Sans SC", sans-serif'
      ctx.fillText('看见风景，也看懂风景', CANVAS_W / 2, PHOTO_TOP + PHOTO_H + 145)

      // 日期
      const dateStr = formatDate(date)
      ctx.fillStyle = '#8DB838'
      ctx.font = '600 22px "Noto Sans SC", sans-serif'
      ctx.fillText(dateStr, CANVAS_W / 2, PHOTO_TOP + PHOTO_H + 180)

      // 5. 统计卡（3 个）
      const cardY = PHOTO_TOP + PHOTO_H + 220
      const cardW = 280
      const cardH = 130
      const gap = 20
      const totalCardW = cardW * 3 + gap * 2
      const startX = (CANVAS_W - totalCardW) / 2

      const cards = [
        { value: stats.totalDistanceKm.toFixed(1), unit: 'km', label: '探索距离' },
        { value: `${stats.exploredCount}`, unit: '处', label: '已访山峰' },
        { value: `${stats.badgeCount}`, unit: '枚', label: '探索印记' },
      ]

      cards.forEach((c, i) => {
        const x = startX + i * (cardW + gap)
        // 圆角矩形底
        ctx.fillStyle = '#F4F1E8'
        roundRectPath(ctx, x, cardY, cardW, cardH, 20)
        ctx.fill()
        ctx.strokeStyle = 'rgba(141, 184, 56, 0.25)'
        ctx.lineWidth = 2
        roundRectPath(ctx, x, cardY, cardW, cardH, 20)
        ctx.stroke()
        // 数值
        ctx.fillStyle = '#1F2818'
        ctx.font = 'bold 52px "Noto Sans SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(c.value, x + cardW / 2, cardY + 65)
        // 单位
        ctx.fillStyle = '#6F726C'
        ctx.font = '18px "Noto Sans SC", sans-serif'
        ctx.fillText(c.unit, x + cardW / 2 + ctx.measureText(c.value).width / 2 + 14, cardY + 60)
        // 标签
        ctx.fillStyle = '#8DB838'
        ctx.font = '600 18px "Noto Sans SC", sans-serif'
        ctx.fillText(c.label, x + cardW / 2, cardY + 105)
      })

      // 6. 探索路线
      if (exploredNames.length > 0) {
        const routeY = cardY + cardH + 50
        ctx.fillStyle = '#6F726C'
        ctx.font = '600 18px "Noto Sans SC", sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText('探索路线', CANVAS_W / 2, routeY)

        ctx.fillStyle = '#1F2818'
        ctx.font = '500 22px "Noto Sans SC", sans-serif'
        const routeStr = exploredNames.join(' → ')
        ctx.fillText(routeStr.length > 22 ? routeStr.slice(0, 20) + '…' : routeStr, CANVAS_W / 2, routeY + 32)
      }

      // 7. 徽章一行（最多 5 枚，已解锁优先展示）
      const badgeY = cardY + cardH + 130
      const unlockedBadges = milestones.filter((m) => m.unlocked)
      const lockedBadges = milestones.filter((m) => !m.unlocked)
      const badgeRow = [...unlockedBadges, ...lockedBadges].slice(0, 5)
      const badgeSize = 64
      const badgeGap = 28
      const totalBadgeW = badgeRow.length * badgeSize + (badgeRow.length - 1) * badgeGap
      const badgeStartX = (CANVAS_W - totalBadgeW) / 2 + badgeSize / 2

      badgeRow.forEach((m, i) => {
        const cx = badgeStartX + i * (badgeSize + badgeGap)
        ctx.textAlign = 'center'
        ctx.font = '48px serif'
        // 未解锁徽章降透明度后再绘制
        ctx.globalAlpha = m.unlocked ? 1 : 0.4
        ctx.fillText(m.unlocked ? m.icon : '🔒', cx, badgeY + badgeSize / 2 + 16)
      })
      ctx.globalAlpha = 1

      // 8. 底部水印
      ctx.fillStyle = '#6F726C'
      ctx.font = '14px "Noto Sans SC", sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('www.shanjian.app', CANVAS_W / 2, CANVAS_H - 30)

      // 标记完成 —— 首次触发徽章解锁
      if (!firstPosterFiredRef.current) {
        firstPosterFiredRef.current = true
        onFirstPoster?.()
      }
      setReady(true)
    } catch (e) {
      console.error('draw poster error', e)
    } finally {
      setGenerating(false)
    }
  }

  // 挂载或 photoDataUrl 变化时重绘
  useEffect(() => {
    if (photoDataUrl) {
      void draw()
    } else {
      setReady(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoDataUrl])

  const handleDownload = () => {
    if (!canvasRef.current || !ready) return
    // jsdom 中可能没有 toBlob，fallback 用 toDataURL
    if (typeof canvasRef.current.toBlob === 'function') {
      canvasRef.current.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        triggerDownload(url, `山见-明信片-${Date.now()}.png`)
        setTimeout(() => URL.revokeObjectURL(url), 1000)
      }, 'image/png')
    } else {
      // fallback：dataURL
      const url = canvasRef.current.toDataURL('image/png')
      triggerDownload(url, `山见-明信片-${Date.now()}.png`)
    }
  }

  if (!photoDataUrl) return null

  return (
    <div className="space-y-3" data-testid="travel-poster">
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="w-full max-w-sm mx-auto rounded-2xl shadow-glass bg-cheese-50"
        data-testid="poster-canvas"
      />
      <div className="flex gap-2">
        <button
          onClick={handleDownload}
          disabled={!ready || generating}
          className="flex-1 h-11 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 transition active:scale-95 inline-flex items-center justify-center gap-2 shadow-apple disabled:opacity-50"
          data-testid="poster-download"
        >
          {generating ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Download size={15} />
          )}
          {generating ? '生成中…' : '下载海报'}
        </button>
        <button
          onClick={() => void draw()}
          disabled={generating}
          className="h-11 px-4 rounded-full border border-apple-400/40 text-apple-600 text-sm hover:bg-apple-50 inline-flex items-center gap-1 disabled:opacity-50"
          aria-label="重新生成"
          data-testid="poster-regenerate"
        >
          <RefreshCw size={14} />
        </button>
      </div>
      {ready && (
        <p className="text-caption text-apple-600 inline-flex items-center justify-center gap-1 w-full" data-testid="poster-ready">
          <Sparkles size={11} />
          海报已生成，「旅行印记」徽章已解锁
        </p>
      )}
    </div>
  )
}

// ============ 工具函数 ============

/** 加载 dataURL 为 HTMLImageElement */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 圆角矩形 path（不 fill/stroke，由调用方决定） */
function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** 把图片 cover 模式绘制到指定矩形（保持比例、居中裁剪） */
function drawImageCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) {
  const iw = img.width
  const ih = img.height
  if (iw === 0 || ih === 0) return
  const scale = Math.max(dw / iw, dh / ih)
  const sw = dw / scale
  const sh = dh / scale
  const sx = (iw - sw) / 2
  const sy = (ih - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh)
}

/** 格式化日期：2026 · 09 · 29 */
function formatDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y} · ${m} · ${day}`
}

/** 触发浏览器下载 */
function triggerDownload(href: string, filename: string) {
  const a = document.createElement('a')
  a.href = href
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}
