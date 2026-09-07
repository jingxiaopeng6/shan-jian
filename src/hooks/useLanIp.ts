import { useEffect, useState } from 'react'

/**
 * 局域网地址获取 Hook
 * - 仅在开发环境中使用
 * - 通过 WebRTC 获取本机局域网 IP（不依赖外部服务）
 * - 失败时回退到显示端口号提示
 */
export function useLanIp(): string | null {
  const [lanIp, setLanIp] = useState<string | null>(null)

  useEffect(() => {
    if (!import.meta.env.DEV) return

    const rtc = new RTCPeerConnection({ iceServers: [] })
    const dc = rtc.createDataChannel('')
    let resolved = false

    rtc.onicecandidate = (e) => {
      if (resolved || !e.candidate) return
      const candidate = e.candidate.candidate
      // 提取 IPv4 地址
      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(candidate)
      if (match && !match[1].startsWith('0.')) {
        // 排除 127.0.0.1 等回环地址
        if (match[1] !== '127.0.0.1' && !match[1].startsWith('169.254')) {
          resolved = true
          setLanIp(match[1])
          rtc.close()
        }
      }
    }

    rtc.createOffer()
      .then((offer) => rtc.setLocalDescription(offer))
      .catch(() => {})

    dc.onopen = () => {
      if (!resolved) {
        rtc.close()
      }
    }

    // 5 秒超时
    const timer = setTimeout(() => {
      if (!resolved) {
        rtc.close()
      }
    }, 5000)

    return () => {
      clearTimeout(timer)
      rtc.close()
    }
  }, [])

  return lanIp
}
