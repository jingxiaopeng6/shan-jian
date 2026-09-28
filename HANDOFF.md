# 《山见》项目转交文档

> 文档目的：将《山见》智慧文旅 Web MVP 项目的完整工作信息、阶段成果、当前状态交接给下一位开发者，确保任务无遗漏地继续推进。
> 项目路径：`D:\智慧文旅`
> 最后更新：2026-09-28
> 当前阶段：Stage 5.5 完成 + Bug 修复完成

---

## 一、项目概述

### 1.1 项目定位
《山见》是一款以**武功山**为示范场景的智慧文旅体验产品。

**核心理念**：「看见风景，也看懂风景。」

产品形态：移动端 Web App（手机浏览器访问），通过真实摄像头 + GPS + 方向传感器，在摄像头画面上叠加山峰 AR 标签（名称、海拔、距离），并能回答「为什么能看到这座山？」（GIS 视域分析）。

### 1.2 技术栈

| 类别 | 技术 |
|---|---|
| 框架 | React 18 + TypeScript 5 |
| 构建 | Vite 5 |
| 路由 | React Router 6 |
| 3D 地图 | CesiumJS |
| 样式 | Tailwind CSS 3 |
| 测试 | Vitest |
| GIS | geotiff.js（DEM 解析）、proj4（坐标转换） |
| 数据 | 全部 Mock（无后端） |

### 1.3 视觉风格
现代、克制、自然、文旅科技感。配色：深墨绿 `forest-700 #325043`、石色、暖沙。圆角 `rounded-xl`、柔阴影 `shadow-soft`。**不使用**玻璃拟态/渐变滥用/花哨动画。

---

## 二、已完成阶段总览

| 阶段 | 目标 | 状态 | Commit |
|---|---|---|---|
| Stage 0 | 项目脚手架初始化 | ✅ | `c5b50a9` |
| Stage 1 | Web MVP → 手机局域网访问 + 移动端响应式适配 | ✅ | `fedebdf` |
| Stage 2 | 手机真实后置摄像头 + 山峰标签叠加 | ✅ | `b9b6dca` `a5d93bc` |
| Stage 3 | 真实 GPS 定位 + 手机方向传感器 | ✅ | `36c746a` |
| Stage 4 | AR 山峰标签跟随 GPS + 手机方向移动 | ✅ | `65ac361` `ad42f53` |
| Stage 4.5 | 空间模拟测试模式（长沙也能测武功山） | ✅ | `82f0821` |
| Stage 5 | GIS 视域分析（Line of Sight）| ✅ | `0e764d1` |
| Stage 5.5 | 真实 DEM GeoTIFF 接入 | ✅ | `0f86c9a` ~ `2e1f9bb` |
| Bug 修复 | 7 个稳定性 Bug 修复 | ✅ | `45199bc` |

---

## 三、核心功能详解

### 3.1 页面路由（5 个页面）

| 路由 | 页面 | 功能 |
|---|---|---|
| `/` | HomePage | 品牌首页：「山见 · 看见风景，也看懂风景」+ 入口 |
| `/map` | MapPage | 武功山 Cesium 3D 地图，山峰标注，点击进详情 |
| `/ar` | ArPage | AR 看山：摄像头/取景器 + GPS + 方向 + 山峰标签 |
| `/peak/:id` | PeakDetailPage | 山峰详情 + 「为什么能看到？」按钮 |
| `/viewshed` | ViewshedPage | GIS 视域分析：地形剖面 + LOS + 遮挡判断 |

### 3.2 AR 体验链路（核心）

```
用户进入 /ar
  → 模拟取景器（SVG 山脉背景）
  → 点「打开摄像头」→ 真实摄像头画面（getUserMedia, facingMode: environment）
  → 点「📍 获取我的位置」→ Geolocation API（watchPosition）
  → 点「🧭 开启方向感知」→ DeviceOrientationEvent（iOS 需 requestPermission）
  → 摄像头画面上叠加山峰标签（名称/海拔/距离/方位）
  → 标签根据 GPS + heading 实时移动
  → 点山峰 → /peak/:id 详情
  → 点「为什么能看到？」→ /viewshed 视域分析
  → 离开页面 → 自动停止摄像头/GPS/方向监听
```

### 3.3 GIS 视域分析（Stage 5）

**算法：Line of Sight**
1. 获取 observer → target 之间的地形剖面（N=200 采样点）
2. 观察者眼睛高度 = DEM 地面高程 + 1.6m（人眼高度，只加一次）
3. 对每个采样点计算理论视线高度（线性插值）
4. `terrainElevation > lineOfSight + 0.5m` → 遮挡
5. 返回第一个遮挡点

**数据来源（可切换）**：
- `MockTerrainProvider`：模拟地形（含 createRidge/createPlateau 修饰器）
- `DEMTerrainProvider`：真实 GeoTIFF（武功山 DEM，EPSG:32649 UTM Zone 49N）

### 3.4 空间模拟测试模式（开发辅助）

