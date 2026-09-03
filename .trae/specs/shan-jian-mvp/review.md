# 《山见》智慧文旅 Web MVP - 独立审查 (Review R1)

- [x] CP-R1: 5 个核心页面可路由访问且 HTTP 200
  - **Type**: `rule`
  - **Covers**: AC-1, AC-7, FR-6
  - **Evidence**: dev server 启动（http://localhost:5173/）后 Invoke-WebRequest 验证 `/`、`/map`、`/ar`、`/peak/jinding`、`/viewshed` 全部返回 200，title="山见 · 智慧文旅"；源代码内部 Link 扫描显示所有 href/to 均指向项目内合法路由，无外链与死链（Grep + Select-String 扫描 8 处匹配通过）。

- [x] CP-R2: 首页 CTA 跳 /map、详情页"为什么能看到"跳 /viewshed
  - **Type**: `rule`
  - **Covers**: AC-2, AC-5, FR-1, FR-4
  - **Evidence**: vitest `nav.test.tsx` 4 用例全部通过：首页 CTA href=/map、AR 快速入口 href=/ar、详情 Link href=/viewshed、返回 AR 按钮存在。

- [x] CP-R3: Cesium 地图页集成 Cesium Viewer + >= 5 山峰标注 + 当前位置
  - **Type**: `rule`
  - **Covers**: AC-3, FR-2
  - **Evidence**: `components/CesiumMap.tsx` 在 useEffect 内创建 `new Cesium.Viewer`、遍历 `peaks`（长度 7）add 实体（Point + Label），并额外 add "当前位置"；山峰实体 `peakId` 字段用于点击跳 `/peak/:id`。构建 `npm run build` 零 Cesium 错误。

- [x] CP-R4: AR 页渲染 >= 3 个山峰徽章（名称/海拔/距离齐全）且可跳转
  - **Type**: `rule`
  - **Covers**: AC-4, FR-3
  - **Evidence**: vitest `ar-page.test.tsx` 通过 → `getAllByTestId(/^ar-badge-/)` 返回 >= 3；徽章内容含数字 m 与数字 km；ArPage 用方位映射（±60° → left% 8~92%）将可见山峰位置化并绑定 `navigate(/peak/:id)` 点击。

- [x] CP-R5: 详情页渲染完整山峰信息 + 无效 id 兜底 + 视域入口
  - **Type**: `rule`
  - **Covers**: AC-5, FR-4
  - **Evidence**: vitest `peak-detail.test.tsx` 2 用例：有效 id 渲染 H1=金顶、含 1918m、含"为什么能看到？"Link（href=/viewshed）；无效 id 渲染"山峰未找到"+ 返回首页链接。

- [x] CP-R6: 视域分析页含俯视/剖面两类 SVG 可视化 + >= 5 座山峰清单
  - **Type**: `rule`
  - **Covers**: AC-6, FR-5
  - **Evidence**: vitest `viewshed.test.tsx` 2 用例：可见清单 `<ul>` 含 >= 5 `<li>`，每条含 km & m；`<svg data-testid="viewshed-plan-svg">` 与 `viewshed-profile-svg` 均存在且各自含 >= 3 个几何元素。

- [x] CP-R7: TS strict + build 通过（0 TS 错误）
  - **Type**: `rule`
  - **Covers**: AC-8, NFR-1
  - **Evidence**: `npm run build` 输出 `tsc -b && vite build` → exit 0；47 modules transformed；dist 产物 3 个文件（index.html、index-*.css、index-*.js）。无 TS\d+ 错误。

- [x] CP-R8: 单元测试 0 失败（>= 12 用例）
  - **Type**: `rule`
  - **Covers**: AC-9, NFR-6
  - **Evidence**: `npm run test`（vitest run）→ Test Files 6 passed (6)、Tests 19 passed (19)、exit 0。

- [x] CP-R9: dist 产物完整
  - **Type**: `rule`
  - **Covers**: AC-8, NFR-5
  - **Evidence**: `dist/index.html` 0.81 kB、`dist/assets/index-*.css` 43.43 kB、`dist/assets/index-*.js` 238.57 kB；构建 output 含 3 个资源引用路径。

- [x] CP-U1: 视觉风格契合度（克制 · 文旅科技感 Rubric）
  - **Type**: `rubric`
  - **Covers**: AC-10, NFR-4
  - **Scale**: 1-5
  - **Anchors**: 1 = 传统旅游 App；3 = 中性但杂乱；5 = 现代克制自然配色
  - **Pass Threshold**: >= 4
  - **Score**: 4.5
  - **Rationale**: Tailwind 主题扩展 forest/stone2/sand 三色盘（深墨绿/石色/暖沙），无渐变滥用；组件统一用 `rounded-xl2`、`shadow-soft`、`border-forest-100`；Hero 用 SVG 山脉剪影而非复杂渐变图；导航仅做返回与标题，无 TabBar；字体用 PingFang SC + Noto Serif SC 双层级。唯一小遗憾是首页 hero 背景使用了线性渐变（但色调克制、仅做背景氛围而非装饰主体）。阈值 >= 4，通过。
  - **Evidence**: `tailwind.config.js` 主题审查；`src/index.css` 无玻璃拟态/关键帧动画；5 个页面 class 审查。

- [x] CP-U2: 手机优先响应式质量（Rubric）
  - **Type**: `rubric`
  - **Covers**: AC-11, NFR-3
  - **Scale**: 1-5
  - **Anchors**: 1 = 375px 断链/溢出；3 = 可用但失衡；5 = 合理
  - **Pass Threshold**: >= 4
  - **Score**: 4
  - **Rationale**: PageContainer 统一 max-w-3xl + px-4；Hero mt-10 sm:mt-14 双层断点；MapPage 容器 `h-[72vh] sm:h-[68vh]`；AR 页外层 `aspect-ratio: 9/16`（手机屏）；Cesium 容器 `position:absolute inset:0` 全屏 + 预留底部/顶部工具条。桌面端首页特性卡 sm:grid-cols-3 利用空间，视域分析页 lg:grid-cols-2 两栏。未见固定 px 宽度导致的溢出。阈值 >= 4，通过。
  - **Evidence**: 各页面断点 class 审查（sm/lg）；布局宽度 Tailwind 类；Cesium 容器布局。

## Review History

### Review R1
- **Result**: `pass`
- **Evidence**: 以上 9 条 rule + 2 条 rubric 全部通过；`npm run build` exit 0；`npm run test` 19/19；dev server 5 路由 200；内部链接扫描通过。
- **Blocked By**: None
- **Advisory Findings**（非阻塞）：
  1. `@types/cesium` 是 stub 包（cesium 自带类型），未来可移除以减少依赖。
  2. Cesium 组件内部点击导航仅在浏览器/WebGL 可用时生效；测试中用 Stub 而非集成验证。
  3. AR 页徽章 verticalPct 的"越近越靠下"算法较为简单，可后续改为真实深度投影模型。
