import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import PeakDetailPage from '../pages/PeakDetailPage'

describe('TR-3.2 关键跳转链接', () => {
  it('首页 CTA 「开始探索武功山」跳转到 /map', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )
    const cta = screen.getByRole('link', { name: /开始探索武功山/ })
    expect(cta).toHaveAttribute('href', '/map')
  })

  it('首页「AR 看山」功能标签存在（沉浸式 Hero 设计，通过主 CTA 进入）', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )
    // 新设计：AR 看山 是功能标签文字，不再是独立链接
    // 用户通过「开始探索武功山」主 CTA 进入 /map，再从地图访问 AR
    const label = screen.getByText(/AR 看山/)
    expect(label).toBeInTheDocument()
  })

  it('详情页「视域分析」是 Link，href 含 /viewshed', () => {
    render(
      <MemoryRouter initialEntries={['/peak/jinding']}>
        <Routes>
          <Route path="/peak/:id" element={<PeakDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /视域分析/ })
    expect(link).toHaveAttribute('href', '/viewshed?peakId=jinding')
  })

  it('详情页「返回 AR 看山」按钮存在（useNavigate 实现）', () => {
    render(
      <MemoryRouter initialEntries={['/peak/jinding']}>
        <Routes>
          <Route path="/peak/:id" element={<PeakDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    const btn = screen.getByRole('button', { name: /返回 AR 看山/ })
    expect(btn).toBeInTheDocument()
  })
})
