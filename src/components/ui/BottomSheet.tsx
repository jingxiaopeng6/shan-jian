import { ReactNode, useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /**
   * tone：
   * - light (默认) 奶酪底 — 浅色页面主用
   * - dark        暗底 — 仅当背景本身是黑色时使用
   */
  tone?: 'light' | 'dark'
}

export default function BottomSheet({ open, onClose, children, tone = 'light' }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const isDark = tone === 'dark'

  return (
    <>
      {/* 遮罩 */}
      <div
        className={`fixed inset-0 z-40 backdrop-blur-sm animate-fade-in ${
          isDark ? 'bg-ink/40' : 'bg-ink/20'
        }`}
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 ${
          isDark
            ? 'bg-ink-200 text-cheese-50 border-t border-white/10'
            : 'bg-cheese-50 text-ink border-t border-apple-400/30'
        } rounded-t-3xl shadow-sheet animate-enter-bottom pb-safe max-h-[75vh] overflow-y-auto`}
      >
        <div className="bottom-sheet-handle" />
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  )
}
