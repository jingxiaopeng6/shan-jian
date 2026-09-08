/**
 * TerrainProvider — 地形高程数据抽象层
 *
 * 设计目的：
 * viewshedService 不关心高程数据来源，只调用 terrainProvider.getProfile()。
 * 当前只有 MockTerrainProvider，以后可加 DEMTerrainProvider。
 *
 *   TerrainProvider
 *   ├── MockTerrainProvider    → 生成模拟地形剖面（开发/测试）
 *   └── DEMTerrainProvider    → 读取真实 DEM 栅格（Stage 6+）
 */

import type { LatLng } from '../utils/geoUtils'

/** 地形采样点：距观察者距离（米） + 海拔（米） */
export interface TerrainSample {
  /** 距观察者的水平距离（米） */
  distance: number
  /** 该点地形海拔（米） */
  elevation: number
}

/** 观察者/目标的空间位置（含海拔） */
export interface GeoPoint extends LatLng {
  elevation: number
}

/** 地形剖面查询结果 */
export interface TerrainProfile {
  /** 采样点数组（按距离升序，首点 distance=0） */
  samples: TerrainSample[]
  /** 总水平距离（米） */
  totalDistance: number
  /** 数据来源标识 */
  source: 'mock' | 'dem'
}

export interface TerrainProvider {
  /** 获取 observer → target 之间的地形剖面 */
  getProfile(observer: GeoPoint, target: GeoPoint, sampleCount?: number): TerrainProfile
  /** 数据来源 */
  readonly source: 'mock' | 'dem'
}

/**
 * MockTerrainProvider — 模拟地形剖面生成器
 *
 * 生成策略：
 * 1. 在 observer 和 target 之间均匀采样 N 个点
 * 2. 基础地形 = observer.elevation 沿途做正弦起伏
 * 3. 可注入"中间山脊"参数，模拟遮挡场景
 *
 * 用于 Stage 5 开发测试，不依赖真实 DEM。
 */
export class MockTerrainProvider implements TerrainProvider {
  readonly source = 'mock' as const

  /** 可选：中间地形修饰器（用于测试遮挡场景） */
  private modifiers: TerrainModifier[]

  constructor(modifiers: TerrainModifier[] = []) {
    this.modifiers = modifiers
  }

  /** 设置修饰器（运行时可切换测试场景） */
  setModifiers(modifiers: TerrainModifier[]): void {
    this.modifiers = modifiers
  }

  getProfile(observer: GeoPoint, target: GeoPoint, sampleCount = 50): TerrainProfile {
    // 用 Haversine 计算总距离（米）
    const totalDistanceKm = haversineKm(observer, target)
    const totalDistance = totalDistanceKm * 1000

    const samples: TerrainSample[] = []
    const N = Math.max(2, sampleCount)

    for (let i = 0; i < N; i++) {
      const ratio = i / (N - 1) // 0 → 1
      const distance = ratio * totalDistance

      // 基础地形：在 observer 和 target 海拔之间做正弦起伏
      const baseElev = observer.elevation + (target.elevation - observer.elevation) * ratio
      const noise =
        Math.sin(distance / 300) * 25 +
        Math.sin(distance / 800) * 40 +
        Math.cos(distance / 500) * 15

      let elevation = baseElev + noise

      // 应用修饰器（中间山脊等）
      for (const mod of this.modifiers) {
        elevation = Math.max(elevation, mod.apply(distance, ratio, elevation))
      }

      samples.push({
        distance: Number(distance.toFixed(1)),
        elevation: Number(elevation.toFixed(1))
      })
    }

    return { samples, totalDistance, source: 'mock' }
  }
}

/**
 * 地形修饰器 — 在指定位置注入额外高程
 * 用于测试遮挡场景（如：中间加一个 2000m 山脊）
 */
export interface TerrainModifier {
  /** 在哪个距离（米）开始生效 */
  startDistance: number
  /** 在哪个距离（米）失效 */
  endDistance: number
  /** 峰值高度（米，取 max(原高程, 此值)） */
  peakElevation: number
  /** 标识（调试用） */
  label: string

  /** 计算在指定距离处应注入的高程（0 = 不注入） */
  apply(distance: number, ratio: number, currentElevation: number): number
}

/**
 * 创建一个钟形山脊修饰器
 * 在 [startDistance, endDistance] 范围内形成钟形隆起
 */
export function createRidge(
  startDistance: number,
  endDistance: number,
  peakElevation: number,
  label = 'ridge'
): TerrainModifier {
  return {
    startDistance,
    endDistance,
    peakElevation,
    label,
    apply(distance, _ratio, currentElevation) {
      if (distance < startDistance || distance > endDistance) return currentElevation
      // 钟形曲线：sin(π * (d - start) / (end - start))
      const bell = Math.sin((Math.PI * (distance - startDistance)) / (endDistance - startDistance))
      const injected = peakElevation * bell
      return Math.max(currentElevation, injected)
    }
  }
}

/** 创建一个平坦修饰器（强制某段为固定高度） */
export function createPlateau(
  startDistance: number,
  endDistance: number,
  elevation: number,
  label = 'plateau'
): TerrainModifier {
  return {
    startDistance,
    endDistance,
    peakElevation: elevation,
    label,
    apply(distance) {
      if (distance < startDistance || distance > endDistance) return 0
      return elevation
    }
  }
}

/** Haversine 距离（km）——避免和 geoUtils 产生循环依赖 */
function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
