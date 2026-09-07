/**
 * 开发测试专用的空间数据：
 *  - 武功山模拟游客位置（多个测试点）
 *  - 围绕每个测试点的 8 方位测试山峰（纯虚拟，用于验证 AR 映射正确性）
 *
 * 这些数据**不是**武功山真实山峰，仅用于测试 Stage 4 的空间计算和 UI。
 * 正式产品请使用 src/data/mock.ts 里的真实山峰数据。
 */

import type { Peak, UserPosition } from '../types'
import type { LatLng } from '../utils/geoUtils'

/* ======== 武功山模拟游客位置（真实武功山区域内的典型观景点） ======== */

export interface MockLocationPoint extends UserPosition {}

export const mockLocationPoints: MockLocationPoint[] = [
  {
    id: 'wgs-entrance',
    name: '武功山游客区域（山门）',
    // 武功山南门/游客中心附近
    lat: 27.4456,
    lng: 114.1489,
    elevation: 600,
    headingDeg: 0
  },
  {
    id: 'wgs-mid-slope',
    name: '武功山山腰测试点',
    // 半山腰徒步区域
    lat: 27.4612,
    lng: 114.1587,
    elevation: 1200,
    headingDeg: 0
  },
  {
    id: 'wgs-near-jinding',
    name: '金顶附近测试点',
    // 金顶脚下观景台
    lat: 27.4756,
    lng: 114.1712,
    elevation: 1800,
    headingDeg: 0
  },
  {
    id: 'wgs-guchen',
    name: '古祭坛观景台',
    lat: 27.4792,
    lng: 114.1705,
    elevation: 1890,
    headingDeg: 0
  }
]

/* ======== 8 方位测试山峰（围绕测试点均匀分布） ======== */

/**
 * 计算围绕某个中心点、在指定 bearing 方向、距离为 distanceKm 的目标坐标。
 * 使用正轴等距方位投影简化版（近场精度足够）。
 */
function pointAtBearingDistance(
  center: LatLng,
  bearingDeg: number,
  distanceKm: number
): LatLng {
  const R = 6371
  const lat1 = (center.lat * Math.PI) / 180
  const lng1 = (center.lng * Math.PI) / 180
  const brng = (bearingDeg * Math.PI) / 180
  const d = distanceKm / R

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(d) +
      Math.cos(lat1) * Math.sin(d) * Math.cos(brng)
  )
  const lng2 = lng1 + Math.atan2(
    Math.sin(brng) * Math.sin(d) * Math.cos(lat1),
    Math.cos(d) - Math.sin(lat1) * Math.sin(lat2)
  )

  return {
    lat: (lat2 * 180) / Math.PI,
    lng: (lng2 * 180) / Math.PI
  }
}

/** 生成围绕某个中心点的 8 个方位测试山峰（每个方向 1km） */
export function generateTestPeaks(center: LatLng): Peak[] {
  const directions = [
    { id: 'N',  bearing: 0,   label: '北',   pinyin: 'Bei',   color: 'north' },
    { id: 'NE', bearing: 45,  label: '东北', pinyin: 'Dongbei', color: 'northeast' },
    { id: 'E',  bearing: 90,  label: '东',   pinyin: 'Dong',   color: 'east' },
    { id: 'SE', bearing: 135, label: '东南', pinyin: 'Dongnan', color: 'southeast' },
    { id: 'S',  bearing: 180, label: '南',   pinyin: 'Nan',    color: 'south' },
    { id: 'SW', bearing: 225, label: '西南', pinyin: 'Xinan',  color: 'southwest' },
    { id: 'W',  bearing: 270, label: '西',   pinyin: 'Xi',     color: 'west' },
    { id: 'NW', bearing: 315, label: '西北', pinyin: 'Xibei',  color: 'northwest' }
  ]

  return directions.map((d) => {
    const pos = pointAtBearingDistance(center, d.bearing, 1)
    return {
      id: `test-${d.id}`,
      name: `测试山峰${d.label}`,
      pinyin: `Test ${d.pinyin}`,
      lat: pos.lat,
      lng: pos.lng,
      elevation: 1200 + d.bearing * 0.5,
      description: `开发测试用虚拟山峰，位于测试点的 ${d.label} 方向 1km 处。用于验证 AR 方向映射的正确性。`,
      bestViewTime: '测试数据',
      relatedIds: []
    }
  })
}
