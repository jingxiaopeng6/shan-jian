import { Link } from 'react-router-dom'
import { ArrowRight, Mountain, Camera, Eye, MapPin } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-ink">
      {/* 远景山脉 SVG */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <svg viewBox="0 0 1200 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          {/* 天空渐变 */}
          <defs>
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#101713" />
              <stop offset="50%" stopColor="#17251D" />
              <stop offset="100%" stopColor="#243C30" />
            </linearGradient>
            <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#243C30" />
              <stop offset="100%" stopColor="#101713" />
            </linearGradient>
          </defs>

          <rect width="1200" height="800" fill="url(#sky)" />

          {/* 最远山脊 */}
          <path
            d="M0,420 L0,320 L100,290 L200,330 L320,260 L440,310 L560,240 L680,290 L800,250 L920,300 L1040,270 L1200,300 L1200,420 Z"
            fill="#17251D" opacity="0.6" className="mountain-glow"
          />
          {/* 中景山脊 */}
          <path
            d="M0,520 L0,400 L120,360 L240,420 L380,340 L520,400 L660,330 L800,380 L940,350 L1080,390 L1200,360 L1200,520 Z"
            fill="#243C30" opacity="0.8"
          />
          {/* 近景山脊 */}
          <path
            d="M0,800 L0,500 L80,460 L180,520 L300,440 L440,490 L580,420 L720,470 L860,430 L1000,480 L1140,450 L1200,470 L1200,800 Z"
            fill="#0d1410" opacity="0.95"
          />
          {/* 日落光晕 */}
          <circle cx="930" cy="280" r="45" fill="#D7A85C" opacity="0.08" />
          <circle cx="930" cy="280" r="80" fill="#D7A85C" opacity="0.04" />
        </svg>
      </div>

      {/* 顶部栏 */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-safe">
        <div className="pt-4">
          <div className="font-serif text-lg text-mist tracking-wider">山见</div>
        </div>
        <div className="pt-4 text-2xs text-rock-300 tracking-[0.2em]">
          武功山 · 江西
        </div>
      </header>

      {/* 中央 Hero */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      >
        {/* 标题 */}
        <h1 className="font-serif text-6xl sm:text-7xl font-bold text-mist leading-none tracking-tight">
          山 见
        </h1>

        {/* 分割线 */}
        <div className="w-12 h-px bg-gold-200/40 my-6" />

        {/* Slogan */}
        <p className="font-serif text-base text-mist/80 text-center leading-relaxed">
          看见风景
          <br />
          也看懂风景
        </p>

        {/* 副标题 */}
        <p className="mt-4 text-2xs text-rock-300 text-center leading-relaxed max-w-xs">
          基于三维 GIS、AR 与空间智能的景区探索体验
        </p>

        {/* CTA */}
        <Link
          to="/map"
          className="mt-10 inline-flex items-center justify-center gap-2 h-12 px-8 rounded-xl bg-gold-200 text-ink text-sm font-medium hover:bg-gold-100 active:bg-gold-300 transition-all duration-300 shadow-glass"
        >
          开始探索武功山
          <ArrowRight size={16} />
        </Link>

        {/* 小字功能列表 */}
        <div className="mt-6 flex items-center gap-4 text-2xs text-rock-300">
          <span className="inline-flex items-center gap-1">
            <Mountain size={11} /> 3D 地图
          </span>
          <span className="text-rock-500">·</span>
          <span className="inline-flex items-center gap-1">
            <Camera size={11} /> AR 看山
          </span>
          <span className="text-rock-500">·</span>
          <span className="inline-flex items-center gap-1">
            <Eye size={11} /> 视域分析
          </span>
          <span className="text-rock-500">·</span>
          <span className="inline-flex items-center gap-1">
            <MapPin size={11} /> NFC 探索
          </span>
        </div>

        {/* 底部 GIS 说明 */}
        <div className="absolute bottom-6 left-0 right-0 px-6">
          <div className="glass-panel rounded-xl px-4 py-3 text-center">
            <p className="text-3xs text-rock-300 leading-relaxed">
              GIS 是《山见》的核心底座
            </p>
            <p className="mt-0.5 text-3xs text-rock-400 leading-relaxed">
              通过 DEM、空间定位、三维地形和视域分析，把景区从平面地图变成可计算的数字空间
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
