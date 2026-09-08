import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import PeakDetailPage from '../pages/PeakDetailPage'

describe('TR-7.1 山峰详情页', () => {
  it('有效 ID 渲染「金顶」/ 1918m / 关联山峰', () => {
    render(
      <MemoryRouter initialEntries={['/peak/jinding']}>
        <Routes>
          <Route path="/peak/:id" element={<PeakDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    const h1 = screen.getByRole('heading', { level: 1, name: '金顶' })
    expect(h1).toBeInTheDocument()
    expect(screen.getByText(/1918\s*m/)).toBeInTheDocument()
    expect(screen.getByText(/为什么能看到？/)).toBeInTheDocument()
    const viewLink = screen.getByRole('link', { name: /为什么能看到/ })
    expect(viewLink).toHaveAttribute('href', '/viewshed?peakId=jinding')
  })

  it('无效 ID 展示「山峰未找到」+ 返回首页链接', () => {
    render(
      <MemoryRouter initialEntries={['/peak/not-exist']}>
        <Routes>
          <Route path="/peak/:id" element={<PeakDetailPage />} />
        </Routes>
      </MemoryRouter>
    )
    expect(screen.getByText(/山峰未找到/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /返回首页/ })).toHaveAttribute('href', '/')
  })
})
