import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * 摄像头状态枚举
 * - idle: 初始/已停止
 * - requesting: 正在请求权限与启动
 * - streaming: 正常播放中
 * - denied: 用户拒绝权限
 * - unsupported: 浏览器不支持
 * - error: 启动失败（其他原因）
 */
export type CameraStatus =
  | 'idle'
  | 'requesting'
  | 'streaming'
  | 'denied'
  | 'unsupported'
  | 'error'

export interface CameraError {
  /** 原始错误码（来自 MediaDevices） */
  code: string
  /** 人类可读的中文提示 */
  message: string
}

/**
 * 摄像头控制 Hook
 * - 独立封装 MediaDevices API
 * - 正确处理权限、HTTPS、浏览器兼容性、资源清理
 * - 避免未停止的 MediaStream 在组件卸载后继续占用摄像头
 */
export function useCamera() {
  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<CameraError | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  /** 检查浏览器是否支持 MediaDevices API */
  const isSupported = useCallback((): boolean => {
    return typeof navigator !== 'undefined' &&
      !!navigator.mediaDevices &&
      typeof navigator.mediaDevices.getUserMedia === 'function'
  }, [])

  /** 检查当前页面是否在安全上下文（localhost 也算安全） */
  const isSecureContext = useCallback((): boolean => {
    if (typeof window === 'undefined') return false
    // https://developer.mozilla.org/docs/Web/Security/Secure_Contexts
    // 但很多浏览器在 localhost 上也允许摄像头
    const isLocalhost = /^(http:\/\/)?(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/|$)/.test(
      window.location.href
    )
    return isLocalhost || window.isSecureContext
  }, [])

  /** 启动摄像头（后置优先） */
  const start = useCallback(async () => {
    // 先清理旧 stream（防止重复启动冲突）
    stopInternal()

    if (!isSupported()) {
      setStatus('unsupported')
      setError({
        code: 'UNSUPPORTED',
        message: '当前浏览器不支持摄像头功能，请使用最新版 Chrome 或 Safari。'
      })
      return
    }

    if (!isSecureContext()) {
      // 不是安全上下文，提前给出友好提示（某些浏览器仍允许，但多数会拒绝）
      // 注意：localhost 在这里已被算作安全上下文
    }

    setStatus('requesting')
    setError(null)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          // 优先请求后置摄像头
          facingMode: { ideal: 'environment' },
          // 限制分辨率以降低带宽和内存压力（移动端友好）
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      streamRef.current = stream

      // 绑定到 <video> 元素——需要组件先提供 ref
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        // 某些浏览器（iOS Safari）需要显式 play()
        try {
          await videoRef.current.play()
        } catch {
          // autoplay 策略可能阻止自动播放，但 srcObject 已设置，等用户交互时会自动播放
        }
      }

      setStatus('streaming')
    } catch (rawErr) {
      const err = rawErr as { name?: string; message?: string }
      const code = err.name ?? 'UNKNOWN'

      if (
        code === 'NotAllowedError' ||
        code === 'PermissionDeniedError' ||
        code === 'SecurityError'
      ) {
        setStatus('denied')
        setError({
          code,
          message: '《山见》需要使用摄像头才能开启 AR 看山。请在浏览器设置中允许摄像头权限后重试。'
        })
      } else if (code === 'NotFoundError') {
        setStatus('error')
        setError({
          code,
          message: '未检测到可用摄像头。'
        })
      } else if (code === 'OverconstrainedError') {
        // facingMode: "environment" 在部分桌面/模拟器上可能失败，尝试降级再请求一次
        try {
          const fallback = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: true
          })
          streamRef.current = fallback
          if (videoRef.current) {
            videoRef.current.srcObject = fallback
          }
          setStatus('streaming')
          return
        } catch {
          // 降级也失败
        }
        setStatus('error')
        setError({
          code,
          message: '摄像头参数与当前设备不匹配，请尝试换一个摄像头。'
        })
      } else if (code === 'NotReadableError') {
        setStatus('error')
        setError({
          code,
          message: '摄像头已被其他应用占用，请关闭后再试。'
        })
      } else {
        setStatus('error')
        setError({
          code,
          message: '摄像头启动失败，请检查浏览器权限设置。'
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSupported, isSecureContext])

  /** 停止摄像头并清理所有资源 */
  const stop = useCallback(() => {
    stopInternal()
    setStatus('idle')
    setError(null)
  }, [])

  const stopInternal = () => {
    // 停止所有 tracks（关键：避免摄像头灯一直亮）
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    // 解除 video 绑定
    if (videoRef.current) {
      videoRef.current.srcObject = null
      try {
        videoRef.current.pause()
      } catch { /* 已停止，忽略 */ }
    }
  }

  /** 组件卸载时自动清理摄像头资源 */
  useEffect(() => {
    return () => {
      stopInternal()
    }
  }, [])

  return {
    /** 把这个 ref 绑到 <video> 元素上，start() 才会有画面 */
    videoRef,
    /** 当前摄像头状态 */
    status,
    /** 详细错误（仅 status === denied / error 时存在） */
    error,
    /** 启动摄像头（会弹出系统权限请求） */
    start,
    /** 停止摄像头并清理资源 */
    stop,
    /** 浏览器是否支持 MediaDevices API */
    isSupported: isSupported(),
    /** 当前页面是否在安全上下文 */
    isSecureContext: isSecureContext()
  }
}
