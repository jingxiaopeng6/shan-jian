/**
 * 成就系统服务 — 纯函数，无副作用
 *
 * 双轨成就体系：
 * 1. 等级头衔（5 级登山者）—— 反映整体探索进度
 * 2. 里程碑徽章（8 枚）—— 记录具体探索成就
 *
 * 数据源：
 * - exploredCount: 已打卡 NFC 景点数（来自 travelLog）
 * - totalDistanceKm: 累计探索距离（来自 trackLog）
 * - totalAttractions: NFC 景点总数（来自 nfcPoints）
 */

/** 景点 ID 常量（与 nfcPoints 中的 attractionId 保持一致） */
export const ATTRACTION_IDS = {
  JINDING: 'jinding',
  FAYUNJIE: 'fayunjie',
  YANGSHIMU: 'yangshimu',
} as const

/** 成就统计输入 */
export interface AchievementStats {
  /** 已打卡 NFC 景点数 */
  exploredCount: number
  /** 累计探索距离（km） */
  totalDistanceKm: number
  /** NFC 景点总数（大满贯判定） */
  totalAttractions: number
  /** 已打卡景点 ID 列表（用于精确判定景点类徽章） */
  visitedAttractionIds: string[]
}

/** 等级头衔 */
export interface AchievementLevel {
  /** 等级序号 1-5 */
  level: 1 | 2 | 3 | 4 | 5
  /** 头衔名称 */
  title: string
  /** 图标 emoji */
  icon: string
  /** 进度百分比 0-100 */
  progress: number
  /** 距下个等级的提示，顶级时为 null */
  nextLevelHint: string | null
}

/** 里程碑徽章 */
export interface Milestone {
  /** 唯一标识 */
  id: string
  /** 徽章名称 */
  name: string
  /** 图标 emoji */
  icon: string
  /** 描述说明 */
  description: string
  /** 是否已解锁 */
  unlocked: boolean
}

/** 等级定义表（从高到低，便于短路判定） */
const LEVEL_TABLE: Array<{
  level: AchievementLevel['level']
  title: string
  icon: string
  progress: number
  match: (s: AchievementStats) => boolean
  hint: (s: AchievementStats) => string | null
}> = [
  {
    level: 5,
    title: '钻石登山者',
    icon: '👑',
    progress: 100,
    match: (s) => s.totalAttractions > 0 && s.exploredCount >= s.totalAttractions,
    hint: () => null,
  },
  {
    level: 4,
    title: '铂金登山者',
    icon: '💎',
    progress: 75,
    match: (s) => s.exploredCount >= 3 || s.totalDistanceKm >= 15,
    hint: (s) => {
      const needExplore = Math.max(s.totalAttractions - s.exploredCount, 0)
      return `距钻石登山者还差 ${needExplore} 个景点`
    },
  },
  {
    level: 3,
    title: '黄金登山者',
    icon: '🥇',
    progress: 40,
    match: (s) => s.exploredCount >= 2 || s.totalDistanceKm >= 5,
    hint: (s) => {
      const needExplore = Math.max(3 - s.exploredCount, 0)
      const needDist = Math.max(15 - s.totalDistanceKm, 0)
      if (needExplore > 0 && needDist > 0) {
        return `距铂金登山者还差 ${needExplore} 个景点或 ${needDist.toFixed(1)} km`
      }
      if (needExplore > 0) return `距铂金登山者还差 ${needExplore} 个景点`
      return `距铂金登山者还差 ${needDist.toFixed(1)} km`
    },
  },
  {
    level: 2,
    title: '白银登山者',
    icon: '🥈',
    progress: 20,
    match: (s) => s.exploredCount >= 1,
    hint: (s) => {
      const needExplore = Math.max(2 - s.exploredCount, 0)
      const needDist = Math.max(5 - s.totalDistanceKm, 0)
      if (needExplore > 0 && needDist > 0) {
        return `距黄金登山者还差 ${needExplore} 个景点或 ${needDist.toFixed(1)} km`
      }
      if (needExplore > 0) return `距黄金登山者还差 ${needExplore} 个景点`
      return `距黄金登山者还差 ${needDist.toFixed(1)} km`
    },
  },
  {
    level: 1,
    title: '青铜登山者',
    icon: '🥉',
    progress: 0,
    match: () => true,
    hint: () => '距白银登山者还差 1 个景点',
  },
]

/** 计算成就等级 */
export function getAchievementLevel(stats: AchievementStats): AchievementLevel {
  for (const row of LEVEL_TABLE) {
    if (row.match(stats)) {
      return {
        level: row.level,
        title: row.title,
        icon: row.icon,
        progress: row.progress,
        nextLevelHint: row.hint(stats),
      }
    }
  }
  // 兜底：等级 1
  const fallback = LEVEL_TABLE[LEVEL_TABLE.length - 1]
  return {
    level: fallback.level,
    title: fallback.title,
    icon: fallback.icon,
    progress: fallback.progress,
    nextLevelHint: fallback.hint(stats),
  }
}

/** 计算里程碑徽章列表（顺序固定，便于 UI 渲染） */
export function getMilestones(
  stats: AchievementStats,
  hasGeneratedPoster: boolean
): Milestone[] {
  const { exploredCount, totalDistanceKm, totalAttractions, visitedAttractionIds } = stats
  const visited = new Set(visitedAttractionIds)

  return [
    {
      id: 'first-visit',
      name: '初访武功山',
      icon: '🎯',
      description: '首次完成 NFC 打卡',
      unlocked: exploredCount >= 1,
    },
    {
      id: 'conquer-jinding',
      name: '金顶征服者',
      icon: '🏔️',
      description: '打卡金顶',
      unlocked: visited.has(ATTRACTION_IDS.JINDING),
    },
    {
      id: 'cloud-walk',
      name: '云端漫步',
      icon: '☁️',
      description: '打卡发云界',
      unlocked: visited.has(ATTRACTION_IDS.FAYUNJIE),
    },
    {
      id: 'wild-explorer',
      name: '山野探险家',
      icon: '🦁',
      description: '打卡羊狮幕',
      unlocked: visited.has(ATTRACTION_IDS.YANGSHIMU),
    },
    {
      id: 'long-trek',
      name: '长途跋涉',
      icon: '📏',
      description: '累计探索距离 ≥ 10 km',
      unlocked: totalDistanceKm >= 10,
    },
    {
      id: 'three-wonders',
      name: '三绝集齐',
      icon: '🌟',
      description: '3 个 NFC 景点全部打卡',
      unlocked: totalAttractions > 0 && exploredCount >= totalAttractions,
    },
    {
      id: 'travel-mark',
      name: '旅行印记',
      icon: '📸',
      description: '生成第一张明信片海报',
      unlocked: hasGeneratedPoster,
    },
    {
      id: 'century-club',
      name: '百公里俱乐部',
      icon: '🏆',
      description: '累计探索距离 ≥ 100 km',
      unlocked: totalDistanceKm >= 100,
    },
  ]
}

/** 计算已解锁徽章数 */
export function countUnlockedMilestones(
  stats: AchievementStats,
  hasGeneratedPoster: boolean
): number {
  return getMilestones(stats, hasGeneratedPoster).filter((m) => m.unlocked).length
}
