# 《山见》智慧文旅 Web MVP - 产品需求文档

## Overview
- **Summary**: 以武功山为示范场景的智慧文旅体验产品，核心体验为「看见风景，也看懂风景」。MVP 以纯前端 + Mock 数据方式演示 5 个核心页面和完整用户交互链路。
- **Purpose**: 展示智慧文旅在"3D 地图 + AR 看山 + GIS 视域分析"三大方向的产品形态与体验价值，不追求真实数据与商业闭环。
- **Target Users**: 文旅产品投资人、景区运营方、产品演示场景下的体验者。

## Goals
- 完整跑通「首页 → 武功山 3D 地图 → AR 看山 → 山峰详情 → 视域分析」的核心用户流程
- 通过 CesiumJS 呈现武功山 3D 地形与山峰标注
- 模拟手机摄像头 AR 界面，根据视线方向叠加山峰信息（名称 / 海拔 / 距离）
- 以可视化方式呈现"为什么能看到"的 GIS 视域分析结果
- UI 风格现代、克制、自然、具有文旅科技感，避免传统旅游 App 审美
- 响应式布局，优先手机屏幕体验

## Non-Goals
- 不接真实 GPS / 北斗定位
- 不调用真实手机摄像头（采用静态模拟画面）
- 不实现后端、云服务、数据库
- 不实现真实 GIS 视域分析算法（以 Mock 可视化结果替代）
- 不做用户账号系统、支付、评价等商业功能
- 不做 NFC、扫描、分享、推送等扩展能力

## Background & Context
- 当前仓库仅含 AGENTS.md 与已初始化的 Git 仓库（根目录 `d:\智慧文旅`）
- 已确认 Node.js v24.16.0 与 npm 11.13.0 在当前 Windows 环境可用
- Git 安装在 `D:\某物\Git\bin\git.exe`，提交需使用完整路径或环境变量
- AGENTS.md 要求：每次改动对应一次 commit；交付前通过全部测试与验证

## Functional Requirements
- **FR-1 首页**: 展示《山见》品牌与核心价值主张，提供「进入武功山」主 CTA，可选择进入 3D 地图页
- **FR-2 武功山地图页**: 使用 CesiumJS 渲染武功山区域 3D 地形，标注当前用户模拟位置（如金顶或发云界游客中心）与周边主要山峰；可点击山峰或"AR看山"按钮跳转
- **FR-3 AR 看山页**: 模拟手机摄像头取景界面（静态背景画面），根据当前模拟视线方向，在画面中用浮窗/锚点叠加可见山峰的名称、海拔、距离；可点击山峰名称进入详情页
- **FR-4 山峰详情页**: 展示山峰名称、海拔、简介、推荐观赏时段、相关山峰关联；提供「为什么能看到？」入口
- **FR-5 视域分析页**: 展示 GIS 视域分析的可视化结果（俯视示意图 + 剖面图），列出"当前位置还能看到哪些山峰"的清单
- **FR-6 路由与导航**: 5 个页面通过 React Router 可互相跳转，返回按钮可用，页面无死链
- **FR-7 数据层**: 所有山峰（名称、经纬度、海拔、简介、图、距离关系）、用户模拟位置、AR 可见关系、视域分析结果等集中在 `src/data/mock.ts`，各组件只读不写

## Non-Functional Requirements
- **NFR-1 技术栈**: React 18 + TypeScript 5 + Vite 5 + React Router 6 + CesiumJS + Tailwind CSS 3；所有代码通过 TS 严格模式
- **NFR-2 组件化**: 页面拆分为可复用组件（`components/`），页面层（`pages/`）只做组合与路由绑定
- **NFR-3 响应式**: 以 375px 移动端为主断点，所有页面在 375–1440px 宽度下无横向滚动、关键按钮不被遮挡；Cesium 地图页在手机端全屏化
- **NFR-4 视觉风格**: 克制配色（自然色系，深墨绿 / 石色 / 暖沙为主），避免大量渐变、玻璃拟态、花哨动画；字重、间距统一；字体层级清晰
- **NFR-5 可运行性**: `npm install` 与 `npm run dev` 能直接启动；`npm run build` 零错误；构建产物无未引用资源警告
- **NFR-6 测试**: 至少为 Mock 数据、路由跳转、关键 UI 组件编写 Vitest 单元测试；`npm run test` 全部通过

