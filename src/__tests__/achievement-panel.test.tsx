import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import AchievementPanel from '../components/AchievementPanel'

describe('AchievementPanel 组件', () => {
  it('零探索状态下渲染等级 1 头衔', () => {
    const { container } = render(
      <AchievementPanel
        stats={{ exploredCount: 0, totalDistanceKm: 0, totalAttractions: 3 }}
        hasGeneratedPoster={false}
      />
    )
    expect(screen.getByText(/青铜登山者/)).toBeInTheDocument()
    // 等级 / 总数：跨多个 span 渲染，用 textContent 检查
    expect(container.textContent).toMatch(/1\s*\/\s*5/)
  })

  it('等级卡显示进度条', () => {
    const { container } = render(
      <AchievementPanel
        stats={{ exploredCount: 1, totalDistanceKm: 0, totalAttractions: 3 }}
        hasGeneratedPoster={false}
      />
    )
    const progress = container.querySelector('[data-testid="level-progress"]')
    expect(progress).toBeTruthy()
  })

  it('徽章墙渲染 8 枚徽章', () => {
    const { container } = render(
      <AchievementPanel
        stats={{ exploredCount: 0, totalDistanceKm: 0, totalAttractions: 3 }}
        hasGeneratedPoster={false}
      />
    )
    // 8 枚 milestone 子项都带 title 属性（描述），容器 badge-wall 没有，借此区分
    const badges = container.querySelectorAll('[data-testid^="badge-"][title]')
    expect(badges.length).toBe(8)
  })

  it('已生成海报 → 旅行印记徽章已解锁', () => {
    const { container } = render(
      <AchievementPanel
        stats={{ exploredCount: 0, totalDistanceKm: 0, totalAttractions: 3 }}
        hasGeneratedPoster={true}
      />
    )
    const badge = container.querySelector('[data-testid="badge-travel-mark"]')
    expect(badge?.textContent).toMatch(/📸/)
  })

  it('打卡 3 个全部 → 钻石登山者 + 钻石无下级提示', () => {
    render(
      <AchievementPanel
        stats={{ exploredCount: 3, totalDistanceKm: 0, totalAttractions: 3 }}
        hasGeneratedPoster={false}
      />
    )
    expect(screen.getByText(/钻石登山者/)).toBeInTheDocument()
    expect(screen.getByText(/已达成最高等级/)).toBeInTheDocument()
  })

  it('显示已解锁徽章数 / 总数', () => {
    const { container } = render(
      <AchievementPanel
        stats={{ exploredCount: 1, totalDistanceKm: 0, totalAttractions: 3 }}
        hasGeneratedPoster={false}
      />
    )
    // 1 个景点 → first-visit + conquer-jinding = 2 枚
    // 数值与总数被分隔为多个文本节点，用 textContent 检查
    expect(container.textContent).toMatch(/2\s*\/\s*8/)
  })
})

describe('JourneyPage 集成成就系统', () => {
  it('页面渲染包含等级卡 + 徽章墙 + 明信片按钮', async () => {
    const { default: JourneyPage } = await import('../pages/JourneyPage')
    render(
      <MemoryRouter>
        <JourneyPage />
      </MemoryRouter>
    )
    // 等级卡（默认青铜登山者，无打卡）—— 用精确文本避免误匹配 nextLevelHint 中的「白银登山者」
    expect(screen.getByText('青铜登山者', { exact: true })).toBeInTheDocument()
    // 明信片按钮
    expect(screen.getByText('制作明信片')).toBeInTheDocument()
    // 徽章墙标题
    expect(screen.getByText(/里程碑徽章/)).toBeInTheDocument()
  })
})
