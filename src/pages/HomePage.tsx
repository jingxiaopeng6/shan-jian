import { Link } from 'react-router-dom'
import { ArrowRight, Mountain, Camera, Eye, MapPin, Compass, Award } from 'lucide-react'
import Button from '../components/ui/Button'

export default function HomePage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-cheese-gradient">

      {/* ===== 远景山脉 SVG（浅色青苹果调）===== */}
      <div className="absolute inset-0 z-0" aria-hidden="true">
        <svg viewBox="0 0 1200 800" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* 天空：奶酪渐变 */}
            <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#FBFAF4" />
              <stop offset="60%" stopColor="#F4F1E8" />
              <stop offset="100%" stopColor="#EAE5D3" />
            </linearGradient>
            {/* 最远山脊：浅青苹果 */}
            <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#C8DE9A" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#A9CB65" stopOpacity="0.4" />
            </linearGradient>
            {/* 中景山脊：青苹果中 */}
            <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#8DB838" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#6F9A24" stopOpacity="0.4" />
            </linearGradient>
            {/* 近景：深森林 */}
            <linearGradient id="mtn3" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#3D5A1F" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2D4A2B" stopOpacity="0.95" />
            </linearGradient>
            {/* 太阳光晕 */}
            <radialGradient id="sun" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="#D97B3D" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#D97B3D" stopOpacity="0" />
            </radialGradient>
          </defs>

          <rect width="1200" height="800" fill="url(#sky)" />

          {/* 太阳 */}
          <circle cx="930" cy="280" r="160" fill="url(#sun)" />
          <circle cx="930" cy="280" r="32" fill="#D97B3D" opacity="0.18" />

          {/* 最远山脊 */}
          <path
            d="M0,420 L0,320 L100,290 L200,330 L320,260 L440,310 L560,240 L680,290 L800,250 L920,300 L1040,270 L1200,300 L1200,420 Z"
            fill="url(#mtn1)" className="mountain-glow"
          />
          {/* 中景山脊 */}
          <path
            d="M0,520 L0,400 L120,360 L240,420 L380,340 L520,400 L660,330 L800,380 L940,350 L1080,390 L1200,360 L1200,520 Z"
            fill="url(#mtn2)"
          />
          {/* 近景山脊 */}
          <path
            d="M0,800 L0,500 L80,460 L180,520 L300,440 L440,490 L580,420 L720,470 L860,430 L1000,480 L1140,450 L1200,470 L1200,800 Z"
            fill="url(#mtn3)"
          />

          {/* 金顶标记 — 青苹果小圆点 */}
          <circle cx="580" cy="420" r="4" fill="#FBFAF4" stroke="#8DB838" strokeWidth="2" />
        </svg>
      </div>

      {/* ===== Hero 内容 ===== */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6"
        style={{ minHeight: 'calc(100vh - 64px)' }}
      >
        {/* 品牌徽标 */}
        <div className="mt-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-apple-gradient flex items-center justify-center shadow-apple">
            <Mountain size={26} className="text-cheese-50" strokeWidth={2} />
          </div>
        </div>

        {/* 主标题 — 超大显示字号 */}
        <h1 className="font-serif text-5xl sm:text-6xl font-bold text-forest-700 leading-none tracking-tight">
          山 见
        </h1>

        {/* 分割线 — 青苹果渐变 */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-apple-400 to-transparent my-5" />

        {/* Slogan */}
        <p className="font-serif text-xl text-forest-600 text-center leading-relaxed font-medium">
          看见风景
          <br />
          也看懂风景
        </p>

        {/* 副标题 — 清晰可读 */}
        <p className="mt-5 text-sm text-ink-50 text-center leading-relaxed max-w-xs">
          基于三维 GIS、AR 与空间智能的<br />武功山景区探索体验
        </p>

        {/* 主 CTA — Primary 青苹果按钮 */}
        <Link to="/map" className="mt-8 w-full max-w-xs">
          <Button variant="primary" size="lg" fullWidth rightIcon={<ArrowRight size={18} />}>
            开始探索武功山
          </Button>
        </Link>

        {/* 功能列表 — 5 个核心入口 */}
        <div className="mt-7 w-full max-w-md">
          <div className="glass-light rounded-2xl p-4">
            <div className="grid grid-cols-5 gap-2">
              <FeatureChip icon={<Mountain size={16} />} label="3D 地图" to="/map" />
              <FeatureChip icon={<Camera size={16} />} label="AR 看山" to="/ar" />
              <FeatureChip icon={<Eye size={16} />} label="视域分析" to="/viewshed" />
              <FeatureChip icon={<Compass size={16} />} label="打卡" to="/nfc" />
              <FeatureChip icon={<Award size={16} />} label="成就档案" to="/journey" />
            </div>
          </div>
        </div>

        {/* 底部说明 — 通俗易懂 */}
        <div className="mt-6 w-full max-w-md">
          <div className="flex items-center justify-center gap-2 text-caption text-rock-400">
            <span className="inline-flex items-center gap-1">
              <MapPin size={10} className="text-apple-500" />
              <span>真实卫星地形数据 · 立体可见</span>
            </span>
          </div>
          <p className="mt-1.5 text-overline text-rock-400 text-center tracking-wider">
            每一座山都有它的故事
          </p>
        </div>
      </div>
    </div>
  )
}

function FeatureChip({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-apple-50 active:bg-apple-100 transition-colors group"
    >
      <span className="flex items-center justify-center w-9 h-9 rounded-full bg-apple-100 text-apple-600 group-hover:bg-apple-200 transition-colors">
        {icon}
      </span>
      <span className="text-overline text-ink-50">{label}</span>
    </Link>
  )
}
