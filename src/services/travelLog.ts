/**
 * 旅行记录服务 — 基于 localStorage 的 MVP 本地打卡记录
 *
 * 不需要后端，数据保存在浏览器本地。
 * 功能：新增打卡、查询记录、判断是否已打卡、防重复。
 */

const STORAGE_KEY = 'shan-jian-travel-log'

export interface VisitRecord {
  visitId: string
  attractionId: string
  name: string
  badge?: string
  badgeIcon?: string
  timestamp: number
  latitude?: number
  longitude?: number
}

/** 读取全部打卡记录 */
export function getVisits(): VisitRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const arr = JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

/** 判断某景点是否已打卡 */
export function hasVisited(attractionId: string): boolean {
  return getVisits().some((v) => v.attractionId === attractionId)
}

/** 获取某景点的打卡记录 */
export function getVisit(attractionId: string): VisitRecord | undefined {
  return getVisits().find((v) => v.attractionId === attractionId)
}

/** 防重复打卡间隔（毫秒）：同一景点 5 分钟内不重复打卡 */
const REPEAT_THRESHOLD = 5 * 60 * 1000

/**
 * 新增打卡记录
 * @returns 成功返回记录，重复返回 null
 */
export function addVisit(
  attractionId: string,
  name: string,
  opts?: {
    badge?: string
    badgeIcon?: string
    latitude?: number
    longitude?: number
  }
): VisitRecord | null {
  const visits = getVisits()
  const existing = visits.find((v) => v.attractionId === attractionId)
  if (existing) {
    // 首次已打卡，检查时间间隔
    if (Date.now() - existing.timestamp < REPEAT_THRESHOLD) {
      return null // 防重复
    }
    // 超过间隔，更新时间
    existing.timestamp = Date.now()
    if (opts?.latitude != null) existing.latitude = opts.latitude
    if (opts?.longitude != null) existing.longitude = opts.longitude
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
    return existing
  }

  // 首次打卡
  const record: VisitRecord = {
    visitId: `visit-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    attractionId,
    name,
    badge: opts?.badge,
    badgeIcon: opts?.badgeIcon,
    timestamp: Date.now(),
    latitude: opts?.latitude,
    longitude: opts?.longitude,
  }
  visits.push(record)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(visits))
  return record
}

/** 清除所有记录（开发/测试用） */
export function clearVisits(): void {
  localStorage.removeItem(STORAGE_KEY)
}
