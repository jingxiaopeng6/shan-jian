import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { Home, Map, Compass, BookOpen, ChevronLeft } from 'lucide-react'
import DevHint from './DevHint'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * 全局布局壳：
 * - 奶酪暖底 + 青苹果强调
 * - 顶部 Header（首页隐藏返回，其他页面显示返回 + 标题）
 * - 底部 TabBar（首页/地图/印记/档案）— 解决页面间跳转不顺
 * - 全屏页面（MapPage/ArPage）由路由 hideChrome 控制是否隐藏 chrome
 */
export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // 全屏模式：地图与 AR 页面隐藏 Header + TabBar（地图全屏、摄像头全屏）
  const path = location.pathname
  const isFullscreen = path.startsWith('/map') || path.startsWith('/ar')
  const showBack = path !== '/' && !isFullscreen

  // 路由切换滚动回顶
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [path])

  const pageTitle = titleOf(path)
  const activeTab = tabOf(path)

  return (
    <div className="min-h-full flex flex-col bg-cheese text-ink">
      {/* ===== 顶部导航 ===== */}
      {!isFullscreen && (
        <header className="safe-top sticky top-0 z-30 backdrop-blur-md bg-cheese-50/85 border-b border-cheese-300/60">
          <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
            {showBack ? (
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full text-forest-600 hover:bg-apple-50 active:bg-apple-100 transition"
                aria-label="返回"
              >
                <ChevronLeft size={20} strokeWidth={2} />
              </button>
            ) : (
              <div className="w-9 h-9 -ml-2 flex items-center justify-center">
                {/* 山见 logo — 青苹果+奶酪 */}
                <svg width="22" height="22" viewBox="0 0 64 64" className="text-apple-400">
                  <rect x="1" y="1" width="62" height="62" rx="14" fill="currentColor" />
                  <path d="M10 46 L26 22 L34 32 L44 18 L54 46 Z" fill="#F4F1E8" />
                </svg>
              </div>
            )}

            <div className="flex-1 flex items-center min-w-0">
              <span
                className={`font-serif tracking-wide truncate ${showBack ? 'text-base text-forest-600' : 'text-lg font-semibold text-forest-700'}`}
              >
                {pageTitle}
              </span>
            </div>

            {!showBack && !isMobile && (
              <div className="text-caption text-rock-400 hidden sm:block whitespace-nowrap">
                武功山 · 智慧文旅
              </div>
            )}
          </div>
        </header>
      )}

      {/* ===== 主内容 ===== */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* ===== 底部 TabBar ===== */}
      {!isFullscreen && (
        <nav className="safe-bottom sticky bottom-0 z-30 backdrop-blur-md bg-cheese-50/90 border-t border-cheese-300/60 pb-safe">
          <div className="max-w-3xl mx-auto px-2 h-16 flex items-stretch justify-around">
            <TabItem
              label="首页"
              active={activeTab === 'home'}
              onClick={() => navigate('/')}
              icon={<Home size={20} strokeWidth={activeTab === 'home' ? 2.4 : 1.8} />}
            />
            <TabItem
              label="地图"
              active={activeTab === 'map'}
              onClick={() => navigate('/map')}
              icon={<Map size={20} strokeWidth={activeTab === 'map' ? 2.4 : 1.8} />}
            />
            <TabItem
              label="印记"
              active={activeTab === 'nfc'}
              onClick={() => navigate('/nfc')}
              icon={<Compass size={20} strokeWidth={activeTab === 'nfc' ? 2.4 : 1.8} />}
            />
            <TabItem
              label="档案"
              active={activeTab === 'journey'}
              onClick={() => navigate('/journey')}
              icon={<BookOpen size={20} strokeWidth={activeTab === 'journey' ? 2.4 : 1.8} />}
            />
          </div>
        </nav>
      )}

      {/* 开发环境提示 */}
      <DevHint />
    </div>
  )
}

function TabItem({ label, active, onClick, icon }: {
  label: string
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
        active ? 'text-apple-600' : 'text-rock-400 hover:text-apple-500'
      }`}
      aria-label={label}
    >
      {icon}
      <span className={`text-overline ${active ? 'font-semibold' : ''}`}>{label}</span>
    </button>
  )
}

function titleOf(pathname: string): string {
  if (pathname === '/') return '山见'
  if (pathname.startsWith('/map')) return '武功山 · 3D 地图'
  if (pathname.startsWith('/ar')) return 'AR 看山'
  if (pathname.startsWith('/peak')) return '山峰详情'
  if (pathname.startsWith('/viewshed')) return '视域分析'
  if (pathname.startsWith('/nfc')) return '探索印记'
  if (pathname.startsWith('/journey')) return '山见档案'
  return '山见'
}

function tabOf(pathname: string): 'home' | 'map' | 'nfc' | 'journey' {
  if (pathname === '/') return 'home'
  if (pathname.startsWith('/map')) return 'map'
  if (pathname.startsWith('/nfc')) return 'nfc'
  if (pathname.startsWith('/journey')) return 'journey'
  return 'home'
}
