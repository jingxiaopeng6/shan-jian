/**
 * AR 渲染可配置参数
 *
 * 所有参数集中在此文件，方便根据真实手机测试结果微调。
 * 后续 Stage 5（GIS）也会复用这些参数。
 */

export const AR_CONFIG = {
  /**
   * 摄像头水平视场角（FOV），单位：度。
   * 手机后置摄像头通常在 55–70° 之间。
   * iPhone 标准约 60°，Android 常见 65°。
   */
  horizontalFOV: 60,

  /**
   * **不按距离过滤山峰** —— 只要 bearing 合理就参与计算。
   * 视野范围由 FOV 自然裁剪（relativeBearingToScreenX 的 inFOV=false 会隐藏）。
   * 对于武功山这种山峰密集区域，距离过滤没有意义：
   * - 在武功山脚下：山峰间 1–5km 全在视野内
   * - 在 120km 外的长沙：bearing 也是精确的（纯几何，和距离无关）
   */
  // maxDistanceKm 已移除：改为只按 FOV 裁剪

  /**
   * heading 平滑系数（lerp factor），(0, 1]
   * 越大越灵敏（跟随快但易抖动），越小越平稳。
   */
  headingSmoothing: 0.3,

  /**
   * 距离平滑系数（同理，避免 GPS 抖动导致距离数字跳变）
   */
  distanceSmoothing: 0.5,

  /**
   * 屏幕 X 百分比平滑系数（让标签移动更丝滑）
   */
  screenXSmoothing: 0.4,

  /**
   * 精度阈值（米）——高于此值认为 GPS 精度较低
   */
  lowAccuracyThreshold: 100
} as const

export type ArConfig = typeof AR_CONFIG