## Constraints
- **Technical**: 必须使用 CesiumJS（不能用 Three/MapLibre 替代 3D 地图）；不引入后端或 SSR（纯 Vite 客户端）
- **Business**: 不包含真实品牌、景区官方素材；山峰信息采用公开数据或合理虚构
- **Dependencies**: 依赖 `react@18`, `react-dom@18`, `react-router-dom@6`, `cesium`, `vite-plugin-cesium` 或等价构建插件, `tailwindcss@3`, `postcss`, `autoprefixer`, `vitest`, `@testing-library/react`, `@types/cesium`

## Assumptions
- 用户在现代手机/桌面 Chrome / Edge 浏览器中访问（Cesium 需要 WebGL）
- 允许 `npm install` 从公网拉取依赖（环境有外网访问）
- 武功山山峰数量取 6–10 座即可（金顶、发云界、千丈岩、绝望坡、好汉坡、羊狮幕等）

## Acceptance Criteria

### AC-1: 5 个核心页面可路由访问
- **Type**: `rule`
- **Given**: 开发服务器已启动
- **When**: 访问 `/`、`/map`、`/ar`、`/peak/:id`、`/viewshed` 路由
- **Then**: 每个路由均渲染对应页面，无 404 / 白屏 / 控制台未捕获异常
- **Pass Condition**: 每个 URL 都能访问到正确的页面组件；`npm run build` 不产生路由相关错误
- **Evidence**: `npm run build` 输出；以及 Vite 启动后手动访问各路由的页面快照 / 命令行日志

### AC-2: 首页提供「进入武功山」主入口
- **Type**: `rule`
- **Given**: 用户在 `/`
- **When**: 点击主 CTA 按钮
- **Then**: 成功跳转到 `/map`（武功山地图页）
- **Pass Condition**: 点击 CTA 后 URL 变为 `/map` 并渲染地图页
- **Evidence**: 集成测试或 `vitest` 对首页组件的点击跳转断言

### AC-3: 地图页使用 CesiumJS 渲染 3D 地形与山峰标注
- **Type**: `rule`
- **Given**: 用户在 `/map`
- **When**: 页面挂载完成
- **Then**: Cesium Viewer 实例成功创建；至少渲染 5 座武功山山峰的 Label/Point 标注与 1 个当前用户位置图标
- **Pass Condition**: Cesium viewer 不为 null；mock 山峰数组长度 >= 5；DOM 中存在 cesium 容器且 viewer.entities.values 中包含山峰标注
- **Evidence**: 组件生命周期日志 / 挂载后 viewer 存在性测试快照 / 构建输出无 Cesium 相关错误

### AC-4: AR 页展示山峰名称、海拔、距离
- **Type**: `rule`
- **Given**: 用户在 `/ar`
- **When**: 页面加载完成
- **Then**: 画面中叠加 >= 3 个山峰信息锚点，每个锚点至少包含名称、海拔（米）、距离（公里）三项数据，且全部来自 mock 数据
- **Pass Condition**: UI 中能找到 >= 3 个山峰卡片；数据结构符合 `VisiblePeak` 类型定义
- **Evidence**: AR 页面单元测试断言可见山峰数量 / 页面渲染快照

