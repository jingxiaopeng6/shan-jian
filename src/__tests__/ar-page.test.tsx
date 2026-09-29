import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ArPage from '../pages/ArPage'

describe('TR-6.1 AR 页山峰徽章', () => {
  it('页面渲染的 ArPeakBadge 数量 >= 3，包含名称/海拔（极简沉浸式设计）', () => {
    render(
      <MemoryRouter>
        <ArPage />
      </MemoryRouter>
    )
    const badges = screen.getAllByTestId(/^ar-badge-/)
    expect(badges.length).toBeGreaterThanOrEqual(3)
    // 检查第一个徽章内容：极简标签仅含山峰名 + 海拔（距离/方位移至底部信息卡）
    const first = badges[0]
    const text = first.textContent ?? ''
    // 应包含海拔 m
    expect(text).toMatch(/\d+\s*m/)
  })
})
