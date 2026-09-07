import { useEffect, useState } from 'react'

type IpState =
  | { status: 'detecting' }
  | { status: 'found'; lanIp: string; publicIp?: string }
  | { status: 'timeout'; publicIp?: string }

/**
 * 局域网 / 公网地址获取 Hook
 * - 仅在开发环境中使用
 * - 优先通过 WebRTC 获取本机局域网 IP（不依赖外部服务）
 * - 同时通过 ipify 公共 API 获取公网 IP 作为备选
 * - 3 秒超时后返回 timeout 状态，避免无限卡住
 */
export function useLanIp(): IpState {
  const [state, setState] = useState<IpState>({ status: 'detecting' })

  useEffect(() => {
    if (!import.meta.env.DEV) return

    let lanIp: string | null = null
    let publicIp: string | undefined
    let lanResolved = false
    let timeoutFired = false
    let rtc: RTCPeerConnection | null = null

    // 辅助：如果 lanIp 已经拿到，更新状态（带上已知的 publicIp）
    const tryUpdateFound = () => {
      if (lanIp && !lanResolved && !timeoutFired) {
        lanResolved = true
        setState({ status: 'found', lanIp, publicIp })
      }
    }

    // 1. WebRTC 获取局域网 IP
    rtc = new RTCPeerConnection({ iceServers: [] })
    rtc.createDataChannel('')
    rtc.onicecandidate = (e) => {
      if (timeoutFired || lanResolved || !e.candidate) return
      const match = /([0-9]{1,3}(\.[0-9]{1,3}){3})/.exec(e.candidate.candidate)
      if (match) {
        const ip = match[1]
        if (isValidLanIp(ip)) {
          lanIp = ip
          tryUpdateFound()
          rtc!.close()
        }
      }
    }
    rtc.createOffer()
      .then((offer) => rtc!.setLocalDescription(offer))
      .catch(() => {})

    // 2. 并行获取公网 IP（作为备选/参考）
    fetch('https://api.ipify.org?format=json', { mode: 'cors' })
      .then((res) => res.json())
      .then((data: { ip?: string }) => {
        publicIp = data.ip
        // 如果 lanIp 已经拿到但还没 setState（可能存在竞态），补全公网 IP
        if (lanIp && !lanResolved && !timeoutFired) {
          lanResolved = true
          setState({ status: 'found', lanIp, publicIp })
        } else if (lanResolved && !timeoutFired) {
          // 已经显示过了，静默更新（一般不会走到这里因为先拿到 lanIp 就 close 了）
        }
      })
      .catch(() => { /* ipify 不可用时静默跳过 */ })

    // 3. 3 秒超时兜底
    const timer = setTimeout(() => {
      timeoutFired = true
      rtc?.close()
      if (lanIp) {
        setState({ status: 'found', lanIp, publicIp })
      } else {
        setState({ status: 'timeout', publicIp })
      }
    }, 3000)

    return () => {
      clearTimeout(timer)
      rtc?.close()
    }
  }, [])

  return state
}

function isValidLanIp(ip: string): boolean {
  if (ip === '127.0.0.1') return false
  if (ip.startsWith('169.254')) return false
  if (ip.startsWith('0.')) return false
  if (ip.startsWith('224') || ip.startsWith('239')) return false
  // 10.x.x.x / 192.168.x.x / 172.16-31.x.x 都是常见局域网段，直接认为有效
  if (
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
  ) {
    return true
  }
  return true // 其他情况也接受，避免过滤掉有效地址
}
