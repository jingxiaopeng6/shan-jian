/**
 * 地理计算工具函数库
 *
 * 提供 Haversine 距离、地理方位角、角度归一化、相对方位角、
 * 以及相对方位到水平屏幕百分比的转换。
 *
 * 所有坐标均为 WGS84：latitude (°N), longitude (°E)
 * 所有角度均以 ° 为单位，且最终归一化到 [0, 360)。
 */

const EARTH_RADIUS_KM = 6371

export interface LatLng {
  lat: number
  lng: number
}

/**
 * Haversine 公式计算两点间的地表距离（km）
 */
export function calculateDistanceKm(a: LatLng, b: LatLng): number {
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180

  const sinDLat = Math.sin(dLat / 2)
  const sinDLng = Math.sin(dLng / 2)
  const h = sinDLat * sinDLat +
    Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))

  return EARTH_RADIUS_KM * c
}

/**
 * 计算从点 a 看点 b 的方位角 bearing（0–360°）
 * 定义：0=北, 90=东, 180=南, 270=西
 * 使用标准测地方位角公式（考虑经纬度都不为 0 的一般情况）
 */
export function calculateBearing(a: LatLng, b: LatLng): number {
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180

  const y = Math.sin(dLng) * Math.cos(lat2)
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)

  let bearing = (Math.atan2(y, x) * 180) / Math.PI
  // 归一化到 [0, 360)
  return ((bearing % 360) + 360) % 360
}

/**
 * 归一化任意角度到 [0, 360)
 */
export function normalizeAngle(deg: number): number {
  return ((deg % 360) + 360) % 360
}

/**
 * 计算两个方位角之间的最小有符号差值（-180 ~ +180）
 * positive → b 相对于 a 在顺时针方向
 * negative → b 相对于 a 在逆时针方向
 *
 * 正确处理跨 0°/360° 边界：
 *   angleSignedDiff(5, 355) = 10  （山峰 5°，手机 355°，山峰在右侧 10°）
 *   angleSignedDiff(355, 5) = -10
 */
export function angleSignedDiff(from: number, to: number): number {
  let diff = normalizeAngle(to) - normalizeAngle(from)
  if (diff > 180) diff -= 360
  if (diff < -180) diff += 360
  return diff
}

/**
 * 将山峰的绝对方位角 bearing 转换成相对手机朝向 heading 的角度
 * 正值 = 山峰在右侧，负值 = 在左侧，0 = 正对
 * 结果范围 (-180, 180]
 */
export function relativeBearing(bearing: number, heading: number): number {
  return angleSignedDiff(heading, bearing)
}

/**
 * 已知相对方位 + 摄像头水平 FOV，计算山峰中心在屏幕上的 X 百分比
 *
 * 约定：
 *   screenXPercent = 50% → 正好屏幕中央（正对）
 *   screenXPercent > 50% → 偏右
 *   screenXPercent < 50% → 偏左
 *   若相对方位超出 ±FOV/2，则 inFOV=false，返回 null
 *
 * @param relative 山峰相对手机的角度，正值=右，负值=左
 * @param fovDeg   摄像头水平 FOV（度），默认 60°
 */
export function relativeBearingToScreenX(
  relative: number,
  fovDeg = 60
): { screenXPercent: number; inFOV: boolean } {
  const half = fovDeg / 2
  const inFOV = relative >= -half && relative <= half

  if (!inFOV) {
    // 超出视野，返回极限值（方便做边缘箭头提示时用）
    const clamped = Math.max(-half * 2, Math.min(half * 2, relative))
    const pct = 50 + (clamped / half) * 25
    return { screenXPercent: pct, inFOV: false }
  }

  // 线性映射：-half → 0%，0 → 50%，+half → 100%
  const ratio = relative / half // 范围 [-1, 1]
  const pct = 50 + ratio * 50
  return { screenXPercent: Math.max(0, Math.min(100, pct)), inFOV: true }
}

/**
 * 简单 lerp 平滑（线性插值）
 * factor ∈ (0, 1]，越大越灵敏；越小越平稳
 */
export function lerp(current: number, target: number, factor: number): number {
  if (factor <= 0) return current
  if (factor >= 1) return target
  return current + (target - current) * factor
}

/**
 * 方位角专用平滑（正确处理 0°/360° 跳变）
 */
export function lerpAngle(current: number, target: number, factor: number): number {
  const diff = angleSignedDiff(current, target)
  const smoothed = current + diff * factor
  return normalizeAngle(smoothed)
}

/** 把距离（km）格式化成友好字符串 */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}
