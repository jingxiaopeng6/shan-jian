import { Link, useNavigate, useParams } from 'react-router-dom'
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
          <div className="font-serif text-forest-800 text-xl mb-2">山峰未找到</div>
          <p className="text-stone2-500 text-sm mb-6">可能已被移除或链接有误。</p>
          <Link to="/" className="inline-flex h-10 items-center px-5 rounded-xl2 bg-forest-700 text-white text-sm hover:bg-forest-800 transition">
            返回首页
          </Link>
        </div>
      </PageContainer>
    )
  }

  const relatedPeaks = peaks.filter((p) => peak.relatedIds.includes(p.id))

  return (
    <div>
      {/* 顶部 SVG 山峰剪影封面 */}
      <div className="relative bg-gradient-to-b from-forest-100 via-forest-50 to-sand-50 overflow-hidden">
        <svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice" className="w-full h-56 sm:h-72">
          <defs>
            <linearGradient id="skyline" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#e1ebe5" />
              <stop offset="100%" stopColor="#f3f6f4" />
            </linearGradient>
          </defs>
          <rect width="1200" height="420" fill="url(#skyline)" />
          <path d="M0,420 L0,260 L160,200 L280,240 L380,180 L490,230 L620,170 L740,220 L860,190 L980,250 L1100,210 L1200,240 L1200,420 Z" fill="#9bbba8" opacity="0.5" />
          <path d="M0,420 L0,320 L140,270 L270,310 L400,250 L540,300 L680,260 L820,310 L960,270 L1200,300 L1200,420 Z" fill="#4f7d67" opacity="0.85" />
          <path d="M0,420 L0,380 L160,360 L280,380 L420,350 L560,380 L700,355 L860,385 L1020,360 L1200,380 L1200,420 Z" fill="#325043" />
          {/* 峰名标注 */}
          <text x="50%" y="140" textAnchor="middle" fill="#23362f" fontSize="40" fontFamily="'Noto Serif SC', serif" fontWeight="600" letterSpacing="8">
            {peak.name}
          </text>
          <text x="50%" y="175" textAnchor="middle" fill="#5f4f3f" fontSize="16" letterSpacing="4">
            {peak.pinyin.toUpperCase()} · {peak.elevation} M
          </text>
        </svg>
      </div>

      <PageContainer className="pt-6">
        {/* 基本信息 */}
        <section>
          <div className="flex items-center justify-between">
            <h1 className="font-serif text-forest-900 text-2xl font-semibold">{peak.name}</h1>
            <div className="text-right">
              <div className="text-sand-600 text-lg font-medium tabular-nums">{peak.elevation} m</div>
              <div className="text-[11px] text-stone2-400">海拔</div>
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <InfoRow label="坐标" value={`${peak.lat.toFixed(4)}°N, ${peak.lng.toFixed(4)}°E`} />
            <InfoRow label="观赏时段" value={peak.bestViewTime.replace(/^最佳观赏：/, '')} />
          </div>

          <p className="mt-5 text-forest-800/90 text-sm leading-7">
            {peak.description}
          </p>
        </section>

        {/* 关联山峰 */}
        {relatedPeaks.length > 0 && (
          <section className="mt-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-forest-800 text-base font-semibold">关联山峰</h2>
              <span className="text-[11px] text-stone2-400">相邻山脊与徒步线</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {relatedPeaks.map((p) => (
                <Link
                  key={p.id}
                  to={`/peak/${p.id}`}
                  className="group rounded-xl2 border border-forest-100 bg-white p-3 hover:border-forest-300 hover:shadow-soft transition"
                >
                  <div className="flex items-baseline justify-between">
                    <span className="text-forest-800 text-sm font-medium">{p.name}</span>
                    <span className="text-[11px] text-sand-500 tabular-nums">{p.elevation} m</span>
                  </div>
                  <p className="mt-2 text-xs text-stone2-500 leading-5 truncate-2">{p.description}</p>
                  <div className="mt-2 text-[11px] text-forest-600 group-hover:underline">查看详情 →</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* 底部动作 */}
        <section className="mt-10 mb-4 flex flex-col sm:flex-row gap-3">
          <Link
            to={`/viewshed?peakId=${peak.id}`}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl2 bg-forest-700 text-white text-sm font-medium hover:bg-forest-800 shadow-soft transition"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 20l10-7 10 7" />
              <circle cx="12" cy="9" r="4" />
            </svg>
            🔍 视域分析
          </Link>
          <button
            type="button"
            onClick={() => navigate('/ar')}
            className="inline-flex items-center justify-center gap-2 h-12 px-6 rounded-xl2 border border-forest-200 bg-white text-forest-800 text-sm font-medium hover:bg-forest-50 transition"
          >
            返回 AR 看山
          </button>
        </section>
      </PageContainer>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl2 bg-white border border-forest-100 px-4 py-3">
      <div className="text-[11px] text-stone2-400 mb-1 tracking-wider">{label}</div>
      <div className="text-forest-800 text-sm leading-6">{value}</div>
    </div>
  )
}
