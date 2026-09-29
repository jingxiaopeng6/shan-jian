/**
 * PhotoUpload — 照片上传 + 预览
 *
 * - 支持点击选择 + 拖拽
 * - 限制：JPG/PNG/WEBP，≤ 5MB
 * - 用 Canvas 自动压缩到 1080px 宽（保持比例）
 * - 通过 onPhotoLoaded(dataUrl) 回调上传后的 dataURL
 */

import { useRef, useState, useCallback } from 'react'
import { ImagePlus, X, AlertCircle } from 'lucide-react'

interface Props {
  /** 照片加载完成回调（dataURL） */
  onPhotoLoaded: (dataUrl: string) => void
  /** 当前已加载的 dataURL（用于预览） */
  photoDataUrl: string | null
  /** 清除照片回调 */
  onClear: () => void
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPT = ['image/jpeg', 'image/png', 'image/webp']
const COMPRESS_WIDTH = 1080

export default function PhotoUpload({ onPhotoLoaded, photoDataUrl, onClear }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [dragging, setDragging] = useState(false)

  const processFile = useCallback(async (file: File) => {
    setError(null)
    setLoading(true)
    try {
      // 类型校验
      if (!ACCEPT.includes(file.type)) {
        setError('仅支持 JPG / PNG / WEBP 格式')
        return
      }
      // 大小校验
      if (file.size > MAX_SIZE) {
        setError('文件大小不能超过 5MB')
        return
      }

      // 读取 + 压缩
      const raw = await readAsDataURL(file)
      const compressed = await compressImage(raw, COMPRESS_WIDTH)
      onPhotoLoaded(compressed)
    } catch (e) {
      console.error('photo process error', e)
      setError('图片处理失败，请换一张试试')
    } finally {
      setLoading(false)
    }
  }, [onPhotoLoaded])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) void processFile(file)
    // 重置 input，便于再次选择同一文件
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) void processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }

  // 已加载照片：显示预览
  if (photoDataUrl) {
    return (
      <div className="space-y-2" data-testid="photo-preview">
        <div className="relative rounded-2xl overflow-hidden border border-apple-400/30 shadow-card">
          <img src={photoDataUrl} alt="已上传照片" className="w-full max-h-72 object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-ink/60 text-cheese-50 hover:bg-ink/80 inline-flex items-center justify-center"
            aria-label="移除照片"
            data-testid="photo-clear"
          >
            <X size={14} />
          </button>
        </div>
        <p className="text-caption text-rock-400 text-center">照片已就绪，点击下方生成海报</p>
      </div>
    )
  }

  // 拖拽 + 点击区
  return (
    <div className="space-y-2">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => inputRef.current?.click()}
        className={`cursor-pointer rounded-2xl border-2 border-dashed p-6 transition-all flex flex-col items-center justify-center gap-2 min-h-44 ${
          dragging
            ? 'border-apple-400 bg-apple-50'
            : 'border-apple-400/30 bg-cheese-50/50 hover:bg-apple-50/50'
        }`}
        data-testid="photo-dropzone"
      >
        {loading ? (
          <div className="w-6 h-6 border-2 border-apple-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <ImagePlus size={28} className="text-apple-500" />
        )}
        <div className="text-center">
          <div className="text-sm font-medium text-forest-600">点击或拖拽上传照片</div>
          <div className="text-caption text-rock-400 mt-1">JPG / PNG / WEBP · 最大 5MB</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT.join(',')}
          onChange={handleInputChange}
          className="hidden"
          data-testid="photo-input"
        />
      </div>
      {error && (
        <div className="flex items-center gap-1.5 text-caption text-amber-500" data-testid="photo-error">
          <AlertCircle size={12} />
          {error}
        </div>
      )}
    </div>
  )
}

/** 读取 File 为 dataURL */
function readAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** 压缩图片到指定宽度，保持比例 */
function compressImage(dataUrl: string, targetWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // 已经够小，直接返回
      if (img.width <= targetWidth) {
        resolve(dataUrl)
        return
      }
      const ratio = img.height / img.width
      const targetHeight = Math.round(targetWidth * ratio)
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(dataUrl)
        return
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      // 0.85 质量，肉眼几乎无差，文件大幅缩小
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
