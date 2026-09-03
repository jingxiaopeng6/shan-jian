import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'

/**
 * 全局布局壳：
 * - 移动端优先，最大宽度容器
 * - 顶部 Header（首页隐藏返回，其他页面显示返回 + 标题）
 * - 底部极简 Footer（仅品牌小字）
 */
export default function AppLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const showBack = location.pathname !== '/'

  // 路由切换滚动回顶
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [location.pathname])

  const pageTitle = titleOf(location.pathname)

  return (
    <div className="min-h-full flex flex-col bg-forest-50 text-ink">
      {/* 顶部导航 */}
      <header className="safe-top sticky top-0 z-30 backdrop-blur bg-forest-50/80 border-b border-forest-100">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-2">
          {showBack ? (
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-9 h-9 -ml-2 flex items-center justify-center rounded-full text-forest-700 hover:bg-forest-100 active:bg-forest-200 transition"
              aria-label="返回"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          ) : (
            <div className="w-9 h-9 -ml-2 flex items-center justify-center text-forest-700">
              <svg width="22" height="22" viewBox="0 0 64 64">
                <rect x="1" y="1" width="62" height="62" rx="14" fill="#325043" />
                <path d="M12 46 L26 24 L34 34 L44 20 L54 46 Z" fill="#e6d2a9" />
              </svg>
            </div>
          )}

          <div className="flex-1 flex items-center">
            <span
              className={`font-serif tracking-wide ${showBack ? 'text-base text-forest-900' : 'text-lg font-semibold text-forest-800'}`}
            >
              {pageTitle}
            </span>
          </div>

          {!showBack && (
            <div className="text-xs text-stone2-400 hidden sm:block">武功山示范场景 · MVP</div>
          )}
        </div>
      </header>

      {/* 主内容 */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* 底部极简 Footer */}
      <footer className="safe-bottom border-t border-forest-100 py-4 px-4">
        <div className="max-w-3xl mx-auto text-center text-xs text-stone2-400 tracking-wide">
          © 山见 · 智慧文旅 &nbsp;·&nbsp; 看见风景，也看懂风景
        </div>
      </footer>
    </div>
  )
}

function titleOf(pathname: string): string {
  if (pathname === '/') return '山见'
  if (pathname.startsWith('/map')) return '武功山 · 3D 地图'
  if (pathname.startsWith('/ar')) return 'AR 看山'
  if (pathname.startsWith('/peak')) return '山峰详情'
  if (pathname.startsWith('/viewshed')) return '视域分析'
  return '山见'
}
