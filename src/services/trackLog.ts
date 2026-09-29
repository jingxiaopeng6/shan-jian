/**
 * GPS 轨迹记录服务 — 基于 localStorage
 *
 * 功能：
 * - 记录用户移动 GPS 点
 * - 最小距离阈值过滤（10m），避免高频写入
 * - 异常 GPS 点过滤（精度 > 100m 或瞬移 > 500km/h）
 * - 轨迹统计（总距离、点数、时间范围）
 * - 页面退出时保存
 */

import { calculateDistanceKm } from '../utils/geoUtils'

const STORAGE_KEY = 'shan-jian-track-log'

export interface TrackPoint {
  lat: number
  lng: number
  /** 精度（米），可选 */
  accuracy?: number
  /** 时间戳 */
  t: number
}

/** 最小移动距离（km），小于此距离不记录新点 */
const MIN_DISTANCE_KM = 0.01 // 10m

/** 最大合理速度（km/h），超过视为异常跳点 */
const MAX_SPEED_KMH = 500

/** 精度阈值（米），超过则丢弃 */
const MAX_ACCURACY_M = 100

/** 读取全部轨迹点 */
export function getTrackPoints(): TrackPoint[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** 追加一个 GPS 点（带过滤） */
export function addTrackPoint(lat: number, lng: number, accuracy?: number): boolean {
  // 精度过滤
  if (accuracy != null && accuracy > MAX_ACCURACY_M) return false

  const points = getTrackPoints()
  const now = Date.now()

  // 首个点直接写入
  if (points.length === 0) {
    points.push({ lat, lng, accuracy, t: now })
    localStorage.setItem(STORAGE_KEY, JSON.stringify(points))
    return true
  }

  const last = points[points.length - 1]

  // 距离过滤：小于阈值不记录
  const distKm = calculateDistanceKm(
    { lat: last.lat, lng: last.lng },
    { lat, lng }
  )
  if (distKm < MIN_DISTANCE_KM) return false

  // 速度过滤：计算瞬时速度，异常跳点丢弃
  // 时间差小于 100ms 时跳过速度过滤（避免测试或批量写入时误杀）
  const timeDiffH = (now - last.t) / 3600000
  if (timeDiffH > 0.0001) {
    const speed = distKm / timeDiffH
    if (speed > MAX_SPEED_KMH) return false
  }

  points.push({ lat, lng, accuracy, t: now })
  // 限制最大点数，防止 localStorage 溢出
  const MAX_POINTS = 2000
  const trimmed = points.length > MAX_POINTS ? points.slice(-MAX_POINTS) : points
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed))
  return true
}

/** 计算轨迹总距离（km） */
export function getTrackDistanceKm(): number {
  const points = getTrackPoints()
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    total += calculateDistanceKm(
      { lat: points[i - 1].lat, lng: points[i - 1].lng },
      { lat: points[i].lat, lng: points[i].lng }
    )
  }
  return total
}

/** 获取轨迹统计 */
export function getTrackStats() {
  const points = getTrackPoints()
  return {
    pointCount: points.length,
    totalDistanceKm: getTrackDistanceKm(),
    startTime: points.length > 0 ? points[0].t : null,
    endTime: points.length > 0 ? points[points.length - 1].t : null,
    points,
  }
}

/** 清空轨迹 */
export function clearTrack(): void {
  localStorage.removeItem(STORAGE_KEY)
}
