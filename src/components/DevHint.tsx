import { useState } from 'react'
import { useLanIp } from '../hooks/useLanIp'

/**
 * 开发环境手机访问提示（仅 dev 模式显示）
 * - 右下角悬浮卡片，不干扰正式 UI
 * - 显示本机地址 + 局域网地址
 * - 提供二维码供手机扫码访问
 * - 可折叠/展开
 */
export default function DevHint() {
  // 仅开发环境渲染
  if (!import.meta.env.DEV) return null

  const lanIp = useLanIp()
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  const localUrl = 'http://localhost:5173'
  const lanUrl = lanIp ? `http://${lanIp}:5173` : null
  // 使用公共 QR 码 API 生成二维码图片（dev 辅助功能，不需要本地依赖）
  const qrSrc = lanUrl
    ? `https://api.qrserver.com/v1/create-qr-code/?size=120x120&margin=8&data=${encodeURIComponent(lanUrl)}`
    : null

  const handleCopy = async () => {
    if (!lanUrl) return
    try {
      await navigator.clipboard.writeText(lanUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch { /* ignore */ }
  }

  return (
    <div className="fixed bottom-3 right-3 z-50 select-none">
      {/* 折叠态：小按钮 */}
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

      {/* 展开态：完整面板 */}
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

          {/* 本机地址 */}
          <div className="text-[10px] text-stone2-400 mb-0.5">本机访问</div>
          <div className="text-xs text-forest-700 font-mono mb-3 break-all">{localUrl}</div>

          {/* 局域网地址 */}
          {lanUrl ? (
            <>
              <div className="text-[10px] text-stone2-400 mb-0.5">局域网访问（手机用）</div>
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
                <span className="mt-1.5 text-[10px] text-stone2-400">手机扫码直接访问</span>
              </div>

              <div className="mt-3 pt-3 border-t border-forest-100 text-[10px] text-stone2-400 leading-relaxed">
                确保手机与电脑连接同一 Wi-Fi，用手机浏览器扫描或输入局域网地址。
              </div>
            </>
          ) : (
            <div className="text-[10px] text-stone2-400 leading-relaxed">
              正在检测局域网 IP…<br />
              也可手动运行 <span className="font-mono text-forest-600">npm run dev:host</span> 查看 Network 地址。
            </div>
          )}
        </div>
      )}
    </div>
  )
}
