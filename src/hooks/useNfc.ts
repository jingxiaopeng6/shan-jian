/**
 * useNfc — Web NFC API Hook
 *
 * 功能：
 * 1. 检测浏览器是否支持 Web NFC API
 * 2. 请求 NFC 权限
 * 3. 开始/停止 NDEF 扫描
 * 4. 解析 NFC 文本内容为景点 ID
 * 5. 提供 simulateScan() 模拟 NFC 打卡（演示模式）
 *
 * Web NFC API 仅在 Android Chrome 81+ 支持，iOS 不支持。
 * 电脑浏览器均不支持。因此模拟模式是核心开发/演示入口。
 */

import { useCallback, useRef, useState } from 'react'
import { findNfcPoint, type NfcPoint } from '../data/nfcPoints'

export type NfcStatus = 'idle' | 'scanning' | 'success' | 'error'

export interface NfcState {
  /** 是否支持 Web NFC */
  supported: boolean
  /** 当前状态 */
  status: NfcStatus
  /** 错误信息 */
  error: string | null
  /** 扫描到的 NFC 景点 */
  result: NfcPoint | null
  /** 是否为模拟模式 */
  isSimulated: boolean
}

// Web NFC API 类型声明（浏览器原生，非 npm 包）
interface NDEFMessage {
  records: NDEFRecord[]
}

interface NDEFRecord {
  recordType: string
  mediaType?: string
  data: BufferSource
  toText: () => Promise<string>
}

interface NDEFReader {
  onreading: ((event: { message: NDEFMessage }) => void) | null
  onerror: ((event: { error: Error }) => void) | null
  scan: (options?: { signal?: AbortSignal }) => Promise<void>
}

interface NDEFReaderConstructor {
  new (): NDEFReader
}

declare global {
  interface Window {
    NDEFReader?: NDEFReaderConstructor
  }
}

const initialState: NfcState = {
  supported: false,
  status: 'idle',
  error: null,
  result: null,
  isSimulated: false,
}

export function useNfc() {
  const [state, setState] = useState<NfcState>({
    ...initialState,
    supported: typeof window !== 'undefined' && !!window.NDEFReader,
  })
  const readerRef = useRef<NDEFReader | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  /** 开始 NFC 扫描 */
  const startScan = useCallback(async () => {
    if (!window.NDEFReader) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: '当前浏览器不支持 Web NFC API。请使用 Android Chrome 81+ 或使用模拟打卡。',
        isSimulated: false,
      }))
      return
    }

    try {
      const reader = new window.NDEFReader()
      readerRef.current = reader
      abortRef.current = new AbortController()

      reader.onreading = (event: { message: NDEFMessage }) => {
        for (const record of event.message.records) {
          if (record.recordType === 'text') {
            record.toText().then((text: string) => {
              const point = findNfcPoint(text.trim())
              if (point) {
                setState((s) => ({
                  ...s,
                  status: 'success',
                  result: point,
                  error: null,
                  isSimulated: false,
                }))
              } else {
                setState((s) => ({
                  ...s,
                  status: 'error',
                  error: `未知 NFC 内容：${text}`,
                  isSimulated: false,
                }))
              }
            }).catch(() => {
              // 忽略解析失败
            })
          }
        }
      }

      reader.onerror = () => {
        setState((s) => ({
          ...s,
          status: 'error',
          error: 'NFC 读取失败，请重试。',
          isSimulated: false,
        }))
      }

      await reader.scan({ signal: abortRef.current.signal })
      setState((s) => ({ ...s, status: 'scanning', error: null }))
    } catch (e) {
      setState((s) => ({
        ...s,
        status: 'error',
        error: e instanceof Error ? e.message : 'NFC 权限被拒绝或不可用。',
        isSimulated: false,
      }))
    }
  }, [])

  /** 停止扫描 */
  const stopScan = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
    }
    readerRef.current = null
    setState((s) => ({ ...s, status: 'idle' }))
  }, [])

  /** 模拟 NFC 打卡（演示模式） */
  const simulateScan = useCallback((nfcId: string) => {
    const point = findNfcPoint(nfcId)
    if (point) {
      setState({
        supported: typeof window !== 'undefined' && !!window.NDEFReader,
        status: 'success',
        error: null,
        result: point,
        isSimulated: true,
      })
    } else {
      setState((s) => ({
        ...s,
        status: 'error',
        error: `未知景点 NFC ID：${nfcId}`,
        isSimulated: true,
      }))
    }
  }, [])

  /** 重置状态 */
  const reset = useCallback(() => {
    setState((s) => ({
      ...initialState,
      supported: s.supported,
    }))
  }, [])

  return {
    ...state,
    startScan,
    stopScan,
    simulateScan,
    reset,
  }
}
