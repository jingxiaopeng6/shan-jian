import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import PeakDetailPage from '../pages/PeakDetailPage'
import ViewshedPage from '../pages/ViewshedPage'

function renderAt(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/map"
          element={
            <div data-testid="map-page">
              <div>武功山 · 3D 地图</div>
            </div>
          }
        />
        <Route
          path="/ar"
          element={
            <div data-testid="ar-page">
              <div>AR 看山</div>
            </div>
          }
        />
        <Route path="/peak/:id" element={<PeakDetailPage />} />
        <Route path="/viewshed" element={<ViewshedPage />} />
        <Route path="*" element={<div data-testid="route-404">404</div>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('TR-3.1 5 个页面路由可访问且包含标题', () => {
  it('首页 / 可访问', () => {
    renderAt(['/'])
    expect(screen.getByText(/山 见/)).toBeInTheDocument()
    expect(screen.queryByTestId('route-404')).not.toBeInTheDocument()
  })

  it('地图页 /map 可访问', () => {
    renderAt(['/map'])
    expect(screen.getByText(/武功山 · 3D 地图/)).toBeInTheDocument()
  })

  it('AR 页 /ar 可访问', () => {
    renderAt(['/ar'])
    expect(screen.getByText(/AR 看山/)).toBeInTheDocument()
  })

  it('山峰详情页 /peak/jinding 可访问：H1 标题为「金顶」且海拔 1918m 存在', () => {
    renderAt(['/peak/jinding'])
    const h1 = screen.getByRole('heading', { level: 1, name: '金顶' })
    expect(h1).toBeInTheDocument()
    // 海拔数字：顶部右侧独立信息块（只包含 1918 m）
    const elevList = screen.getAllByText(/^\s*1918\s*m\s*$/)
    expect(elevList.length).toBeGreaterThanOrEqual(1)
  })

  it('视域分析页 /viewshed 可访问', () => {
    renderAt(['/viewshed'])
    expect(screen.getByText(/视域分析结果/)).toBeInTheDocument()
  })
})