### AC-5: 山峰详情页可从 AR 页锚点进入并展示完整信息
- **Type**: `rule`
- **Given**: 用户在 `/ar`，点击任一山峰锚点
- **When**: 跳转至 `/peak/:id`
- **Then**: 页面渲染与 id 对应的山峰：名称、海拔、简介、推荐观赏时段、「为什么能看到？」按钮
- **Pass Condition**: URL 参数匹配到正确山峰；页面中存在上述信息；点击「为什么能看到？」跳转到 `/viewshed`
- **Evidence**: 路由 + 参数集成测试；从详情页到视域分析页的跳转断言

### AC-6: 视域分析页展示可视化结果与可见山峰清单
- **Type**: `rule`
- **Given**: 用户在 `/viewshed`
- **When**: 页面加载
- **Then**: 页面呈现两类内容：1) 俯视视域示意图（SVG 或 Canvas Mock） 2) 当前位置可见山峰清单（>= 5 项，含名称与距离）
- **Pass Condition**: 清单项目数 >= 5；示意图元素在 DOM 中可找到
- **Evidence**: 单元测试断言清单条目；DOM 查询示意图元素存在

### AC-7: 页面返回与跨页导航无死链
- **Type**: `rule`
- **Given**: 任意页面
- **When**: 点击返回按钮或页面中所有内部链接
- **Then**: 不会停留在空白页 / 404 / 崩溃；任何内部 `<a>` 指向的是项目内合法路由
- **Pass Condition**: 所有链接 href 匹配 `/`、`/map`、`/ar`、`/peak/:id`、`/viewshed` 之一；不存在指向外部不存在域名的链接
- **Evidence**: 代码 grep 静态扫描 + `vitest` 中对导航组件的链接断言

### AC-8: TS 严格模式零错误，构建通过
- **Type**: `rule`
- **Given**: 项目依赖已安装
- **When**: 执行 `npm run build`
- **Then**: 退出码为 0；无 TS 错误；无 Vite 构建致命告警
- **Pass Condition**: exit code = 0 且 stderr 无 `TS\d+` 错误信息
- **Evidence**: `npm run build` 完整命令输出

### AC-9: 单元测试全部通过
- **Type**: `rule`
- **Given**: 项目依赖已安装
- **When**: 执行 `npm run test`
- **Then**: 全部测试用例通过（零失败）
- **Pass Condition**: Vitest 输出 `Tests passed: N of N` 且无失败套件
- **Evidence**: `npm run test` 完整输出

### AC-10: 视觉风格克制、具有文旅科技感（Rubric）
- **Type**: `rubric`
- **Dimension**: 整体视觉风格契合度
- **Scale**: 1-5
- **Anchors**: 1 = 传统旅游 App（高饱和渐变 / 玻璃拟态 / 花哨动画 / 大量堆叠卡片）；3 = 中性但元素杂乱（字体层级不清、间距不一致）；5 = 现代克制（自然深墨绿/石色/暖沙配色、清晰层级、留白、无多余装饰、有科技感而不廉价）
- **Pass Threshold**: >= 4
- **Evidence**: 5 个页面的视觉截图（或 DOM 关键样式 class 的审查） + Tailwind 全局主题配置审查

### AC-11: 手机优先的响应式体验（Rubric）
- **Type**: `rubric`
- **Dimension**: 375px–1440px 跨断点适配质量
- **Scale**: 1-5
- **Anchors**: 1 = 375px 下出现横向滚动 / 主要 CTA 出屏；3 = 手机可用但按钮过小 / 间距失衡；5 = 手机端布局合理、所有关键元素完整可见，桌面端利用空间不空洞
- **Pass Threshold**: >= 4
- **Evidence**: 375px / 768px / 1440px 三个断点下的页面截图或容器尺寸断言

## Open Questions
- [ ] 山峰信息需要与真实武功山数据完全一致吗？当前假设为公开数据即可，必要时合理虚构。
- [ ] AR 页面是否需要模拟"旋转手机改变视线方向"的交互？当前假设为：提供 2-3 个预设方向切换按钮即可，不接入陀螺仪。
