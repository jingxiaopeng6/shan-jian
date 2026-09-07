import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 方向传感器状态
 */
export type OrientationStatus =
  | 'idle'          // 未监听
  | 'requesting'    // 正在请求 iOS 权限（仅 iOS 13+）
  | 'listening'     // 监听中，收到数据
  | 'denied'        // 用户拒绝 iOS 权限
  | 'unavailable'   // 浏览器不支持方向传感器
  | 'error'         // 其他错误

export interface OrientationReading {
  /** 归一化后的真实指南针朝向：0–360°，0=北，90=东，180=南，270=西 */
  heading: number
  /** 原始 alpha（0–360） */
  alpha: number | null
  /** 原始 beta（-180–180） */
  beta: number | null
  /** 原始 gamma（-90–90） */
  gamma: number | null
  /** 时间戳 */
  timestamp: number
}

export interface OrientationError {
  code: string
  message: string
}

/**
 * 手机方向传感器 Hook
 * - 统一 alpha/beta/gamma → heading（0–360° 真实指南针方向）
 * - iOS 13+ 需要 DeviceOrientationEvent.requestPermission() 主动请求
 * - Android/桌面自动可用（需要 HTTPS 或 localhost）
 */
export function useDeviceOrientation() {
  const [status, setStatus] = useState<OrientationStatus>('idle')
  const [reading, setReading] = useState<OrientationReading | null>(null)
  const [error, setError] = useState<OrientationError | null>(null)

  // 设备方向：mobile vs desktop
  const [isIOS, setIsIOS] = useState(false)
  const [needsManualPermission, setNeedsManualPermission] = useState(false)

  // 过滤器：平滑抖动，记录上一次 heading
  const lastHeadingRef = useRef<number | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent.toLowerCase()
    setIsIOS(/ipad|iphone|ipod/.test(ua))
  }, [])

  // 检测 iOS 13+ 是否需要手动授权
  useEffect(() => {
    // @ts-expect-error — requestPermission 只在 iOS Safari 上存在
    if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      setNeedsManualPermission(true)
    }
  }, [])

  const isSupported = useCallback((): boolean => {
    return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window
  }, [])

  /**
   * 计算真实指南针 heading
   * —— 关键：不同设备的 alpha 含义不完全一致
   *    iOS：alpha 是指南针方向（0=北），但可能需要反号 + gamma 修正
   *    Android：alpha 在屏幕竖立时基本就是指南针方向
   *    桌面：不适用（但仍会收到 alpha=0 的事件）
   */
  const computeHeading = (ev: DeviceOrientationEvent): number => {
    const alpha = ev.alpha ?? 0

    // 把 alpha 归一化到 [0, 360)
    // 注：(360 - alpha) 把浏览器返回的 "0=北 顺时针" 转换成直观指南针方向
    let heading = ((360 - alpha) % 360 + 360) % 360

    // 简单过滤：和上次相比变化 < 1° 则沿用上次（防抖）
    if (lastHeadingRef.current != null) {
      const diff = Math.abs(heading - lastHeadingRef.current)
      if (diff > 180) {
        // 跨 0°/360° 边界
        const normalized = Math.min(diff, 360 - diff)
        if (normalized < 1) heading = lastHeadingRef.current
      } else if (diff < 1) {
        heading = lastHeadingRef.current
      }
    }
    lastHeadingRef.current = heading

    return heading
  }

  const handleOrientation = useCallback((ev: DeviceOrientationEvent) => {
    if (ev.alpha == null) return // 无有效数据
    const heading = computeHeading(ev)
    setReading({
      heading,
      alpha: ev.alpha,
      beta: ev.beta ?? null,
      gamma: ev.gamma ?? null,
      timestamp: Date.now()
    })
    // 首次收到数据后把状态改成 listening
    setStatus((s) => (s === 'requesting' || s === 'idle') ? 'listening' : s)
  }, [])

  /** 开始监听方向传感器 */
  const start = useCallback(async () => {
    if (!isSupported()) {
      setStatus('unavailable')
      setError({ code: 'UNSUPPORTED', message: '当前浏览器不支持方向传感器。' })
      return
    }

    // iOS 13+ 必须先手动请求权限（用户手势触发）
    if (needsManualPermission) {
      setStatus('requesting')
      try {
        // @ts-expect-error — requestPermission 只在 iOS Safari 上存在
        const result = await DeviceOrientationEvent.requestPermission()
        if (result !== 'granted') {
          setStatus('denied')
          setError({
            code: 'PERMISSION_DENIED',
            message: '需要开启方向权限，才能让山峰标签跟随你的观看方向。'
          })
          return
        }
      } catch (err) {
        setStatus('denied')
        setError({
          code: 'PERMISSION_ERROR',
          message: '方向权限请求失败，请重试。'
        })
        return
      }
    }

    // 绑定监听
    window.addEventListener('deviceorientation', handleOrientation, true)
    setStatus(needsManualPermission ? 'listening' : 'requesting')
  }, [isSupported, needsManualPermission, handleOrientation])

  /** 停止监听 */
  const stop = useCallback(() => {
    window.removeEventListener('deviceorientation', handleOrientation, true)
    lastHeadingRef.current = null
    setStatus('idle')
    // 保留 reading，让用户看到最后一次有效数据
  }, [handleOrientation])

  /** 组件卸载自动清理 */
  useEffect(() => {
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [handleOrientation])

  return {
    status,
    reading,
    error,
    start,
    stop,
    isSupported: isSupported(),
    isIOS,
    needsManualPermission
  }
}
