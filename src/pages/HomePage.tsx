import { Link } from 'react-router-dom'
import PageContainer from '../components/PageContainer'

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Hero 背景：克制的 CSS 图形（山脉剪影） */}
      <div
        className="absolute inset-x-0 top-0 h-[58vh] -z-10"
        aria-hidden="true"
        style={{
          background:
            'linear-gradient(180deg, #e1ebe5 0%, #f3f6f4 55%, #fbf7ef 100%)'
        }}
      >
        <svg
          className="absolute inset-x-0 bottom-0 w-full"
          viewBox="0 0 1200 420"
          preserveAspectRatio="none"
          style={{ height: '60%' }}
        >
          <path
            d="M0,420 L0,280 L80,240 L160,300 L260,220 L360,290 L470,200 L580,270 L690,230 L800,310 L920,240 L1040,290 L1140,250 L1200,280 L1200,420 Z"
            fill="#9bbba8"
            opacity="0.55"
          />
          <path
            d="M0,420 L0,330 L120,290 L220,340 L340,280 L460,330 L580,270 L700,320 L820,280 L940,340 L1060,300 L1200,330 L1200,420 Z"
            fill="#6e9a83"
            opacity="0.7"
          />
          <path
            d="M0,420 L0,380 L160,360 L280,380 L420,350 L560,380 L700,355 L860,385 L1020,360 L1200,380 L1200,420 Z"
            fill="#4f7d67"
            opacity="0.85"
          />
        </svg>
      </div>

      <PageContainer className="pt-10 sm:pt-14">
        {/* Hero 文案 */}
        <section className="pt-10 sm:pt-14 pb-10">
          <div className="text-xs tracking-[0.4em] text-forest-600 mb-4">
            SHAN · JIAN
          </div>
          <h1 className="font-serif text-5xl sm:text-6xl font-semibold text-forest-900 leading-tight">
            山 见
          </h1>
          <p className="mt-4 text-lg text-forest-700 font-serif">
            看见风景，也看懂风景。
          </p>
          <p className="mt-3 text-sm text-stone2-500 leading-relaxed max-w-sm">
            基于三维 GIS、AR 与空间智能的景区探索体验
          </p>

          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link
              to="/map"
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl2 bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 active:bg-forest-900 transition shadow-soft"
            >
              开始探索武功山
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 5l7 7-7 7" />
              </svg>
            </Link>
            <Link
              to="/ar"
              className="inline-flex items-center justify-center gap-2 px-6 h-12 rounded-xl2 border border-forest-200 text-forest-800 text-sm font-medium bg-white/60 hover:bg-white active:bg-forest-50 transition"
            >
              AR 看山
            </Link>
          </div>

          {/* 快速入口 */}
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/nfc" className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-xs hover:bg-forest-100 transition">
              📱 NFC 打卡
            </Link>
            <Link to="/viewshed" className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-xs hover:bg-forest-100 transition">
              🔍 视域分析
            </Link>
            <Link to="/journey" className="inline-flex items-center gap-1 px-3 h-9 rounded-full bg-forest-50 border border-forest-200 text-forest-700 text-xs hover:bg-forest-100 transition">
              🗺️ 山见档案
            </Link>
          </div>
        </section>

        {/* GIS 核心说明 */}
        <section className="mt-6 rounded-xl2 bg-forest-50 border border-forest-100 p-4">
          <div className="text-sm font-medium text-forest-800 mb-1">GIS 是《山见》的核心底座</div>
          <p className="text-xs text-stone2-500 leading-relaxed">
            通过 DEM、空间定位、三维地形和视域分析，把景区从平面地图变成可计算的数字空间。
          </p>
        </section>

        {/* 体验流程 */}
        <section className="mt-8 rounded-xl2 bg-white/60 border border-forest-100 p-4 shadow-soft">
          <div className="text-xs text-forest-600 font-medium mb-3 tracking-wide">产品体验流程</div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone2-600">
            <FlowStep icon="🗺️" label="地图认知" />
            <FlowArrow />
            <FlowStep icon="📷" label="AR 看山" />
            <FlowArrow />
            <FlowStep icon="🔍" label="视域分析" />
            <FlowArrow />
            <FlowStep icon="📱" label="NFC 打卡" />
            <FlowArrow />
            <FlowStep icon="🗺️" label="山见档案" />
          </div>
        </section>

        {/* 三个特性 */}
        <section className="mt-6 grid gap-3 sm:grid-cols-3">
          <FeatureCard
            title="三维 GIS"
            desc="基于真实 DEM 的武功山三维地形与山峰标注。"
            icon={
              <path d="M3 11l9-8 9 8-9 8-9-8zM3 11v10h18V11" />
            }
          />
          <FeatureCard
            title="AR 看山"
            desc="视线方向内的山峰名称、海拔与距离实时叠加。"
            icon={
              <>
                <rect x="3" y="7" width="18" height="12" rx="2" />
                <circle cx="12" cy="13" r="3" />
                <path d="M7 7l-1-3h12l-1 3" />
              </>
            }
          />
          <FeatureCard
            title="视域分析"
            desc="基于 DEM 地形计算视线遮挡，告诉你这座山能不能看到。"
            icon={
              <>
                <path d="M2 20l10-7 10 7" />
                <circle cx="12" cy="9" r="4" />
                <path d="M8 9h8M12 5v8" />
              </>
            }
          />
        </section>

        {/* 底部说明 */}
        <section className="mt-10 mb-4 text-center text-xs text-stone2-400 tracking-wider">
          以武功山为示范场景 · MVP 演示版 · 所有数据均为模拟
        </section>
      </PageContainer>
    </div>
  )
}

interface FeatureCardProps {
  title: string
  desc: string
  icon: React.ReactNode
}

function FeatureCard({ title, desc, icon }: FeatureCardProps) {
  return (
    <div className="rounded-xl2 bg-white/70 border border-forest-100 p-4 shadow-soft">
      <div className="w-9 h-9 rounded-lg bg-forest-700 text-white flex items-center justify-center mb-3">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          {icon}
        </svg>
      </div>
      <div className="text-forest-800 font-medium text-sm mb-1">{title}</div>
      <div className="text-stone2-500 text-xs leading-relaxed">{desc}</div>
    </div>
  )
}

function FlowStep({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-700">
      <span>{icon}</span>
      {label}
    </span>
  )
}

function FlowArrow() {
  return <span className="text-forest-400 text-[10px]">→</span>
}
