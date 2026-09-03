import PageContainer from '../components/PageContainer'
import CesiumMap from '../components/CesiumMap'
import { Link } from 'react-router-dom'

export default function MapPage() {
  return (
    <div className="relative">
      {/* Cesium 全屏地图容器，手机端高度自适应 */}
      <div className="w-full relative h-[72vh] sm:h-[68vh]">
        <CesiumMap />

        {/* 浮动工具栏 */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 w-[92%] max-w-xl flex gap-2 pointer-events-none">
          <Link
            to="/ar"
            className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-forest-700/90 text-white text-xs sm:text-sm hover:bg-forest-800 backdrop-blur shadow-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3"/></svg>
            AR 看山
          </Link>
          <Link
            to="/viewshed"
            className="pointer-events-auto flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-full bg-white/90 text-forest-800 text-xs sm:text-sm hover:bg-white border border-forest-100 backdrop-blur shadow-soft"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20l10-7 10 7"/><circle cx="12" cy="9" r="4"/></svg>
            视域分析
          </Link>
        </div>

        {/* 左下说明卡 */}
        <div className="absolute left-3 bottom-3 z-20 max-w-[60%] rounded-xl bg-white/85 backdrop-blur border border-forest-100 px-3 py-2 text-[11px] sm:text-xs text-forest-800 shadow-soft">
          <div className="font-medium mb-0.5">武功山 · 江西萍乡</div>
          <div className="text-stone2-500">罗霄山脉北支 · 主峰金顶 1918 m</div>
        </div>
      </div>

      <PageContainer className="pt-4">
        <section className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-serif text-forest-800 text-lg sm:text-xl font-semibold">
              主要山峰导览
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-stone2-500">
              点击地图标注或下方卡片进入山峰详情。
            </p>
          </div>
          <Link
            to="/"
            className="text-xs text-forest-600 hover:text-forest-800 self-center"
          >
            返回首页
          </Link>
        </section>
      </PageContainer>
    </div>
  )
}
