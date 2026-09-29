/**
 * AchievementPanel — 成就展示面板
 *
 * 包含：
 * 1. 等级卡：当前头衔 + 进度条 + 距下级提示
 * 2. 徽章墙：8 枚里程碑徽章，已解锁高亮，未解锁灰色 + 锁
 */

import { Trophy } from 'lucide-react'
import {
  getAchievementLevel,
  getMilestones,
  type AchievementStats,
} from '../services/achievementService'

interface Props {
  stats: AchievementStats
  hasGeneratedPoster: boolean
}

export default function AchievementPanel({ stats, hasGeneratedPoster }: Props) {
  const level = getAchievementLevel(stats)
  const milestones = getMilestones(stats, hasGeneratedPoster)
  const unlockedCount = milestones.filter((m) => m.unlocked).length

  return (
    <div className="space-y-4" data-testid="achievement-panel">
      {/* 等级卡 */}
      <div className="glass-light rounded-3xl p-5 shadow-glass relative overflow-hidden" data-testid="level-card">
        {/* 装饰山脉背景 */}
        <div className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none">
          <svg viewBox="0 0 400 80" className="w-full h-16" preserveAspectRatio="none">
            <path d="M0 80 L40 30 L80 55 L120 15 L160 45 L200 20 L240 50 L280 10 L320 40 L400 25 L400 80 Z" fill="#8DB838" />
          </svg>
        </div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-overline text-apple-600 tracking-wider font-semibold mb-0.5">当前头衔</div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl">{level.icon}</span>
                <span className="text-xl font-bold text-forest-700">{level.title}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-overline text-rock-400 tracking-wider">等级</div>
              <div className="text-2xl font-bold text-apple-600 tabular-nums">
                {level.level}<span className="text-sm text-rock-400">/5</span>
              </div>
            </div>
          </div>

          {/* 进度条 */}
          <div className="rounded-full bg-apple-100 h-2 overflow-hidden">
            <div
              className="h-full bg-apple-gradient rounded-full transition-all duration-500"
              style={{ width: `${level.progress}%` }}
              data-testid="level-progress"
            />
          </div>

          {/* 下级提示 */}
          <div className="mt-2 text-caption">
            {level.nextLevelHint ? (
              <span className="text-rock-400">{level.nextLevelHint}</span>
            ) : (
              <span className="text-apple-600 font-semibold inline-flex items-center gap-1">
                <Trophy size={11} />
                已达成最高等级，恭喜你！
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 徽章墙 */}
      <div className="glass-light rounded-2xl p-4 shadow-card" data-testid="badge-wall">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-forest-600 inline-flex items-center gap-1.5">
            <Trophy size={14} className="text-apple-500" />
            里程碑徽章
          </h2>
          <span className="text-overline text-rock-400 tabular-nums">
            {unlockedCount} / {milestones.length}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col items-center text-center p-2 rounded-xl border transition-all ${
                m.unlocked
                  ? 'bg-apple-50 border-apple-400/30'
                  : 'bg-cheese-50/40 border-apple-400/10 opacity-60'
              }`}
              title={m.description}
              data-testid={`badge-${m.id}`}
            >
              <span className={`text-2xl ${m.unlocked ? '' : 'grayscale opacity-50'}`}>
                {m.unlocked ? m.icon : '🔒'}
              </span>
              <span className={`text-[9px] mt-1 leading-tight font-medium ${
                m.unlocked ? 'text-forest-600' : 'text-rock-400'
              }`}>
                {m.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
