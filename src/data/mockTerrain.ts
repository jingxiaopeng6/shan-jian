/**
 * 测试地形场景
 *
 * 预设两种典型场景用于验证 Line of Sight 算法：
 * - 场景 A：无遮挡（游客 → 平缓地形 → 金顶）
 * - 场景 B：有遮挡（游客 → 中间山脊 2100m → 金顶）
 *
 * 以及"换位置对比"测试数据。
 */

import { MockTerrainProvider, createRidge, type TerrainModifier } from '../gis/TerrainProvider'
import type { GeoPoint } from '../gis/TerrainProvider'
import type { Peak } from '../types'
import { defaultUserPosition, getPeakById, peaks } from './mock'

/** 获取金顶作为标准测试目标 */
export const testTarget: GeoPoint & { id: string; name: string } = (() => {
  const p = getPeakById('jinding')!
  return { id: p.id, name: p.name, lat: p.lat, lng: p.lng, elevation: p.elevation }
})()

/** 测试场景 A：无遮挡 */
export const testCaseA = {
  label: '案例 A：无遮挡',
  description: '游客在金顶观景台，地形平缓，视线直达金顶',
  observer: {
    ...defaultUserPosition,
    lat: 27.4750,
    lng: 114.1700,
    elevation: 1850
  } as GeoPoint,
  target: testTarget,
  modifiers: [] as TerrainModifier[]
}

/** 测试场景 B：有遮挡（中间 2100m 山脊） */
export const testCaseB = {
  label: '案例 B：有遮挡',
  description: '游客在低海拔位置，中间有一道 2100m 山脊遮挡视线',
  observer: {
    ...defaultUserPosition,
    lat: 27.4600,
    lng: 114.1500,
    elevation: 1200
  } as GeoPoint,
  target: testTarget,
  modifiers: [
    // 在距离 1500m–2500m 处放一个 2100m 的山脊
    createRidge(1500, 2500, 2100, '遮挡山脊')
  ]
}

/** 测试场景 C：换位置 — 同一座山，不同游客位置 */
export const testCaseC = {
  label: '案例 C：换位置对比',
  description: '同一座金顶，从不同位置观察，可见性不同',
  observerA: {
    lat: 27.4750,
    lng: 114.1700,
    elevation: 1850
  } as GeoPoint,
  observerB: {
    lat: 27.4600,
    lng: 114.1500,
    elevation: 1100
  } as GeoPoint,
  target: testTarget,
  // observerB 有遮挡山脊
  modifiersB: [createRidge(1200, 2000, 2050, '遮挡山脊')]
}

/** 从测试场景创建 TerrainProvider */
export function createTerrainProvider(modifiers: TerrainModifier[] = []): MockTerrainProvider {
  return new MockTerrainProvider(modifiers)
}

/** 获取所有真实山峰作为 GeoPoint（用于批量分析） */
export function getAllPeaksAsGeoPoints(): Array<GeoPoint & { id: string; name: string }> {
  return peaks.map((p: Peak) => ({
    id: p.id,
    name: p.name,
    lat: p.lat,
    lng: p.lng,
    elevation: p.elevation
  }))
}

/** 模拟游客位置列表（用于"换位置"测试） */
export const testObserverPositions: Array<GeoPoint & { id: string; name: string }> = [
  {
    id: 'pos-jinding-platform',
    name: '金顶观景台 (1850m)',
    lat: 27.4750,
    lng: 114.1700,
    elevation: 1850
  },
  {
    id: 'pos-mid-slope',
    name: '山腰测试点 (1200m)',
    lat: 27.4600,
    lng: 114.1500,
    elevation: 1200
  },
  {
    id: 'pos-valley',
    name: '山谷测试点 (800m)',
    lat: 27.4500,
    lng: 114.1400,
    elevation: 800
  }
]
