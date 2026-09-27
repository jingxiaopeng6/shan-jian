/**
 * viewshedService — GIS 视域分析核心服务
 *
 * 实现 Line of Sight（视线遮挡）算法：
 *   游客位置 (observer) ─── 视线 ───→ 目标山峰 (target)
 *                        ↑ 地形剖面
 *   如果中间某个地形点的高程 > 该点理论视线高度 → 遮挡
 *
 * 不关心地形数据来源，只调用 TerrainProvider.getProfile()。
 */

import type { TerrainProvider, TerrainProfile, GeoPoint } from './TerrainProvider'
import { calculateBearing, type LatLng } from '../utils/geoUtils'

/** 视线分析结果 */
export interface ViewshedResult {
  /** 目标山峰是否可见（无遮挡） */
  visible: boolean
  /** 游客到目标的水平距离（米） */
  distance: number
  /** 海拔差 = target.elevation - observer.elevation（米） */
  elevationDifference: number
  /** 视线从游客到目标的方位角（0–360°） */
  bearing: number
  /** 遮挡信息（如果有遮挡） */
  obstruction: ObstructionInfo | null
  /** 完整地形剖面 + 视线高度（用于可视化） */
  profile: ViewshedProfilePoint[]
}

/** 遮挡点信息 */
export interface ObstructionInfo {
  /** 遮挡点距观察者的距离（米） */
  distance: number
  /** 遮挡点地形海拔（米） */
  terrainElevation: number
  /** 遮挡点理论视线高度（米） */
  lineOfSightElevation: number
  /** 地形超出视线多少米 */
  exceedAmount: number
}

/** 剖面图可视化数据点 */
export interface ViewshedProfilePoint {
  /** 距观察者的距离（米） */
  distance: number
  /** 地形海拔（米） */
  terrainElevation: number
  /** 理论视线高度（米） */
  lineOfSight: number
  /** 该点是否被遮挡 */
  blocked: boolean
}

/**
 * 单个游客 → 单座山峰的视线分析
 *
 * 算法步骤：
 * 1. 通过 TerrainProvider 获取 observer→target 之间的地形剖面
 * 2. 视线高度 = observer.elevation + (target.elevation - observer.elevation) × (d/D)
 *    即：从观察者海拔到目标海拔的线性插值
 * 3. 对每个采样点：如果 terrainElevation > lineOfSight → 被遮挡
 * 4. 返回第一个遮挡点（如果有）
 *
 * @param observer  游客位置（含海拔）
 * @param target    目标山峰（含海拔）
 * @param provider  地形数据 Provider
 * @param sampleCount 采样点数量（默认 50）
 */
export function analyzeLineOfSight(
  observer: GeoPoint,
  target: GeoPoint,
  provider: TerrainProvider,
  sampleCount = 50
): ViewshedResult {
  // 获取地形剖面
  const terrain: TerrainProfile = provider.getProfile(observer, target, sampleCount)

  const totalDistance = terrain.totalDistance
  if (totalDistance < 1) {
    return {
      visible: true,
      distance: 0,
      elevationDifference: target.elevation - observer.elevation,
      bearing: calculateBearing(observer, target),
      obstruction: null,
      profile: []
    }
  }

  // 方位角（复用 Stage 4 已验证的函数）
  const bearing = calculateBearing(observer as LatLng, target as LatLng)

  // 海拔差
  const elevationDifference = target.elevation - observer.elevation

  // 逐点检查
  let obstruction: ObstructionInfo | null = null
  const profile: ViewshedProfilePoint[] = []

  for (const sample of terrain.samples) {
    const ratio = sample.distance / totalDistance

    // 理论视线高度：从 observer 到 target 的线性插值
    // 注意：人眼高度（1.6m）由调用方在 effectiveObserver.elevation 中已包含，
    // 这里不再重复添加。target 是山峰峰顶海拔，也不加人眼高度。
    const los = observer.elevation + (target.elevation - observer.elevation) * ratio

    // 地形是否超过视线
    const blocked = sample.elevation > los + 0.5 // 0.5m 容差

    if (blocked && obstruction === null) {
      // 记录第一个遮挡点
      obstruction = {
        distance: sample.distance,
        terrainElevation: sample.elevation,
        lineOfSightElevation: los,
        exceedAmount: Number((sample.elevation - los).toFixed(1))
      }
    }

    profile.push({
      distance: sample.distance,
      terrainElevation: sample.elevation,
      lineOfSight: Number(los.toFixed(1)),
      blocked
    })
  }

  return {
    visible: obstruction === null,
    distance: totalDistance,
    elevationDifference,
    bearing,
    obstruction,
    profile
  }
}

/**
 * 批量分析：一个游客位置 → 多座山峰
 *
 * 返回每座山峰的可见性 + 距离 + 方位
 */
export function analyzeVisibility(
  observer: GeoPoint,
  mountains: Array<GeoPoint & { id: string; name: string }>,
  provider: TerrainProvider,
  sampleCount = 50
): Array<{
  id: string
  name: string
  visible: boolean
  distance: number
  bearing: number
  elevationDifference: number
  obstruction: ObstructionInfo | null
}> {
  return mountains.map((m) => {
    const result = analyzeLineOfSight(observer, m, provider, sampleCount)
    return {
      id: m.id,
      name: m.name,
      visible: result.visible,
      distance: result.distance,
      bearing: result.bearing,
      elevationDifference: result.elevationDifference,
      obstruction: result.obstruction
    }
  })
}

/** 格式化距离（米 → 友好字符串） */
export function formatDistanceM(meters: number): string {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}
