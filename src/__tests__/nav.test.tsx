import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import PeakDetailPage from '../pages/PeakDetailPage'

describe('TR-3.2 关键跳转链接', () => {
  it('首页 CTA 「进入武功山」跳转到 /map', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )
    const cta = screen.getByRole('link', { name: /进入武功山/ })
    expect(cta).toHaveAttribute('href', '/map')
  })

  it('首页「快速体验 AR 看山」跳转到 /ar', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </MemoryRouter>
    )
    const cta = screen.getByRole('link', { name: /快速体验 AR 看山/ })
    expect(cta).toHaveAttribute('href', '/ar')
  })

  it('详情页「为什么能看到？」是 Link，href = /viewshed', () => {
    render(
      <MemoryRouter initialEntries={['/peak/jinding']}>
        <Routes>
          <Route path="/peak/:id" element={<PeakDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /为什么能看到/ })
    expect(link).toHaveAttribute('href', '/viewshed')
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
