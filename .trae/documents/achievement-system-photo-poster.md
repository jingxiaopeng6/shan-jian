# 旅行成就系统 + 照片明信片海报生成

## Context

用户反馈：当前 JourneyPage 的「生成旅行海报」功能只是基于已有数据的 SVG 卡片，缺乏成就感和个性化。希望：

1. **照片拼图**：用户可上传自己的旅行照片，与探索数据组合成创意明信片
2. **更有成就感的成就系统**：不只是简单的进度百分比，要有等级头衔 + 里程碑徽章

用户已确认设计方向（3 项均选推荐）：
- 成就体系：**等级 + 徽章双轨**（5 级登山者头衔 + 多个里程碑徽章）
- 海报风格：**旅行明信片**（1 张主照片 + 装饰山脉 + 探索数据叠层 + 日期）
- 照片存储：**仅本次会话**（不持久化，避免撑爆 localStorage 配额）

## 设计方案

### 1. 成就等级体系（5 级登山者头衔）

| 等级 | 头衔 | 解锁条件 | 图标 |
|------|------|---------|------|
| 1 | 青铜登山者 | 默认（首次进入） | 🥉 |
| 2 | 白银登山者 | 打卡 ≥ 1 个景点 | 🥈 |
| 3 | 黄金登山者 | 打卡 ≥ 2 个景点 或 累计距离 ≥ 5km | 🥇 |
| 4 | 铂金登山者 | 打卡 ≥ 3 个景点 或 累计距离 ≥ 15km | 💎 |
| 5 | 钻石登山者 | 打卡所有 NFC 景点（大满贯） | 👑 |

每级展示：当前头衔 + 已解锁等级链路 + 「距下个等级还差 X 个景点 / Y km」进度条。

### 2. 里程碑徽章（8 枚）

| 徽章 | 解锁条件 | 图标 |
|------|---------|------|
| 初访武功山 | 首次完成 NFC 打卡 | 🎯 |
| 金顶征服者 | 打卡金顶 | 🏔 |
| 云端漫步 | 打卡发云界 | ☁️ |
| 山野探险家 | 打卡羊狮幕 | 🦁 |
| 长途跋涉 | 累计探索距离 ≥ 10km | 📏 |
| 三绝集齐 | 3 个 NFC 景点全部打卡 | 🌟 |
| 旅行印记 | 生成第一张明信片海报 | 📸 |
| 百公里俱乐部 | 累计探索距离 ≥ 100km | 🏆 |

每个徽章状态：已解锁（青苹果高亮）/ 未解锁（灰色 + 锁图标）。

### 3. 旅行明信片海报

**布局**（Canvas 1080×1620，3:4.5 竖版，适配手机分享）：

```
┌────────────────────────────┐
│                            │
│                            │
│    [用户照片 60% 高度]      │  圆角 + 奶酪色边框
│                            │  叠加装饰山脉 SVG
│                            │
├────────────────────────────┤
│  山见 logo + 日期           │
│                            │
│  ┌─────┬─────┬─────┐        │
│  │ Xkm │ N峰 │ N印 │        │  3 个统计卡（奶酪底）
│  └─────┴─────┴─────┘        │
│                            │
│  探索路线: A → B → C        │
│                            │
│  [徽章图标 5 枚一行]        │
│                            │
│  www.shanjian.app           │  底部水印
└────────────────────────────┘
```

**生成技术**：Canvas 2D API 手动绘制（无第三方依赖，跨浏览器兼容）。
- 用户照片：`FileReader.readAsDataURL` → `Image` → `drawImage`（圆角 clip）
- 装饰山脉：`Path2D` + `fillStyle` 绘制青苹果色山脉轮廓
- 文字：`fillText` + 字号 / 字重映射
- 统计卡：圆角矩形 `roundRect` + 文字
- 徽章：emoji `fillText` + 未解锁的灰色透明
- 下载：`canvas.toBlob` → `URL.createObjectURL` → `<a download>`

**照片预处理**：
- 限制 JPG/PNG/WEBP，≤ 5MB
- 用 Canvas 自动压缩到 1080px 宽（保持比例），避免 dataURL 过大
- 圆形 / 圆角矩形裁剪对齐到照片中心

### 4. UX 流程

JourneyPage 顶部新增「成就等级卡」：
```
┌─────────────────────────────┐
│ 🥇 黄金登山者                │
│ ═════════════════════ 75%   │
│ 距铂金登山者还差 1 个景点     │
└─────────────────────────────┘
```

JourneyPage 中部「徽章墙」：
```
[🎯][🏔][☁️][🦁]
[🔒][📏][🔒][🏆]  ← 未解锁灰色
```

「生成旅行海报」按钮改为「📸 制作明信片」：
1. 点击 → 弹出 BottomSheet
2. 上传照片（拖拽 / 点击） → 预览
3. 点击「生成海报」→ Canvas 绘制 → 预览
4. 点击「下载海报」→ 保存 PNG
5. 首次生成自动解锁「旅行印记」徽章

## 文件改动

### 新增文件

1. **`src/services/achievementService.ts`** — 纯函数服务
   - `getAchievementLevel(stats)` → `{ level: 1-5, title, icon, progress, nextLevelHint }`
   - `getMilestones(stats, hasGeneratedPoster)` → `Milestone[]`（含 unlocked 状态）
   - 类型：`AchievementLevel`, `Milestone`, `AchievementStats`

2. **`src/components/AchievementPanel.tsx`** — 成就展示组件
   - 等级卡（带进度条 + 下个等级提示）
   - 徽章网格（已解锁高亮、未解锁灰色 + 锁图标）
   - 用 lucide-react `Lock` / `Award` / `Trophy` 图标

