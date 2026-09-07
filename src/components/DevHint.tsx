import { useState } from 'react'
import { useLanIp } from '../hooks/useLanIp'

const DEV_PORT = 5173

/**
 * 开发环境手机访问提示（仅 dev 模式显示）
 * - 右下角悬浮卡片，不干扰正式 UI
 * - 三种状态：detecting / found / timeout
 * - 检测到局域网 IP 时显示地址 + 二维码
 * - 检测超时后给出手动查找指引
 */
export default function DevHint() {
  if (!import.meta.env.DEV) return null

  const state = useLanIp()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const localUrl = `http://localhost:${DEV_PORT}`
  const lanIp = state.status === 'found' ? state.lanIp : null
  const publicIp = 'publicIp' in state ? state.publicIp : undefined
  const lanUrl = lanIp ? `http://${lanIp}:${DEV_PORT}` : null
  // 二维码：优先局域网，回退公网
  const qrTarget = lanUrl ?? (publicIp ? `http://${publicIp}:${DEV_PORT}` : null)
  const qrSrc = qrTarget
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=8&data=${encodeURIComponent(qrTarget)}`
    : null

  const handleCopy = async () => {
    const target = lanUrl ?? (publicIp ? `http://${publicIp}:${DEV_PORT}` : null)
    if (!target) return
    try {
      await navigator.clipboard.writeText(target)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* 某些浏览器不支持 */ }
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      {/* 折叠态 */}
      {!expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-forest-700/90 text-white text-[11px] shadow-soft backdrop-blur hover:bg-forest-800 transition"
          aria-label="展开手机访问提示"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="6" y="2" width="12" height="20" rx="2" />
            <path d="M12 18h.01" />
          </svg>
          手机访问
        </button>
      )}

      {/* 展开态 */}
      {expanded && (
        <div className="rounded-xl2 bg-white border border-forest-200 shadow-soft p-4 w-[260px]">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-forest-800">山见 · 开发模式</span>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              className="w-6 h-6 flex items-center justify-center rounded-full text-stone2-400 hover:bg-forest-50"
              aria-label="折叠"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* 本机地址：始终显示 */}
          <div className="text-[10px] text-stone2-400 mb-0.5">本机访问</div>
          <div className="text-xs text-forest-700 font-mono mb-3 break-all">{localUrl}</div>

          {/* 局域网地址区域：根据状态显示 */}
          {state.status === 'detecting' && (
            <div className="text-[10px] text-stone2-400 leading-relaxed flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-sand-400 animate-pulse" />
              检测局域网 IP 中…
            </div>
          )}

          {state.status === 'found' && lanUrl && (
            <>
              <div className="text-[10px] text-stone2-400 mb-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                局域网访问（手机用）
              </div>
              <button
                type="button"
                onClick={handleCopy}
                className="text-xs text-sand-600 font-mono break-all text-left hover:underline w-full"
              >
                {lanUrl}
                {copied && <span className="ml-2 text-forest-600">已复制 ✓</span>}
              </button>

              {/* 二维码 */}
              <div className="mt-3 flex flex-col items-center">
                {qrSrc && (
                  <img
                    src={qrSrc}
                    alt="扫码访问"
                    width={120}
                    height={120}
                    className="rounded-lg border border-forest-100"
                  />
                )}
                <span className="mt-1.5 text-[10px] text-stone2-400">
                  手机扫码直接访问
                </span>
              </div>

              <div className="mt-3 pt-3 border-t border-forest-100 text-[10px] text-stone2-400 leading-relaxed">
                手机需与电脑连接<b className="text-forest-700">同一 Wi-Fi</b>。
              </div>
            </>
          )}

          {state.status === 'timeout' && (
            <>
              <div className="text-[10px] text-stone2-400 mb-2 flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sand-500">
                  <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                </svg>
                无法自动检测局域网 IP
              </div>
              <ManualIpGuide port={DEV_PORT} />
              {publicIp && (
                <div className="mt-2 text-[10px] text-stone2-400">
                  你的公网 IP：<span className="font-mono text-sand-600">{publicIp}</span>
                  <div className="mt-0.5 text-[9px]">⚠️ 公网 IP 不可直接用于局域网手机访问</div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ManualIpGuide({ port }: { port: number }) {
  return (
    <div className="rounded-lg bg-forest-50 border border-forest-100 p-2.5 text-[10px] text-forest-700 leading-relaxed">
      <div className="font-medium mb-1 text-forest-800">手动查找方法（任选其一）：</div>
      <div className="mb-1">① 终端运行 <code className="font-mono bg-white px-1 rounded">ipconfig</code>，找「IPv4 地址」如 <code className="font-mono">192.168.x.x</code></div>
      <div className="mb-1">② 启动 <code className="font-mono bg-white px-1 rounded">npm run dev:host</code>，终端会打印 Network 地址</div>
      <div>③ 手机浏览器输入 <code className="font-mono text-sand-600">http://你的IP:{port}</code></div>
    </div>
  )
}
