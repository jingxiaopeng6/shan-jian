import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Eye, Mountain, MapPin, Clock, ChevronRight } from 'lucide-react'
import PageContainer from '../components/PageContainer'
import { getPeakById, peaks } from '../data/mock'

export default function PeakDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const peak = getPeakById(id)

  if (!peak) {
    return (
      <PageContainer>
        <div className="py-16 text-center">
          <div className="font-serif text-forest-700 text-xl mb-2">山峰未找到</div>
          <p className="text-rock-400 text-sm mb-6">可能已被移除或链接有误。</p>
          <Link to="/" className="inline-flex h-10 items-center px-5 rounded-full bg-apple-400 text-cheese-50 text-sm font-medium hover:bg-apple-300 transition shadow-apple">
            返回首页
          </Link>
        </div>
      </PageContainer>
    )
  }

  const relatedPeaks = peaks.filter((p) => peak.relatedIds.includes(p.id))

  return (
    <div className="min-h-screen bg-cheese text-ink pb-20">
      {/* ===== 顶部山峰剪影封面 —— 浅色青苹果调 ===== */}
      <div className="relative bg-cheese-gradient overflow-hidden">
        <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" className="w-full h-56 sm:h-72">
          <defs>
            <linearGradient id="skyline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"  stopColor="#FBFAF4" />
              <stop offset="60%" stopColor="#F4F1E8" />
              <stop offset="100%" stopColor="#EAE5D3" />
            </linearGradient>
          </defs>
          <rect width="1200" height="420" fill="url(#skyline)" />
          {/* 最远山脊 —— 浅青苹果 */}
          <path d="M0,420 L0,260 L160,200 L280,240 L380,180 L490,230 L620,170 L740,220 L860,190 L980,250 L1100,210 L1200,240 L1200,420 Z" fill="#C8DE9A" opacity="0.55" className="mountain-glow" />
          {/* 中景山脊 —— 青苹果中 */}
          <path d="M0,420 L0,320 L140,270 L270,310 L400,250 L540,300 L680,260 L820,310 L960,270 L1200,300 L1200,420 Z" fill="#8DB838" opacity="0.5" />
          {/* 前景山脊 —— 深森林 */}
          <path d="M0,420 L0,380 L160,360 L280,380 L420,350 L560,380 L700,355 L860,385 L1020,360 L1200,380 L1200,420 Z" fill="#3D5A1F" opacity="0.95" />
          {/* 太阳光晕 */}
          <circle cx="930" cy="180" r="60" fill="#D97B3D" opacity="0.12" />
          {/* 峰名标注 */}
          <text x="50%" y="140" textAnchor="middle" fill="#2D4A2B" fontSize="42" fontFamily="'Noto Serif SC', serif" fontWeight="700" letterSpacing="8">
            {peak.name}
          </text>
          <text x="50%" y="175" textAnchor="middle" fill="#6F9A24" fontSize="14" letterSpacing="4" fontWeight="600">
            {peak.pinyin.toUpperCase()} · {peak.elevation} M
          </text>
        </svg>
      </div>

      <PageContainer className="pt-6 safe-bottom">
        {/* 返回按钮 */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-rock-400 text-sm hover:text-apple-600 transition mb-4"
        >
          <ArrowLeft size={14} />
          返回
        </button>

        {/* 基本信息 */}
        <section>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-serif text-forest-700 text-3xl font-bold">{peak.name}</h1>
              <div className="mt-1 text-overline text-rock-400 tracking-wider font-medium">{peak.pinyin}</div>
            </div>
            <div className="text-right">
              <div className="text-apple-600 text-2xl font-bold tabular-nums">{peak.elevation} m</div>
              <div className="text-overline text-rock-400">海拔</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow icon={<MapPin size={12} />} label="坐标" value={`${peak.lat.toFixed(4)}°N, ${peak.lng.toFixed(4)}°E`} />
            <InfoRow icon={<Clock size={12} />} label="观赏时段" value={peak.bestViewTime.replace(/^最佳观赏：/, '')} />
          </div>

          <p className="mt-5 text-ink-50 text-sm leading-7">
            {peak.description}
          </p>
        </section>

        {/* 关联山峰 */}
        {relatedPeaks.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-forest-700 text-lg font-bold">关联山峰</h2>
              <span className="text-overline text-rock-400">相邻山脊与徒步线</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedPeaks.map((p) => (
                <Link
                  key={p.id}
                  to={`/peak/${p.id}`}
                  className="group glass-light rounded-2xl p-4 hover:bg-apple-50 transition shadow-card"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-ink text-sm font-semibold">{p.name}</span>
                    <span className="text-overline text-apple-600 tabular-nums font-medium">{p.elevation} m</span>
                  </div>
                  <p className="mt-2 text-xs text-ink-50 leading-5 truncate-2">{p.description}</p>
                  <div className="mt-2 text-overline text-apple-600 group-hover:underline inline-flex items-center gap-0.5 font-medium">
                    查看详情 <ChevronRight size={10} />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 底部动作 —— 三级按钮 */}
        <section className="mt-10 mb-4 flex flex-col sm:flex-row gap-3">
          <Link
            to={`/viewshed?peakId=${peak.id}`}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-apple-400 text-cheese-50 text-sm font-semibold hover:bg-apple-300 transition active:scale-95 shadow-apple"
          >
            <Eye size={15} />
            视域分析
          </Link>
          <button
            type="button"
            onClick={() => navigate('/ar')}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-full bg-cheese-50 text-apple-600 border border-apple-400/40 text-sm font-medium hover:bg-apple-50 transition active:scale-95"
          >
            <Mountain size={15} />
            返回 AR 看山
          </button>
        </section>
      </PageContainer>
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="glass-light rounded-2xl px-4 py-3 shadow-card">
      <div className="flex items-center gap-1.5 text-overline text-apple-600 mb-1 tracking-wider font-semibold">
        {icon}
        {label}
      </div>
      <div className="text-ink text-sm leading-6 font-medium">{value}</div>
    </div>
  )
}
