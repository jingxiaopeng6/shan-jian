import { ReactNode, useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  children: ReactNode
  /** 是否暗色 */
  dark?: boolean
}

export default function BottomSheet({ open, onClose, children, dark = true }: BottomSheetProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  return (
    <>
      {/* 遮罩 */}
      <div
        className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      {/* Sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 ${
          dark ? 'bg-ink-200 text-mist border-t border-white/10' : 'bg-mist text-ink border-t border-ink/10'
        } rounded-t-3xl shadow-deep animate-enter-bottom pb-safe max-h-[75vh] overflow-y-auto`}
      >
        <div className="bottom-sheet-handle" />
        <div className="px-4 pb-4">
          {children}
        </div>
      </div>
    </>
  )
}
