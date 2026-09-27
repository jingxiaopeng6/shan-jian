import { useCallback, useEffect, useState } from 'react'
import { useGeolocation, type LocationReading } from './useGeolocation'
import type { LatLng } from '../utils/geoUtils'
import type { MockLocationPoint } from '../data/mockLocations'

/**
 * 位置数据 Provider
 * - real：使用真实 GPS（useGeolocation）
 * - mock：使用开发者指定的模拟位置
 *
 * 下游代码只从 reading / latLng 读取当前位置，
 * 不关心数据来自真实 GPS 还是模拟。
 */
export interface LocationProvider {
  /** 当前位置（null = 未启动/无数据） */
  latLng: LatLng | null
  /** 当前状态 */
  status: 'idle' | 'requesting' | 'watching' | 'denied' | 'unavailable' | 'error' | 'mock'
  /** 位置精度（米，mock 模式固定 5m） */
  accuracy: number | null
  /** 海拔（mock 模式可指定） */
  altitude: number | null
  /** 启动（真实模式开始 watch，mock 模式立即生效） */
  start: () => void
  /** 停止（真实模式停止 watch，mock 模式重置） */
  stop: () => void
  /** 是否模拟模式 */
  isMock: boolean
  /** mock 模式下的当前选中点 */
  mockPoint: MockLocationPoint | null
  /** 切换模拟位置（仅 mock 模式有效）。传 null 可清除 mock 点选择 */
  setMockPoint: (p: MockLocationPoint | null) => void
  /** 自定义 mock 位置（lat/lng） */
  setCustomMock: (lat: number, lng: number, elevation?: number) => void
}

export interface UseLocationProviderOptions {
  /** 默认是否启用 mock（开发环境可默认 true） */
  defaultMock?: boolean
  /** mock 模式默认使用哪个点 */
  defaultMockPoint?: MockLocationPoint | null
}

export function useLocationProvider(
  opts: UseLocationProviderOptions = {}
): LocationProvider {
  const geo = useGeolocation()

  const [mock, setMock] = useState(false)
  const [mockPoint, setMockPointState] = useState<MockLocationPoint | null>(
    opts.defaultMockPoint ?? null
  )
  const [customLat, setCustomLat] = useState<number | null>(null)
  const [customLng, setCustomLng] = useState<number | null>(null)
  const [customAlt, setCustomAlt] = useState<number | null>(null)

  /** 计算当前生效的 mock 位置 */
  const effectiveMockLatLng: LatLng | null =
    customLat != null && customLng != null
      ? { lat: customLat, lng: customLng }
      : mockPoint
        ? { lat: mockPoint.lat, lng: mockPoint.lng }
        : null

  /** mock 模式下立即生效，不需要 start() */
  useEffect(() => {
    if (mock) {
      // 切换到 mock 模式时，停掉真实 GPS
      geo.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mock])

  const start = useCallback(() => {
    if (mock) {
      // mock 模式：如果有 mock 点，状态已经通过 latLng 自动生效
      // 如果没有 mock 点，自动选择第一个预设点
      if (!mockPoint && !effectiveMockLatLng) {
        // 没有预设点也没有自定义点：保持 null，但状态保持 mock
      }
      // 状态由 latLng 推导，无需额外操作
    } else {
      geo.startWatching()
    }
  }, [mock, mockPoint, effectiveMockLatLng, geo])

  const stop = useCallback(() => {
    if (mock) {
      // mock 模式：清除 mock 位置，恢复 idle
      setMock(false)
      setMockPointState(null)
      setCustomLat(null)
      setCustomLng(null)
      setCustomAlt(null)
    } else {
      geo.stop()
    }
  }, [mock, geo])

  const setCustomMock = useCallback((lat: number, lng: number, elevation?: number) => {
    setMock(true)
    setCustomLat(lat)
    setCustomLng(lng)
    setCustomAlt(elevation ?? null)
    setMockPointState(null) // 清除预设点选择
  }, [])

  /** 统一输出 */
  const latLng: LatLng | null = mock
    ? effectiveMockLatLng
    : geo.reading
      ? { lat: geo.reading.latitude, lng: geo.reading.longitude }
      : null

  const status: LocationProvider['status'] = mock
    ? latLng
      ? 'mock'
      : 'idle'
    : geo.status

  const accuracy = mock ? 5 : (geo.reading?.accuracy ?? null)
  const altitude = mock
    ? (customAlt ?? mockPoint?.elevation ?? null)
    : (geo.reading?.altitude ?? null)

  return {
    latLng,
    status,
    accuracy,
    altitude,
    start,
    stop,
    isMock: mock,
    mockPoint,
    setMockPoint: (p) => {
      if (p == null) {
        setMock(false)
        setMockPointState(null)
      } else {
        setMock(true)
        setMockPointState(p)
        setCustomLat(null)
        setCustomLng(null)
        setCustomAlt(null)
      }
    },
    setCustomMock
  }
}

/** 原始 reading 结构（供需要完整数据的下游使用） */
export function useLocationReading(
  provider: LocationProvider
): LocationReading | null {
  if (!provider.latLng) return null
  return {
    latitude: provider.latLng.lat,
    longitude: provider.latLng.lng,
    accuracy: provider.accuracy ?? 5,
    altitude: provider.altitude,
    altitudeAccuracy: null,
    speed: null,
    timestamp: Date.now()
  }
}