由于开发者不在武功山，提供：
- **Mock Location**：武功山游客区域/山腰/金顶附近等预设点 + 自定义经纬度
- **Mock Orientation**：手动设置 heading ±15°、快速方向按钮、自动旋转测试
- **8 方位测试山峰**：围绕测试点 1km 分布 N/NE/E/SE/S/SW/W/NW 八座测试峰
- 真实摄像头 + 模拟位置/方向 的组合测试

---

## 四、关键文件说明

### 4.1 数据层

| 文件 | 说明 |
|---|---|
| `src/data/mock.ts` | 7 座武功山真实山峰（金顶/发云界/千丈岩/绝望坡/好汉坡/羊狮幕/白鹤峰）+ 用户位置 + 视域扇区数据 |
| `src/data/mockLocations.ts` | 4 个武功山测试点 + `generateTestPeaks()` 生成 8 方位测试山峰 |
| `src/data/mockTerrain.ts` | 3 个视域测试场景（A无遮挡/B有山脊遮挡/C换位置） |

### 4.2 GIS 层

| 文件 | 说明 |
|---|---|
| `src/gis/TerrainProvider.ts` | `TerrainProvider` 接口 + `MockTerrainProvider` + `createRidge/createPlateau` 修饰器 |
| `src/gis/DEMTerrainProvider.ts` | 真实 DEM GeoTIFF Provider：`load()` / `getElevation(lat,lng)` / `getProfile()` / `latLngBBox` |
| `src/gis/viewshedService.ts` | `analyzeLineOfSight()` LOS 核心算法 + `analyzeVisibility()` 批量分析 |

### 4.3 Hooks 层

| 文件 | 说明 |
|---|---|
| `src/hooks/useCamera.ts` | MediaDevices API 封装：6 态状态机、facingMode environment、OverconstrainedError 降级、卸载自动 stop |
| `src/hooks/useGeolocation.ts` | Geolocation API：watchPosition 持续监听、6 态状态机、高精度+低精度降级 |
| `src/hooks/useDeviceOrientation.ts` | DeviceOrientationEvent：iOS 13+ requestPermission、alpha→heading 归一化（0-360°）、抖动过滤 |
| `src/hooks/useLocationProvider.ts` | LocationProvider 抽象：Real ↔ Mock 统一输出 latLng |
| `src/hooks/useOrientationProvider.ts` | OrientationProvider 抽象：Real ↔ Mock，含 adjustMockHeading/autoRotate |
| `src/hooks/useArPeakOverlay.ts` | GPS+heading+peaks → 每座山峰 bearing/distance/relativeDeg/screenXPercent/inFOV，含平滑 |
| `src/hooks/useIsMobile.ts` | UA + 触摸 + 屏幕宽度综合判断移动端 |
| `src/hooks/useLanIp.ts` | WebRTC 获取局域网 IP（3s 超时兜底） |

### 4.4 工具层

| 文件 | 说明 |
|---|---|
| `src/utils/geoUtils.ts` | Haversine 距离、测地方位角 bearing、角度归一化、相对方位、FOV→屏幕百分比、lerp 平滑 |
| `src/config/arConfig.ts` | horizontalFOV=60°、三个平滑系数、最大显示距离 20km |

### 4.5 组件层

| 文件 | 说明 |
|---|---|
| `src/components/CameraView.tsx` | `<video>` 全屏渲染 + 状态面板 |
| `src/components/ArPeakBadge.tsx` | 山峰徽章（名称/海拔/距离），overlay 模式下 inFOV=false 自动隐藏 |
| `src/components/CesiumMap.tsx` | Cesium Viewer + 山峰 Point+Label + 当前位置 |
| `src/components/SpatialTestPanel.tsx` | DEV 空间模拟测试面板 |
| `src/components/DevHint.tsx` | 开发环境右下角地址提示 + 二维码 |
| `src/components/ViewshedProfileView.tsx` | 地形剖面图（SVG） |
| `src/components/ViewshedPlanView.tsx` | 俯视扇区图（SVG） |
| `src/components/AppLayout.tsx` | 通用布局壳（含 DevHint） |

### 4.6 页面层

| 文件 | 说明 |
|---|---|
| `src/pages/ArPage.tsx` | AR 看山页：集成摄像头/GPS/方向/overlay/测试面板 |
| `src/pages/ViewshedPage.tsx` | 视域分析页：DEM/mock 切换 + 剖面图 + Debug |
| `src/pages/PeakDetailPage.tsx` | 山峰详情页 |
| `src/pages/MapPage.tsx` | 3D 地图页 |
| `src/pages/HomePage.tsx` | 首页 |

### 4.7 静态资源

| 文件 | 说明 |
|---|---|
| `public/dem-wugongshan.tif` | 武功山 DEM GeoTIFF（~5MB，EPSG:32649 UTM Zone 49N，30m 分辨率） |
| `.certs/cert.pem` `key.pem` | 自签名 HTTPS 证书（gitignore，本地生成） |
| `scripts/gen-certs.mjs` | 自签名证书生成脚本 |

---

## 五、开发环境配置

### 5.1 启动命令

