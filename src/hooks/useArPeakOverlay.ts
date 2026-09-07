import { useEffect, useMemo, useRef } from 'react'
import { peaks as allPeaks } from '../data/mock'
import type { Peak } from '../types'
import { AR_CONFIG } from '../config/arConfig'
import {
  calculateBearing,
  calculateDistanceKm,
  lerp,
  lerpAngle,
  relativeBearing,
  relativeBearingToScreenX,
  type LatLng
} from '../utils/geoUtils'

export interface ArPeakOverlayItem {
  /** 原始山峰数据 */
  peak: Peak
  /** 山峰位于游客的绝对方位角（0–360°） */
  bearingDeg: number
  /** 山峰距离（km） */
  distanceKm: number
  /** 相对手机朝向的角度（负=左, 正=右） */
  relativeDeg: number
  /** 山峰在水平视场中屏幕 X 百分比（0–100） */
  screenXPercent: number
  /** 是否在当前摄像头水平视野内（相对方位 ±FOV/2） */
  inFOV: boolean
}

interface Input {
  /** 游客当前 GPS 位置（null 时不计算真实坐标） */
  userLatLng: LatLng | null
  /** 手机当前朝向（0–360°），null 时使用 Stage 2 的模拟 heading */
  heading: number | null
  /** 山峰数据源（默认用 mock.ts 的全部） */
  peaks?: Peak[]
}

/**
 * AR 山峰屏幕定位 Hook
 *
 * 综合 GPS 位置 + 手机朝向 + 山峰地理坐标 → 输出每个山峰的屏幕位置。
 * - 自动处理 GPS / heading 缺失的情况
 * - 内置平滑（lerp）避免标签抖动
 * - 超出水平 FOV 的山峰标记 inFOV=false
 *
 * 这是 Stage 4 的核心 Hook。后续 Stage 5（视域分析）会继续使用此 Hook。
 */
export function useArPeakOverlay({
  userLatLng,
  heading,
  peaks = allPeaks
}: Input) {
  // 平滑用的"上一帧值"缓存
  const smoothRef = useRef<Record<string, { screenX: number; distanceKm: number }>>({})
  // 平滑后的 heading
  const smoothedHeadingRef = useRef<number | null>(null)

  // 对 heading 做平滑
  useEffect(() => {
    if (heading == null) {
      smoothedHeadingRef.current = null
      return
    }
    if (smoothedHeadingRef.current == null) {
      smoothedHeadingRef.current = heading
    } else {
      smoothedHeadingRef.current = lerpAngle(
        smoothedHeadingRef.current,
        heading,
        AR_CONFIG.headingSmoothing
      )
    }
  }, [heading])

  const items = useMemo<ArPeakOverlayItem[]>(() => {
    const output: ArPeakOverlayItem[] = []

    // 没有 GPS → 跳过真实计算（Stage 2 模拟模式会另走分支）
    if (!userLatLng) return output

    const effectiveHeading = smoothedHeadingRef.current ?? heading ?? 0

    for (const peak of peaks) {
      const peakLatLng: LatLng = { lat: peak.lat, lng: peak.lng }

      const rawBearing = calculateBearing(userLatLng, peakLatLng)
      const rawDistance = calculateDistanceKm(userLatLng, peakLatLng)

      // 距离过滤：太远的山峰不显示
      if (rawDistance > AR_CONFIG.maxDistanceKm) continue

      // 相对方位
      const rel = relativeBearing(rawBearing, effectiveHeading)

      // 屏幕 X 百分比
      const { screenXPercent: rawScreenX, inFOV } = relativeBearingToScreenX(
        rel,
        AR_CONFIG.horizontalFOV
      )

      // 平滑 screenX 和 distance，避免抖动
      const cache = smoothRef.current[peak.id]
      const prevScreenX = cache?.screenX ?? rawScreenX
      const prevDistance = cache?.distanceKm ?? rawDistance
      const smoothedScreenX = lerp(prevScreenX, rawScreenX, AR_CONFIG.screenXSmoothing)
      const smoothedDistance = lerp(prevDistance, rawDistance, AR_CONFIG.distanceSmoothing)

      smoothRef.current[peak.id] = {
        screenX: smoothedScreenX,
        distanceKm: smoothedDistance
      }

      output.push({
        peak,
        bearingDeg: rawBearing,
        distanceKm: smoothedDistance,
        relativeDeg: rel,
        screenXPercent: smoothedScreenX,
        inFOV
      })
    }

    // 按 inFOV → 距离排序：视野内的放前面
    output.sort((a, b) => {
      if (a.inFOV !== b.inFOV) return a.inFOV ? -1 : 1
      return a.distanceKm - b.distanceKm
    })

    return output
  }, [userLatLng, heading, peaks])

  // GPS/heading 变化时清理平滑缓存（避免从一个位置跳到另一个位置时的 lag）
  useEffect(() => {
    smoothRef.current = {}
  }, [userLatLng?.lat, userLatLng?.lng])

  return {
    items,
    // 暴露 FOV 配置供调试面板读取
    fov: AR_CONFIG.horizontalFOV,
    smoothingFactors: {
      heading: AR_CONFIG.headingSmoothing,
      screenX: AR_CONFIG.screenXSmoothing,
      distance: AR_CONFIG.distanceSmoothing
    }
  }
}
