# 《山见》智慧文旅 Web MVP - 实施计划

## Task 1: 脚手架初始化（Vite + React + TS + Tailwind + 依赖）
- **Status**: `pending`
- **Priority**: high
- **Depends On**: None
- **Description**:
  - 使用 `npm create vite@latest . -- --template react-ts` 在 `d:\智慧文旅` 创建项目（注意已有 AGENTS.md，选择 merge 方式）
  - 安装依赖：`react-router-dom@6`, `cesium`, `vite-plugin-cesium`, `@types/cesium`, `tailwindcss@3`, `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
  - 配置 Tailwind（`tailwind.config.js` 扩展颜色为文旅主题：深墨绿/石色/暖沙）、PostCSS、Vite（加入 vite-plugin-cesium、测试配置、TS strict + jsdom）
  - 更新 `index.html` meta viewport 与标题「山见 · 智慧文旅」
- **Acceptance Criteria Addressed**: AC-8, AC-10, AC-11
- **Test Requirements**:
  - `rule` TR-1.1: 运行 `node -e "require('./node_modules/vite/package.json')"` 与 `node -e "require('./node_modules/react-router-dom/package.json')"` 与 `node -e "require('./node_modules/cesium/package.json')"` 均不抛错；Evidence: 命令无错误输出
  - `rule` TR-1.2: `npx tsc --noEmit -p tsconfig.app.json` 退出码为 0（空项目检查）；Evidence: tsc 输出日志
  - `rubric` TR-1.3: Tailwind 主题质量；scale 1-5；1=无主题/默认 palette；3=有扩展但不统一；5=一致的文旅自然配色；threshold >= 4；Evidence: 审查 tailwind.config.js 内容
- **Notes**: 此任务完成后需执行一次 commit（按 AGENTS.md 要求）。

## Task 2: 项目目录结构与 Mock 数据层
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 1
- **Description**:
  - 建立 `src/components/`, `src/pages/`, `src/data/`, `src/types/`, `src/hooks/`, `src/__tests__/` 目录
  - 在 `src/types/index.ts` 定义类型：`Peak { id, name, pinyin, lat, lng, elevation, description, bestViewTime, imageUrl, relatedIds }`；`UserPosition { lat, lng, elevation, name, headingDeg }`；`VisiblePeak { peakId, distanceKm, azimuthDeg, visible }`；`ViewshedSector { azimuthStartDeg, azimuthEndDeg, distanceM, blockedBy? }`
  - 在 `src/data/mock.ts` 导出武功山 >= 6 座山峰（金顶、发云界、千丈岩、绝望坡、好汉坡、羊狮幕、白鹤峰）的真实近似经纬度海拔与合理虚构描述；导出 2 个用户模拟位置（金顶观景台 / 发云界游客中心）；导出当前位置可见山峰关系、视域扇区数据
  - 导出工具函数：`getVisiblePeaks(userPosition)`、`getPeakById(id)`、`peaks`、`userPositions`
- **Acceptance Criteria Addressed**: FR-7, AC-3, AC-4, AC-5, AC-6
- **Test Requirements**:
  - `rule` TR-2.1: `peaks.length >= 6` 且所有山峰含必填字段（id/name/lat/lng/elevation），`userPositions.length >= 2`；Evidence: vitest 断言通过
  - `rule` TR-2.2: `getVisiblePeaks` 返回数组 `length >= 3` 且每项 `distanceKm > 0`、`azimuthDeg` 在 [0, 360)；Evidence: vitest 断言
  - `rule` TR-2.3: 所有 TS 类型定义无隐式 any，`tsc --noEmit` 通过；Evidence: 任务 8 统一验证
- **Notes**: 完成后 commit。

## Task 3: 路由骨架与 5 个页面占位 + 布局壳
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 2
- **Description**:
  - `src/App.tsx` 使用 `createBrowserRouter`/`RouterProvider`，路由表：`/`（首页）→ `pages/HomePage.tsx`；`/map` → `pages/MapPage.tsx`；`/ar` → `pages/ArPage.tsx`；`/peak/:id` → `pages/PeakDetailPage.tsx`；`/viewshed` → `pages/ViewshedPage.tsx`；404 → Home 重定向
  - 建通用组件 `components/AppHeader.tsx`（标题 + 返回按钮，根据路由显隐）、`components/AppFooter.tsx`（版权/品牌信息，不做 TabBar 以符合克制风格）、`components/PageContainer.tsx`（安全区、最大宽度、padding）
  - 每个页面先渲染占位内容（标题 + 一段说明 + 关键跳转按钮），保证路由互通无死链
- **Acceptance Criteria Addressed**: FR-6, AC-1, AC-2, AC-5, AC-7
- **Test Requirements**:
  - `rule` TR-3.1: vitest 访问 `/`、`/map`、`/ar`、`/peak/jinding`、`/viewshed` 均不渲染 404 内容且包含各自页面标题；Evidence: 测试输出
  - `rule` TR-3.2: 首页 CTA 点击后跳转到 `/map`；详情页「为什么能看到」按钮跳转到 `/viewshed`；Evidence: vitest `fireEvent.click` + 路由状态断言
  - `rule` TR-3.3: 代码中所有内部 `<a>`/`Link` 的 `to`/`href` 均以 `/` 开头且不在白名单外指向外部；Evidence: Grep 扫描结果

## Task 4: 首页 HomePage 视觉完善
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 3
- **Description**:
  - 首页 Hero 区：「山见」大字标题 + 副标题「看见风景，也看懂风景」+ 背景（CSS 渐变/图案 + 自然色底，不使用花哨图片）
  - 「进入武功山」主 CTA 按钮（深色实底 + 白色文字，圆角克制）
  - 三个特性小卡片（可选）：3D 地图、AR 识山、视域分析——简洁图标（SVG/内联）+ 两字标题 + 一句话说明
  - 底部次要信息：以武功山为示范场景 · MVP 演示版
- **Acceptance Criteria Addressed**: FR-1, AC-2, AC-10, AC-11
- **Test Requirements**:
  - `rule` TR-4.1: 页面包含主 CTA 且可点击跳转（与 TR-3.2 合并验证）
  - `rubric` TR-4.2: 视觉契合度；scale 1-5；threshold >= 4；Evidence: 审查 home 相关 class 使用、截图

## Task 5: 地图页 MapPage - CesiumJS 3D 地形 + 山峰标注
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - `components/CesiumMap.tsx`：在 `useEffect` 中使用 `new Cesium.Viewer(container, opts)` 初始化；`terrainProvider` 用 `EllipsoidTerrainProvider`（避免依赖真实地形瓦片）并设置合理的 `camera.flyTo` 定位到武功山（约 27.48°N, 114.17°E）
  - 遍历 `peaks` 创建 `viewer.entities.add` 的 `Point` + `Label` 标注（Label 用 `name` + `elevation`）
  - 标注当前用户位置（默认 `userPositions[0]`）：不同颜色的 Point + "当前位置" Label
  - 提供简单浮动工具栏：「切换到 AR 看山」按钮（跳 /ar）、「查看视域分析」按钮（跳 /viewshed）；山峰 Label 可点击跳 `/peak/:id`
  - 注意移动端 Cesium 容器全屏并预留底部/顶部 UI 空间避免遮挡（按经验 184716 的优化）
- **Acceptance Criteria Addressed**: FR-2, AC-3, AC-11
- **Test Requirements**:
  - `rule` TR-5.1: 组件初始化后容器 DOM 存在 cesium 画布；`viewer != null`（通过 ref 暴露后在测试中用 mock Cesium 验证调用参数；实际运行时日志确认 viewer created）
  - `rule` TR-5.2: entities 中 label 数量 >= peaks.length + 1（山峰+当前位置）；Evidence: vitest 对 mock Cesium 调用断言
  - `rubric` TR-5.3: 地图页响应式质量；scale 1-5；threshold >= 4；Evidence: 375px/1440px 下容器尺寸审查

## Task 6: AR 看山页 ArPage - 模拟摄像界面 + 山峰信息锚点
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - 模拟取景器：外层固定长宽比（手机屏），内层用 CSS 背景模拟摄像头画面（低饱和山景渐变 + 轻微噪点或线条，避免真实图片依赖）
  - 顶部状态栏：「AR 看山」标题 + 返回；底部取景器提示条
  - 中央十字准星（细线、克制）
  - 根据 `getVisiblePeaks()` 返回的数据渲染 `components/ArPeakBadge.tsx`：定位用 %（基于 azimuthDeg → left% 的近似映射），显示山峰名称、海拔 `${m}m`、距离 `${km}km`
  - 提供 2-3 个「视角切换」迷你按钮（正东/南/西），切换后重新过滤并渲染可见山峰（模拟手机转向的体验）
  - 点击徽章跳转 `/peak/:id`
- **Acceptance Criteria Addressed**: FR-3, AC-4, AC-5, AC-10, AC-11
- **Test Requirements**:
  - `rule` TR-6.1: 渲染 ArPeakBadge 数量 >= 3；每个 Badge 展示名称、海拔、距离三字段；Evidence: vitest 断言
  - `rule` TR-6.2: 点击 Badge 调用 `navigate('/peak/:id')`；Evidence: vitest mock 导航断言
  - `rubric` TR-6.3: 模拟取景界面克制度；scale 1-5；threshold >= 4；Evidence: 审查 class 无玻璃拟态/渐变滥用

## Task 7: 山峰详情页 PeakDetailPage
- **Status**: `pending`
- **Priority**: medium
- **Depends On**: Task 3
- **Description**:
  - 用 `useParams()` 取 id，调用 `getPeakById` 渲染
  - 顶部大图占位：用 SVG 绘制山峰剪影 + 配色填充（避免图片资源）
  - 信息区：名称、海拔、简介段落、推荐观赏时段（"最佳观赏：日出 05:30-06:30 · 日落 18:30-19:30" 风格）
  - 关联山峰卡片：根据 peak.relatedIds 渲染缩略卡，点击跳转
  - 底部主按钮：「为什么能看到？」→ 跳转 `/viewshed`，次按钮：「返回 AR 看山」→ `/ar`
- **Acceptance Criteria Addressed**: FR-4, AC-5
- **Test Requirements**:
  - `rule` TR-7.1: 路由参数传入有效 id 时渲染正确名称与海拔；传入无效 id 时展示"山峰未找到"提示并提供返回首页链接；Evidence: vitest
  - `rule` TR-7.2: 点击「为什么能看到？」跳转到 `/viewshed`；Evidence: vitest fireEvent 断言

## Task 8: 视域分析页 ViewshedPage
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 3
- **Description**:
  - 顶部：当前位置名称 + "视域分析结果"标题
  - 两个可视化区块：
    1) `components/ViewshedPlanView.tsx`（俯视示意图，SVG）：中心=当前位置，按 `ViewshedSector` 绘制不同颜色扇区，标注可见/遮挡；峰位置按方位+距离绘点并标名
    2) `components/ViewshedProfileView.tsx`（剖面图，SVG）：横轴=距离，纵轴=海拔，绘制地形折线 + 视线射线（可视=实线，遮挡=虚线+交点）
  - 下方清单：「当前位置还能看到这些山峰」→ 卡片列表：峰名、海拔、距离、方位
- **Acceptance Criteria Addressed**: FR-5, AC-6
- **Test Requirements**:
  - `rule` TR-8.1: 清单渲染条目数 >= 5；条目含名称/海拔/距离；Evidence: vitest
  - `rule` TR-8.2: 两个 SVG 可视化组件实际渲染（存在 `<svg>` DOM，内部含 `>= 3` 条几何元素）；Evidence: vitest 容器查询

## Task 9: Vitest 单元测试补齐
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 4,5,6,7,8
- **Description**:
  - `__tests__/mock-data.test.ts`：TR-2.1, TR-2.2 断言
  - `__tests__/routing.test.tsx`：TR-3.1, TR-3.2 路由跳转（用 MemoryRouter）
  - `__tests__/ar-page.test.tsx`：TR-6.1 Badge 数量与内容
  - `__tests__/peak-detail.test.tsx`：TR-7.1 无效 id 提示
  - `__tests__/viewshed.test.tsx`：TR-8.1, TR-8.2 条目与 SVG 存在性
  - 配置 `vitest.config.ts` 使用 `jsdom` 环境、`setup.ts` 引入 `@testing-library/jest-dom`
- **Acceptance Criteria Addressed**: AC-9, NFR-6
- **Test Requirements**:
  - `rule` TR-9.1: `npm run test` 执行完毕 exit code = 0，无 failed；Evidence: 命令输出
  - `rule` TR-9.2: 至少 12 个用例通过；Evidence: 统计 `Tests passed` 数

## Task 10: 构建验证与最终可运行性确认
- **Status**: `pending`
- **Priority**: high
- **Depends On**: Task 9
- **Description**:
  - 执行 `npm run build`，修复任何 TS / Vite 错误
  - 必要时修正 Cesium 静态资源路径（`vite-plugin-cesium` 默认已处理；若失效则配置 public 目录拷贝）
  - 清理未使用的模板文件（Vite 默认 assets/react.svg、App.css 中默认样式等）
  - 本地启动开发服务器确认首页不白屏（可选：`npm run dev` 后台启动并 curl 根路径得 200）
- **Acceptance Criteria Addressed**: AC-8, NFR-5
- **Test Requirements**:
  - `rule` TR-10.1: `npm run build` exit code 0，无 TS error；Evidence: 输出日志
  - `rule` TR-10.2: `dist/index.html` 存在且引用 `/assets/index-*.js` 资源；Evidence: dir 列表 + 文件内容 grep