```bash
cd d:\智慧文旅
npm run dev          # 开发服务器（自动 HTTPS，因为 .certs/ 存在）
npm run build        # 生产构建
npm run test         # Vitest 单元测试（20 用例）
npm run preview      # 预览生产构建
```

### 5.2 HTTPS 说明
- `vite.config.ts` 自动检测 `.certs/` 目录：有证书 → HTTPS，无 → HTTP
- 摄像头/GPS/方向传感器 API **必须** HTTPS（或 localhost）
- 手机访问：`https://局域网IP:端口`（如 `https://10.253.13.225:5173`）
- 自签名证书需手动信任（手机浏览器点「高级 → 继续访问」）
- 证书生成：`node scripts/gen-certs.mjs`（修改脚本里的 LAN_IP）

### 5.3 环境变量
- `.env.development`：`VITE_LAN_IP=你的局域网IP`（覆盖 WebRTC 检测）

---

## 六、已知问题与注意事项

### 6.1 已修复的 Bug（commit `45199bc`）
1. **人眼高度双重叠加**：`analyzeLineOfSight` 不再重复加 1.6m
2. **adjustMockHeading 不切换 mock 模式**：±15° 按钮现在自动切到 mock
3. **方向传感器监听器累积**：`start()` 前先 `removeEventListener`
4. **GPS 微小变化清空平滑缓存**：仅 >100m 变化才清缓存
5. **playsInline 仅 iOS**：改为始终启用
6. **DEM bbox 显示 UTM 坐标**：新增 `latLngBBox` 转 WGS84
7. **mock 模式 stop 不清状态**：mock stop 清除所有 mock 状态

### 6.2 DEM 相关坑点
- **坐标系**：DEM 是 `EPSG:32649 (UTM Zone 49N)`，不是 WGS84。`getElevation()` 内部用 proj4 做 `WGS84 → UTM49N` 转换
- **文件名**：必须用纯 ASCII（`dem-wugongshan.tif`），中文文件名在手机 fetch 会 URL 编码失败
- **加载方式**：用 `fetch(url).arrayBuffer() → GeoTIFF.fromArrayBuffer()`，**不要**用 `geotiff.fromUrl()`（会发多个 Range 请求，手机 Chrome 报 `ERR_INSUFFICIENT_RESOURCES`）
- **缓存**：raster 数据存在 `Float32Array`，`getElevation()` 是 O(1) 内存查询

### 6.3 iOS 注意事项
- 方向传感器需要 `DeviceOrientationEvent.requestPermission()`（用户点击触发）
- 摄像头需要 `playsInline` + `muted` + `autoPlay`
- 自签名证书需在 Safari 点「显示详细信息 → 访问此网站」

### 6.4 Stage 4 距离过滤已移除
- 之前 `maxDistanceKm=20` 导致长沙用户看不到任何武功山山峰
- 现在不按距离过滤，只按 FOV 视野范围（±30°）裁剪

---

## 七、测试覆盖

**20 个 Vitest 用例全部通过**（`src/__tests__/`）：
- mock-data 测试：5
- routing 测试：5
- nav 测试：4
- ar-page 测试：1
- peak-detail 测试：2
- viewshed 测试：3

---

## 八、当前状态与下一步

### 8.1 当前状态
- 构建：0 错误
- 测试：20/20 通过
- 功能：Stage 1-5.5 全部完成 + Bug 修复
- 项目可正常 `npm run dev` 运行

### 8.2 下一步可做的方向（按优先级）

**P0 — 性能优化**
- DEM 加载性能：考虑 Web Worker 解析 GeoTIFF
- Cesium 地图移动端渲染优化（降低地形精度）
- geotiff.js chunk 已代码分割（315KB gzip 114KB），按需加载

**P1 — 功能完善**
- Stage 6：批量山峰可见性分析（`analyzeVisibility` 接口已就绪）
- 最佳观景点推荐
- 更多山峰数据（目前只有 7 座）
- AR 标签的垂直位置计算（目前只有水平 X，没有垂直 Y，标签固定在屏幕中部）

**P2 — 体验优化**
- AR 页面 UI 打磨（标签布局、动画、手感）
- 视域分析页面可读性
- GPS 精度提示优化
- 离线缓存（PWA Service Worker）

**P3 — 部署**
- HTTPS 生产环境部署（云服务器 + 域名 + 正式证书）
- Cesium Ion token 配置（目前用默认 token，生产需替换）

### 8.3 明确不做的（Stage 2-5 规范里禁止的）
- ❌ 真实 AR 锚定（ARCore/ARKit/WebXR）
- ❌ 后端数据库/用户系统
- ❌ NFC
- ❌ AI 山峰识别
- ❌ 全区域大规模实时 Viewshed
- ❌ 云服务器部署（当前仅本地开发）

---

## 九、联系人与资料

- 项目根目录：`D:\智慧文旅`
- 规格文档：`.trae/specs/shan-jian-mvp/`（spec.md / tasks.md / review.md）
- 开发规范：`AGENTS.md`（每次改动必须 commit + 测试通过）
- Git 仓库：本地（无远程）
