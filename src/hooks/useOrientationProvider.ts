import { useCallback, useEffect, useRef, useState } from 'react'
import { useDeviceOrientation } from './useDeviceOrientation'
import { normalizeAngle } from '../utils/geoUtils'

/**
 * 方向数据 Provider
 * - real：使用真实 DeviceOrientationEvent
 * - mock：手动设置 heading（支持 ±15° 步长 + 自动旋转测试）
 */
export interface OrientationProvider {
  /** 当前 heading（0–360°），null = 未启动 */
  heading: number | null
  /** 当前状态 */
  status: 'idle' | 'listening' | 'requesting' | 'denied' | 'unavailable' | 'error' | 'mock'
  /** 启动 */
  start: () => void
  /** 停止 */
  stop: () => void
  /** 是否 mock 模式 */
  isMock: boolean
  /** mock 模式下：设置 heading */
  setMockHeading: (h: number) => void
  /** mock 模式下：相对调整 */
  adjustMockHeading: (delta: number) => void
  /** mock 模式下：自动旋转测试 */
  startAutoRotate: () => void
  /** mock 模式下：停止自动旋转 */
  stopAutoRotate: () => void
  /** 是否在自动旋转中 */
  isAutoRotating: boolean
}

export function useOrientationProvider(): OrientationProvider {
  const real = useDeviceOrientation()

  const [mock, setMock] = useState(false)
  const [mockHeading, setMockHeading] = useState<number>(0)
  const [autoRotating, setAutoRotating] = useState(false)

  const lastRealHeadingRef = useRef<number | null>(null)

  /** 自动旋转定时器 */
  useEffect(() => {
    if (!autoRotating || !mock) return
    const timer = window.setInterval(() => {
      setMockHeading((h) => normalizeAngle(h + 2)) // 每 150ms +2°，约 27 秒转一圈
    }, 150)
    return () => window.clearInterval(timer)
  }, [autoRotating, mock])

  /** 切换到 mock 模式时，停掉真实方向监听 */
  useEffect(() => {
    if (mock) {
      real.stop()
      setAutoRotating(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock])

  const start = useCallback(() => {
    if (!mock) real.start()
  }, [mock, real])

  const stop = useCallback(() => {
    real.stop()
    setAutoRotating(false)
  }, [real])

  const setMockHeadingValue = useCallback((h: number) => {
    setMock(true)
    setMockHeading(normalizeAngle(h))
  }, [])

  const adjustMockHeading = useCallback((delta: number) => {
    setMock(true) // 切换到 mock 模式
    // 如果当前有真实 heading，从真实值开始调整
    if (!mock && real.reading) {
      setMockHeading(normalizeAngle(real.reading.heading + delta))
    } else {
      setMockHeading((h) => normalizeAngle(h + delta))
    }
  }, [mock, real.reading])

  const startAutoRotate = useCallback(() => {
    setMock(true)
    setAutoRotating(true)
  }, [])

  const stopAutoRotate = useCallback(() => {
    setAutoRotating(false)
  }, [])

  // 取真实 heading 做默认值（第一次切到 mock 时）
  useEffect(() => {
    if (!mock && real.reading) {
      lastRealHeadingRef.current = real.reading.heading
    }
  }, [mock, real.reading?.heading])

  const heading: number | null = mock
    ? mockHeading
    : real.status === 'listening' && real.reading
      ? real.reading.heading
      : null

  const status: OrientationProvider['status'] = mock
    ? (autoRotating ? 'listening' : 'mock')
    : real.status

  return {
    heading,
    status,
    start,
    stop,
    isMock: mock,
    setMockHeading: setMockHeadingValue,
    adjustMockHeading,
    startAutoRotate,
    stopAutoRotate,
    isAutoRotating: autoRotating
  }
}
