import { useCallback } from 'react'
import type { CameraError, CameraStatus } from '../hooks/useCamera'

interface CameraViewProps {
  /** 来自 useCamera 的 videoRef */
  videoRef: React.RefObject<HTMLVideoElement>
  /** 当前摄像头状态 */
  status: CameraStatus
  /** 错误信息 */
  error: CameraError | null
  /** 点击"打开摄像头"按钮 */
  onStart: () => void
  /** 点击"关闭摄像头"按钮 */
  onStop: () => void
}

/**
 * 摄像头全屏背景层
 * - 仅负责渲染 <video> 与状态面板
 * - 山峰叠加层由 ArPage 在 CameraView 之上额外渲染
 */
export default function CameraView({ videoRef, status, error, onStart, onStop }: CameraViewProps) {
  // 处理 iOS video 的 click-to-play
  const handleVideoClick = useCallback(() => {
    const v = videoRef.current
    if (v && v.paused) {
      v.play().catch(() => { /* 用户可能还没授权 */ })
    }
  }, [videoRef])

  const isStreaming = status === 'streaming'

  return (
    <div
      className="absolute inset-0 bg-black"
      data-testid="camera-view"
      data-camera-status={status}
    >
      {/* 实时摄像头画面：仅 streaming 时显示 */}
      {isStreaming && (
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
          // 后置摄像头的视频在某些设备上需要左右翻转
          // 但在 camera 模式下不要镜像（这是后摄，看到的就是真实世界）
          onClick={handleVideoClick}
          aria-label="实时摄像头画面"
        />
      )}

      {/* 状态面板：非 streaming 时显示 */}
      {!isStreaming && (
        <StatusPanel
          status={status}
          error={error}
          onStart={onStart}
        />
      )}

      {/* 关闭按钮：仅 streaming 时显示 */}
      {isStreaming && (
        <button
          type="button"
          onClick={onStop}
          className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 active:bg-black/80 transition backdrop-blur"
          aria-label="关闭摄像头"
          title="关闭摄像头"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}

/** 各状态对应的提示面板 */
function StatusPanel({
  status,
  error,
  onStart
}: {
  status: CameraStatus
  error: CameraError | null
  onStart: () => void
}) {
  if (status === 'requesting') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8 text-white">
        <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-4 animate-pulse">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="6" width="14" height="12" rx="2" />
            <path d="M22 8l-6 4 6 4V8z" />
          </svg>
        </div>
        <div className="text-base font-medium">正在启动摄像头…</div>
        <div className="text-xs text-white/60 mt-2">请在系统弹窗中允许摄像头权限</div>
      </div>
    )
  }

  if (status === 'denied') {
    return (
      <ErrorPanel
        title="权限被拒绝"
        message={error?.message ?? '《山见》需要使用摄像头才能开启 AR 看山。'}
        actionText="重新尝试"
        onAction={onStart}
      />
    )
  }

  if (status === 'unsupported') {
    return (
      <ErrorPanel
        title="浏览器不支持"
        message={error?.message ?? '当前浏览器不支持摄像头功能，请使用最新版 Chrome 或 Safari。'}
        actionText="返回"
        onAction={() => { /* 页面路由处理 */ }}
        hideIcon
      />
    )
  }

  if (status === 'error') {
    return (
      <ErrorPanel
        title="摄像头启动失败"
        message={error?.message ?? '请检查浏览器权限设置，或关闭其他占用摄像头的应用后重试。'}
        actionText="重新尝试"
        onAction={onStart}
      />
    )
  }

  // idle（默认初始态）：引导用户开启摄像头
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
      {/* 暗色渐变背景 */}
      <div className="absolute inset-0 bg-gradient-to-b from-forest-900/80 via-forest-800/90 to-forest-900/95 -z-10" />

      {/* 摄像头图标 */}
      <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mb-5">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6d2a9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M22 8l-6 4 6 4V8z" />
        </svg>
      </div>

      <div className="text-base font-medium text-white">打开摄像头</div>
      <div className="text-xs text-white/60 mt-2 max-w-xs leading-relaxed">
        将使用你的后置摄像头画面作为 AR 实景底图。<br />
        仅用于屏幕展示，不会上传任何内容。
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-6 inline-flex items-center gap-2 px-6 h-11 rounded-full bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 transition shadow-soft"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="6" width="14" height="12" rx="2" />
          <path d="M22 8l-6 4 6 4V8z" />
        </svg>
        打开摄像头
      </button>

      <div className="mt-4 text-[10px] text-white/40">
        首次使用会弹出系统权限请求
      </div>
    </div>
  )
}

function ErrorPanel({
  title,
  message,
  actionText,
  onAction,
  hideIcon
}: {
  title: string
  message: string
  actionText: string
  onAction: () => void
  hideIcon?: boolean
}) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
      <div className="absolute inset-0 bg-gradient-to-b from-forest-900/80 via-forest-900/90 to-forest-900/95 -z-10" />

      {!hideIcon && (
        <div className="w-14 h-14 rounded-2xl bg-sand-400/20 border border-sand-400/40 flex items-center justify-center mb-5">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#e6d2a9" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          </svg>
        </div>
      )}

      <div className="text-base font-medium text-white">{title}</div>
      <div className="text-xs text-white/60 mt-2 max-w-xs leading-relaxed">{message}</div>

      <button
        type="button"
        onClick={onAction}
        className="mt-5 inline-flex items-center gap-2 px-5 h-10 rounded-full bg-sand-400 text-forest-900 text-sm font-medium hover:bg-sand-300 transition"
      >
        {actionText}
      </button>
    </div>
  )
}
