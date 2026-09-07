import { useState } from 'react'
import { mockLocationPoints, generateTestPeaks } from '../data/mockLocations'
import { peaks as realPeaks } from '../data/mock'
import type { Peak } from '../types'
import type { LocationProvider } from '../hooks/useLocationProvider'
import type { OrientationProvider } from '../hooks/useOrientationProvider'

interface Props {
  location: LocationProvider
  orientation: OrientationProvider
  onPeaksChange?: (peaks: Peak[] | 'real') => void
}

/**
 * 开发专用"空间模拟测试"面板
 * - 模拟位置选择 / 自定义经纬度
 * - 模拟方向 ±15° + 自动旋转
 * - 切换 8 方位测试山峰 / 真实武功山山峰
 *
 * 仅在 import.meta.env.DEV 环境渲染。
 */
export default function SpatialTestPanel({ location, orientation, onPeaksChange }: Props) {
  const [peaksMode, setPeaksMode] = useState<'test' | 'real'>('test')
  const [customLat, setCustomLat] = useState('')
  const [customLng, setCustomLng] = useState('')
  const [headingInput, setHeadingInput] = useState('')

  const applyCustom = () => {
    const lat = parseFloat(customLat)
    const lng = parseFloat(customLng)
    if (isNaN(lat) || isNaN(lng)) return
    location.setCustomMock(lat, lng)
  }

  const applyPeaksMode = (mode: 'test' | 'real') => {
    setPeaksMode(mode)
    if (onPeaksChange) {
      if (mode === 'test' && location.latLng) {
        onPeaksChange(generateTestPeaks(location.latLng))
      } else {
        onPeaksChange('real')
      }
    }
  }

  // 如果切换了位置，测试山峰需要重新生成
  const switchLocation = (id: string) => {
    const p = mockLocationPoints.find((x) => x.id === id)
    if (p) {
      location.setMockPoint(p)
      // 如果当前是测试山峰模式，也要重新生成
      if (peaksMode === 'test' && location.latLng) {
        setTimeout(() => {
          if (onPeaksChange && location.latLng) {
            onPeaksChange(generateTestPeaks(location.latLng))
          }
        }, 0)
      }
    }
  }

  return (
    <div className="mt-4 rounded-xl bg-white border border-sand-300 p-3 text-[11px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-sand-700 font-medium tracking-wide">
          🧪 空间模拟测试（DEV ONLY）
        </span>
        <div className="flex items-center gap-1">
          <label className="text-[10px] text-stone2-500">
            <input
              type="checkbox"
              checked={location.isMock}
              onChange={(e) => {
                // 通过 mockPoint 的 setter 来启用/禁用 mock
                if (e.target.checked && !location.mockPoint) {
                  location.setMockPoint(mockLocationPoints[0])
                } else if (!e.target.checked) {
                  location.setMockPoint(null)
                }
              }}
              className="mr-1"
            />
            模拟位置
          </label>
          <label className="text-[10px] text-stone2-500 ml-2">
            <input
              type="checkbox"
              checked={orientation.isMock}
              onChange={(e) => {
                if (e.target.checked) orientation.setMockHeading(orientation.heading ?? 0)
                else orientation.stop()
              }}
              className="mr-1"
            />
            模拟方向
          </label>
        </div>
      </div>

      {/* 模拟位置选择 */}
      <section className="mb-2">
        <div className="text-[10px] text-stone2-500 mb-1">📍 模拟位置</div>
        <div className="flex flex-wrap gap-1">
          {mockLocationPoints.map((p) => {
            const active = location.isMock && location.mockPoint?.id === p.id
            return (
              <button
                key={p.id}
                type="button"
                disabled={!location.isMock}
                onClick={() => switchLocation(p.id)}
                className={`h-7 px-2 rounded text-[10px] border transition ${
                  active
                    ? 'bg-forest-700 text-white border-forest-700'
                    : 'bg-forest-50 text-forest-700 border-forest-200 hover:bg-forest-100'
                } ${!location.isMock ? 'opacity-40 pointer-events-none' : ''}`}
              >
                {p.name}
              </button>
            )
          })}
        </div>
        {/* 自定义经纬度 */}
        <div className="mt-1.5 flex items-center gap-1">
          <input
            type="number"
            step="0.000001"
            placeholder="Lat"
            value={customLat}
            onChange={(e) => setCustomLat(e.target.value)}
            className="w-24 h-6 px-1.5 text-[10px] border border-forest-200 rounded bg-white font-mono text-forest-800 focus:outline-none focus:border-forest-500"
          />
          <input
            type="number"
            step="0.000001"
            placeholder="Lng"
            value={customLng}
            onChange={(e) => setCustomLng(e.target.value)}
            className="w-24 h-6 px-1.5 text-[10px] border border-forest-200 rounded bg-white font-mono text-forest-800 focus:outline-none focus:border-forest-500"
          />
          <button
            type="button"
            onClick={applyCustom}
            disabled={!location.isMock}
            className="h-6 px-2 rounded text-[10px] bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-40"
          >
            应用
          </button>
        </div>
      </section>

      {/* 山峰选择 */}
      <section className="mb-2">
        <div className="text-[10px] text-stone2-500 mb-1">🏔️ 测试山峰</div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => applyPeaksMode('test')}
            className={`h-7 px-2 rounded text-[10px] border ${
              peaksMode === 'test'
                ? 'bg-sand-400 text-forest-900 border-sand-500 font-medium'
                : 'bg-white text-stone2-600 border-forest-100 hover:bg-sand-50'
            }`}
          >
            8 方位测试山峰
          </button>
          <button
            type="button"
            onClick={() => applyPeaksMode('real')}
            className={`h-7 px-2 rounded text-[10px] border ${
              peaksMode === 'real'
                ? 'bg-sand-400 text-forest-900 border-sand-500 font-medium'
                : 'bg-white text-stone2-600 border-forest-100 hover:bg-sand-50'
            }`}
          >
            真实武功山山峰 ({realPeaks.length} 座)
          </button>
        </div>
      </section>

      {/* 模拟方向控制 */}
      <section className="mb-2">
        <div className="text-[10px] text-stone2-500 mb-1">🧭 模拟方向</div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={!orientation.isMock || orientation.isAutoRotating}
            onClick={() => orientation.adjustMockHeading(-15)}
            className="h-7 w-9 rounded text-[11px] border bg-white text-forest-700 border-forest-200 hover:bg-forest-50 disabled:opacity-40"
          >
            -15°
          </button>
          <input
            type="number"
            step="1"
            min={0}
            max={360}
            value={headingInput || (orientation.heading != null ? Math.round(orientation.heading) : '')}
            placeholder="Heading"
            onChange={(e) => {
              setHeadingInput(e.target.value)
              const v = parseFloat(e.target.value)
              if (!isNaN(v)) orientation.setMockHeading(v)
            }}
            disabled={!orientation.isMock}
            className="w-16 h-7 px-1.5 text-[11px] border border-forest-200 rounded bg-white font-mono text-center text-forest-800 focus:outline-none focus:border-forest-500 disabled:opacity-40"
          />
          <span className="text-[11px] text-forest-700 font-mono">°</span>
          <button
            type="button"
            disabled={!orientation.isMock || orientation.isAutoRotating}
            onClick={() => orientation.adjustMockHeading(15)}
            className="h-7 w-9 rounded text-[11px] border bg-white text-forest-700 border-forest-200 hover:bg-forest-50 disabled:opacity-40"
          >
            +15°
          </button>
          {/* 快捷方位 */}
          {[0, 90, 180, 270].map((d) => (
            <button
              key={d}
              type="button"
              disabled={!orientation.isMock}
              onClick={() => {
                orientation.setMockHeading(d)
                setHeadingInput(String(d))
              }}
              className="h-7 w-9 rounded text-[10px] border bg-forest-50 text-forest-600 border-forest-200 hover:bg-forest-100 disabled:opacity-40"
            >
              {d}°
            </button>
          ))}
        </div>
      </section>

      {/* 自动旋转测试 */}
      <section>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={orientation.startAutoRotate}
            disabled={!orientation.isMock || orientation.isAutoRotating}
            className="h-7 px-3 rounded text-[10px] bg-forest-600 text-white hover:bg-forest-700 disabled:opacity-40"
          >
            ▶ 自动旋转测试
          </button>
          <button
            type="button"
            onClick={orientation.stopAutoRotate}
            disabled={!orientation.isAutoRotating}
            className="h-7 px-3 rounded text-[10px] bg-sand-400 text-forest-900 hover:bg-sand-300 disabled:opacity-40"
          >
            ■ 停止旋转
          </button>
          {orientation.isAutoRotating && (
            <span className="text-[10px] text-sand-600 animate-pulse">旋转中…</span>
          )}
        </div>
      </section>

      {/* 实时状态展示 */}
      <section className="mt-2 pt-2 border-t border-sand-200 font-mono text-[10px] leading-tight text-stone2-500">
        <div>
          位置: {location.isMock ? 'MOCK ' : 'REAL '}
          {location.latLng
            ? `${location.latLng.lat.toFixed(4)}, ${location.latLng.lng.toFixed(4)}`
            : '—'}
        </div>
        <div>
          Heading: {orientation.isMock ? 'MOCK ' : 'REAL '}
          {orientation.heading != null
            ? `${Math.round(orientation.heading)}°`
            : '—'}
        </div>
        <div>山峰: {peaksMode === 'test' ? '8 方位测试山峰' : `真实武功山山峰 (${realPeaks.length} 座)`}</div>
      </section>
    </div>
  )
}
