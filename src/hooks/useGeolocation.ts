import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * GPS 定位状态
 */
export type LocationStatus =
  | 'idle'          // 初始/已停止监听
  | 'requesting'    // 正在请求权限并获取首次位置
  | 'watching'      // 实时监听中（持续更新）
  | 'denied'        // 用户拒绝权限
  | 'unavailable'   // 浏览器不支持 Geolocation
  | 'error'         // 定位失败（超时、无信号等）

export interface LocationReading {
  /** 纬度 WGS84 */
  latitude: number
  /** 经度 WGS84 */
  longitude: number
  /** 精度（米）——越小越准 */
  accuracy: number
  /** 海拔（米）——可能为 null（设备/浏览器不提供） */
  altitude: number | null
  /** 海拔精度——可能为 null */
  altitudeAccuracy: number | null
  /** 设备移动速度（m/s）——可能为 null */
  speed: number | null
  /** 时间戳（ms） */
  timestamp: number
}

export interface LocationError {
  /** 原始错误码：1=权限拒绝 2=定位不可用 3=超时 */
  code: number
  /** 人类可读中文提示 */
  message: string
}

/**
 * GPS 定位 Hook
 * - 独立封装 navigator.geolocation
 * - 主动调用 get()/startWatching() 而非自动触发
 * - 组件卸载自动清理 watchPosition
 */
export function useGeolocation() {
  const [status, setStatus] = useState<LocationStatus>('idle')
  const [reading, setReading] = useState<LocationReading | null>(null)
  const [error, setError] = useState<LocationError | null>(null)
  const watchIdRef = useRef<number | null>(null)

  const isSupported = useCallback((): boolean => {
    return typeof navigator !== 'undefined' && !!navigator.geolocation
  }, [])

  const isSecureContext = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    const isLocalhost = /^(http:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/.test(
      window.location.href
    )
    return isLocalhost || window.isSecureContext
  }, [])

  /** 单次获取位置（不持续监听） */
  const get = useCallback(() => {
    if (!isSupported()) {
      setStatus('unavailable')
      setError({ code: 0, message: '当前浏览器不支持定位功能。' })
      return
    }
    if (!isSecureContext()) {
      setStatus('error')
      setError({ code: 0, message: '定位需要 HTTPS 或 localhost 安全上下文。' })
      return
    }
    setStatus('requesting')
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setReading(normalizeReading(pos))
        setStatus('watching')
      },
      (err) => {
        setError({ code: err.code, message: humanize(err) })
        if (err.code === 1) setStatus('denied')
        else if (err.code === 2) setStatus('error')
        else if (err.code === 3) setStatus('error')
        else setStatus('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000
      }
    )
  }, [isSupported, isSecureContext])

  /** 开始持续监听位置变化 */
  const startWatching = useCallback(() => {
    if (!isSupported()) {
      setStatus('unavailable')
      setError({ code: 0, message: '当前浏览器不支持定位功能。' })
      return
    }
    if (!isSecureContext()) {
      setStatus('error')
      setError({ code: 0, message: '定位需要 HTTPS 或 localhost 安全上下文。' })
      return
    }
    // 先清理旧监听
    stopWatchingInternal()
    setStatus('requesting')
    setError(null)

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setReading(normalizeReading(pos))
        setStatus('watching')
      },
      (err) => {
        setError({ code: err.code, message: humanize(err) })
        if (err.code === 1) setStatus('denied')
        else if (err.code === 2) setStatus('error')
        else if (err.code === 3) {
          // 超时不直接失败，保持 watching 让下次变化能自动捕捉
          setStatus('error')
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 3000
        // 注：distanceFilter 不是标准 PositionOptions 属性，TS 不认识，保持 maximumAge 控制更新频率即可
      }
    )
    watchIdRef.current = watchId
  }, [isSupported, isSecureContext])

  /** 停止持续监听 */
  const stop = useCallback(() => {
    stopWatchingInternal()
    setStatus('idle')
    // 保留 reading 让用户可以继续看到最后一次有效位置
  }, [])

  const stopWatchingInternal = () => {
    if (watchIdRef.current != null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
  }

  /** 组件卸载自动清理 */
  useEffect(() => {
    return () => stopWatchingInternal()
  }, [])

  return {
    status,
    reading,
    error,
    get,
    startWatching,
    stop,
    isSupported: isSupported(),
    isSecureContext: isSecureContext()
  }
}

function normalizeReading(pos: GeolocationPosition): LocationReading {
  return {
    latitude: pos.coords.latitude,
    longitude: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude ?? null,
    altitudeAccuracy: pos.coords.altitudeAccuracy ?? null,
    speed: pos.coords.speed ?? null,
    timestamp: pos.timestamp
  }
}

function humanize(err: GeolocationPositionError): string {
  switch (err.code) {
    case 1:
      return '《山见》需要获取你的位置，才能判断你正在观看哪些山峰。请在浏览器设置中允许定位权限。'
    case 2:
      return '无法获取位置，请检查设备定位开关或移动到开阔区域。'
    case 3:
      return '定位时间较长，请移动到开阔区域后重试。'
    default:
      return '定位失败，请检查浏览器权限设置。'
  }
}
