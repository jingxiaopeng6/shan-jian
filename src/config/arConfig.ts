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
   * 第一版用 60°，后续可根据实机测试微调。
   */
  horizontalFOV: 60,

  /**
   * 最大显示距离（km）——超过此距离的山峰不在屏上渲染。
   * 武功山主峰之间最远约 15km，设 20km 足够。
   */
  maxDistanceKm: 20,

  /**
   * heading 平滑系数（lerp factor），(0, 1]
   * 越大越灵敏（跟随快但易抖动），越小越平稳。
   * 0.3 是体感比较好的起点，可在真机上调。
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
