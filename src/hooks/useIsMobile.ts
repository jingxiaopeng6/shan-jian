import { useEffect, useState } from 'react'

/**
 * 移动端设备检测 Hook
 * - 综合判断：User-Agent + 屏幕宽度
 * - 不阻止电脑端访问，仅返回布尔值供组件做响应式适配
 * - SSR 安全：首屏渲染默认 false（桌面端），挂载后修正
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      const ua = navigator.userAgent.toLowerCase()
      const uaMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
      const screenWidth = window.innerWidth
      // 触摸设备 + 宽度 < 768px → 移动端布局
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      const narrowScreen = screenWidth < 768
      // User-Agent 表明移动设备 或 （触摸设备 + 窄屏）时判定为手机
      setIsMobile(uaMobile || (isTouch && narrowScreen))
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  return isMobile
}