3. **`src/components/PhotoUpload.tsx`** — 照片上传组件
   - `<input type="file" accept="image/*">` + 拖拽区
   - 预览圆角矩形
   - 文件大小 / 类型校验 + 错误提示
   - `onPhotoLoaded(dataUrl)` 回调

4. **`src/components/TravelPoster.tsx`** — Canvas 海报生成
   - `useCanvasPoster({ photo, stats, visits, date })` Hook
   - Canvas 1080×1620，绘制完整海报
   - 「下载海报」按钮：`canvas.toBlob` → 下载
   - 首次生成时回调 `onFirstPoster()` 解锁徽章

5. **`src/__tests__/achievement.test.ts`** — 单元测试
   - 各等级边界（0/1/2/3/全打卡）
   - 各徽章解锁条件
   - 距下个等级进度计算

### 修改文件

6. **`src/pages/JourneyPage.tsx`**
   - 在「探索进度总览」上方插入 `<AchievementPanel stats={stats} hasGeneratedPoster={...} />`
   - 把「生成旅行海报」按钮改为打开 BottomSheet
   - BottomSheet 内嵌入 `<PhotoUpload>` + `<TravelPoster>`
   - 用 sessionStorage 记录 `has-generated-poster` 标志（解锁徽章用）

### 不动文件
- `travelLog.ts`（VisitRecord 不变）
- `trackLog.ts`（不动）
- `nfcPoints.ts`（复用现有 badge 数据）
- `tailwind.config.js` / `index.css`（已有颜色和组件类够用）

## 关键技术点

### Canvas 绘制核心代码模板
```typescript
const canvas = document.createElement('canvas')
canvas.width = 1080
canvas.height = 1620
const ctx = canvas.getContext('2d')!

// 1. 奶酪渐变背景
const bgGrad = ctx.createLinearGradient(0, 0, 0, 1620)
bgGrad.addColorStop(0, '#FBFAF4')
bgGrad.addColorStop(1, '#EAE5D3')
ctx.fillStyle = bgGrad
ctx.fillRect(0, 0, 1080, 1620)

// 2. 用户照片（圆角矩形 clip）
const img = await loadImage(photoDataUrl)
ctx.save()
const photoH = 972  // 60%
roundRectPath(ctx, 60, 60, 960, photoH, 32)
ctx.clip()
drawImageCover(ctx, img, 60, 60, 960, photoH)
ctx.restore()
// 奶酪色边框
ctx.strokeStyle = '#F4F1E8'
ctx.lineWidth = 8
ctx.stroke()

// 3. 装饰山脉叠加在照片底部
ctx.fillStyle = 'rgba(141, 184, 56, 0.85)'
ctx.beginPath()
ctx.moveTo(0, 972)
// 山脉路径 ...
ctx.fill()

// 4. 文字 + 统计卡 + 徽章
ctx.fillStyle = '#1F2818'
ctx.font = 'bold 56px "Noto Sans SC", sans-serif'
ctx.fillText('山见', 540, 1100)
// ...
```

### 等级判定核心逻辑
```typescript
export function getAchievementLevel(stats: {
  exploredCount: number
  totalDistanceKm: number
  totalAttractions: number
}): AchievementLevel {
  const { exploredCount, totalDistanceKm, totalAttractions } = stats
  if (exploredCount >= totalAttractions && totalAttractions > 0) {
    return { level: 5, title: '钻石登山者', icon: '👑', progress: 100, nextLevelHint: null }
  }
  if (exploredCount >= 3 || totalDistanceKm >= 15) {
    const next = Math.max(4 - exploredCount, 15 - totalDistanceKm, 0)
    return { level: 4, title: '铂金登山者', icon: '💎', progress: 75, nextLevelHint: `距钻石登山者还差 ${next} 个景点` }
  }
  // ... 类似地往下
}
```

## 测试

### 单元测试 `achievement.test.ts`
- `getAchievementLevel` 各边界：0 景点 → 等级 1；1 → 2；2 → 3；3 → 4；全部 → 5
- 距离阈值：5km/15km/10km/100km 触发对应徽章
- `getMilestones` 已解锁徽章数与输入对应

### 组件测试
- `AchievementPanel` 渲染等级标题 + 徽章网格
- `PhotoUpload` 文件类型错误显示提示
- `TravelPoster` 渲染 canvas 元素且 `toBlob` 可调用

### 端到端验证
1. 打开 JourneyPage → 看到当前等级 + 徽章墙
2. 模拟 1-3 个 NFC 打卡 → 等级 / 徽章状态实时变化
3. 点击「制作明信片」→ 上传照片 → 预览 → 生成 → 下载 PNG
4. 首次生成后「旅行印记」徽章解锁
5. `npx vitest run` 全部测试通过
6. `npm run build` 构建通过

## git commit 规则

按 AGENTS.md 规则，每完成一组改动创建一个 commit：
1. `feat(achievement): 新增成就等级 + 里程碑徽章服务` (achievementService + test)
2. `feat(ui): 新增成就面板组件 + 照片上传组件` (AchievementPanel + PhotoUpload)
3. `feat(poster): Canvas 绘制旅行明信片海报` (TravelPoster + test)
4. `feat(journey): JourneyPage 集成成就系统 + 明信片生成` (集成 + 全量测试)

## 实施顺序

1. 先做 `achievementService.ts` + 单元测试（最简单，纯函数）
2. 再做 `AchievementPanel.tsx`（展示层，依赖 1）
3. 再做 `PhotoUpload.tsx`（独立组件）
4. 再做 `TravelPoster.tsx`（最复杂，依赖 PhotoUpload 输出）
5. 最后改 `JourneyPage.tsx` 整合
6. 全量测试 + 构建 + 提交
