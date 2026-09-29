import { describe, it, expect } from 'vitest'
import {
  getAchievementLevel,
  getMilestones,
  countUnlockedMilestones,
  ATTRACTION_IDS,
  type AchievementStats,
} from '../services/achievementService'

const TOTAL = 3

function makeStats(over: Partial<AchievementStats>): AchievementStats {
  return {
    exploredCount: 0,
    totalDistanceKm: 0,
    totalAttractions: TOTAL,
    visitedAttractionIds: [],
    ...over,
  }
}

describe('getAchievementLevel', () => {
  it('零探索 → 青铜登山者（等级 1，0%）', () => {
    const lvl = getAchievementLevel(makeStats({}))
    expect(lvl.level).toBe(1)
    expect(lvl.title).toBe('青铜登山者')
    expect(lvl.icon).toBe('🥉')
    expect(lvl.progress).toBe(0)
    expect(lvl.nextLevelHint).toMatch(/白银/)
  })

  it('打卡 1 个 → 白银登山者（等级 2，20%）', () => {
    const lvl = getAchievementLevel(makeStats({ exploredCount: 1 }))
    expect(lvl.level).toBe(2)
    expect(lvl.title).toBe('白银登山者')
    expect(lvl.progress).toBe(20)
    expect(lvl.nextLevelHint).toMatch(/黄金/)
  })

  it('打卡 2 个 → 黄金登山者（等级 3，40%）', () => {
    const lvl = getAchievementLevel(makeStats({ exploredCount: 2 }))
    expect(lvl.level).toBe(3)
    expect(lvl.title).toBe('黄金登山者')
    expect(lvl.progress).toBe(40)
  })

  it('累计距离 ≥ 5km 也可触发黄金登山者', () => {
    const lvl = getAchievementLevel(makeStats({ totalDistanceKm: 5.5 }))
    expect(lvl.level).toBe(3)
  })

  it('打卡 3 个（未满） → 铂金登山者（等级 4，75%）', () => {
    const lvl = getAchievementLevel(makeStats({ exploredCount: 3, totalAttractions: 5 }))
    expect(lvl.level).toBe(4)
    expect(lvl.title).toBe('铂金登山者')
    expect(lvl.progress).toBe(75)
  })

  it('累计距离 ≥ 15km 也可触发铂金登山者', () => {
    const lvl = getAchievementLevel(makeStats({ totalDistanceKm: 20 }))
    expect(lvl.level).toBe(4)
  })

  it('打卡全部 NFC 景点 → 钻石登山者（等级 5，100%）', () => {
    const lvl = getAchievementLevel(makeStats({ exploredCount: TOTAL }))
    expect(lvl.level).toBe(5)
    expect(lvl.title).toBe('钻石登山者')
    expect(lvl.progress).toBe(100)
    expect(lvl.nextLevelHint).toBeNull()
  })

  it('totalAttractions = 0 不会误判为钻石', () => {
    const lvl = getAchievementLevel(makeStats({ exploredCount: 0, totalAttractions: 0 }))
    expect(lvl.level).toBe(1)
  })

  it('等级提示包含具体差值（景点数）', () => {
    const lvl = getAchievementLevel(makeStats({ exploredCount: 1 }))
    expect(lvl.nextLevelHint).toMatch(/1 个景点/)
  })
})

describe('getMilestones', () => {
  it('零探索、未生成海报 → 全部未解锁', () => {
    const ms = getMilestones(makeStats({}), false)
    expect(ms).toHaveLength(8)
    expect(ms.every((m) => !m.unlocked)).toBe(true)
  })

  it('首次打卡金顶 → 解锁初访 + 金顶征服者', () => {
    const ms = getMilestones(
      makeStats({ exploredCount: 1, visitedAttractionIds: [ATTRACTION_IDS.JINDING] }),
      false
    )
    const unlocked = ms.filter((m) => m.unlocked).map((m) => m.id)
    expect(unlocked).toContain('first-visit')
    expect(unlocked).toContain('conquer-jinding')
  })

  it('打卡发云界 → 解锁云端漫步（不解锁金顶征服者）', () => {
    const ms = getMilestones(
      makeStats({ exploredCount: 1, visitedAttractionIds: [ATTRACTION_IDS.FAYUNJIE] }),
      false
    )
    expect(ms.find((m) => m.id === 'cloud-walk')?.unlocked).toBe(true)
    expect(ms.find((m) => m.id === 'conquer-jinding')?.unlocked).toBe(false)
  })

  it('打卡羊狮幕 → 解锁山野探险家', () => {
    const ms = getMilestones(
      makeStats({ exploredCount: 1, visitedAttractionIds: [ATTRACTION_IDS.YANGSHIMU] }),
      false
    )
    expect(ms.find((m) => m.id === 'wild-explorer')?.unlocked).toBe(true)
  })

  it('3 个景点全部打卡 → 解锁山野探险家 + 三绝集齐', () => {
    const ms = getMilestones(
      makeStats({
        exploredCount: TOTAL,
        visitedAttractionIds: [ATTRACTION_IDS.JINDING, ATTRACTION_IDS.FAYUNJIE, ATTRACTION_IDS.YANGSHIMU],
      }),
      false
    )
    expect(ms.find((m) => m.id === 'wild-explorer')?.unlocked).toBe(true)
    expect(ms.find((m) => m.id === 'three-wonders')?.unlocked).toBe(true)
    expect(ms.find((m) => m.id === 'conquer-jinding')?.unlocked).toBe(true)
    expect(ms.find((m) => m.id === 'cloud-walk')?.unlocked).toBe(true)
  })

  it('距离 ≥ 10km → 解锁长途跋涉', () => {
    const ms = getMilestones(makeStats({ totalDistanceKm: 12 }), false)
    expect(ms.find((m) => m.id === 'long-trek')?.unlocked).toBe(true)
  })

  it('距离 ≥ 100km → 解锁百公里俱乐部', () => {
    const ms = getMilestones(makeStats({ totalDistanceKm: 150 }), false)
    expect(ms.find((m) => m.id === 'century-club')?.unlocked).toBe(true)
  })

  it('hasGeneratedPoster=true → 解锁旅行印记', () => {
    const ms = getMilestones(makeStats({}), true)
    expect(ms.find((m) => m.id === 'travel-mark')?.unlocked).toBe(true)
  })

  it('徽章顺序固定（id 数组保持稳定）', () => {
    const ms = getMilestones(makeStats({}), false)
    const ids = ms.map((m) => m.id)
    expect(ids).toEqual([
      'first-visit',
      'conquer-jinding',
      'cloud-walk',
      'wild-explorer',
      'long-trek',
      'three-wonders',
      'travel-mark',
      'century-club',
    ])
  })
})

describe('countUnlockedMilestones', () => {
  it('零探索、无海报 → 0', () => {
    expect(countUnlockedMilestones(makeStats({}), false)).toBe(0)
  })

  it('全成就解锁 → 8', () => {
    expect(
      countUnlockedMilestones(
        makeStats({
          exploredCount: TOTAL,
          totalDistanceKm: 120,
          visitedAttractionIds: [ATTRACTION_IDS.JINDING, ATTRACTION_IDS.FAYUNJIE, ATTRACTION_IDS.YANGSHIMU],
        }),
        true
      )
    ).toBe(8)
  })

  it('只打卡金顶 → 2 个（first-visit + conquer-jinding）', () => {
    expect(
      countUnlockedMilestones(
        makeStats({ exploredCount: 1, visitedAttractionIds: [ATTRACTION_IDS.JINDING] }),
        false
      )
    ).toBe(2)
  })
})
