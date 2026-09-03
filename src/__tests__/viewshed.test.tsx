import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViewshedPage from '../pages/ViewshedPage'

describe('TR-8.1 / TR-8.2 视域分析页', () => {
  it('可见山峰清单条目数 >= 5 且含名称/海拔/距离', () => {
    render(
      <MemoryRouter>
        <ViewshedPage />
      </MemoryRouter>
    )
    const list = screen.getByRole('list')
    const items = list.querySelectorAll('li')
    expect(items.length).toBeGreaterThanOrEqual(5)
    // 检查第一条包含 km（距离）
    const first = items[0]?.textContent ?? ''
    expect(first).toMatch(/km/)
    // 海拔检查
    expect(first).toMatch(/\d+\s*m/)
  })

  it('两个 SVG 可视化存在且含 >= 3 几何子元素', () => {
    render(
      <MemoryRouter>
        <ViewshedPage />
      </MemoryRouter>
    )
    const plan = screen.getByTestId('viewshed-plan-svg')
    const profile = screen.getByTestId('viewshed-profile-svg')
    expect(plan).toBeInTheDocument()
    expect(profile).toBeInTheDocument()
    const planGeoms = plan.querySelectorAll('path, circle, line, text, polygon')
    const profileGeoms = profile.querySelectorAll('path, line, circle, text')
    expect(planGeoms.length).toBeGreaterThanOrEqual(3)
    expect(profileGeoms.length).toBeGreaterThanOrEqual(3)
  })
})
