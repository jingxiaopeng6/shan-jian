import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ViewshedPage from '../pages/ViewshedPage'

describe('Stage 5 视域分析页', () => {
  it('渲染剖面图 SVG 且含 >= 3 几何子元素', () => {
    render(
      <MemoryRouter>
        <ViewshedPage />
      </MemoryRouter>
    )
    const profile = screen.getByTestId('viewshed-profile-svg')
    expect(profile).toBeInTheDocument()
    const geoms = profile.querySelectorAll('path, line, circle, text')
    expect(geoms.length).toBeGreaterThanOrEqual(3)
  })

  it('显示视线分析结果（可见/遮挡关键词）', () => {
    render(
      <MemoryRouter>
        <ViewshedPage />
      </MemoryRouter>
    )
    const body = document.body
    expect(body.textContent).toMatch(/视线/)
    expect(body.textContent).toMatch(/无遮挡|遮挡/)
  })

  it('显示距离和海拔数据', () => {
    render(
      <MemoryRouter>
        <ViewshedPage />
      </MemoryRouter>
    )
    const body = document.body
    expect(body.textContent).toMatch(/km|m/)
    expect(body.textContent).toMatch(/海拔/)
  })
})
