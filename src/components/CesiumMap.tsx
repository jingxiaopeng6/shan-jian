import { useEffect, useRef, useState } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { peaks, defaultUserPosition } from '../data/mock'
import { attractions } from '../data/attractions'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'
import { DEMTerrainProvider } from '../gis/DEMTerrainProvider'
import { GeoTiffTerrainProvider } from '../gis/GeoTiffTerrainProvider'

interface CesiumMapProps {
  /** 用户 GPS 位置（WGS84），为 null 时使用默认位置 */
  userPosition?: { lat: number; lng: number } | null
  /** 路线起点和终点，为 null 时不显示路线 */
  route?: { from: { lat: number; lng: number }; to: { lat: number; lng: number } } | null
  /** 点击山峰时的回调（未提供时默认跳转 /peak/:id） */
  onPeakSelect?: (peakId: string) => void
  /** GPS 轨迹点数组，为空或不传则不显示轨迹 */
  trackPoints?: { lat: number; lng: number }[]
}

/**
 * Cesium 3D 地图组件
 * - GeoTiffTerrainProvider：基于真实 DEM (ASTER GDEM 30m) 渲染武功山三维地形
 * - 武功山中心相机定位，山峰 + 景点 + 当前位置标注
 * - 山峰标注可点击进入详情页
 * - 支持基础路线绘制（MVP 示意直线）
 * - 移动端优化：降低渲染精度、支持触摸手势、减小标注尺寸
 */
export default function CesiumMap({ userPosition, route, onPeakSelect, trackPoints }: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const userEntityRef = useRef<Cesium.Entity | null>(null)
  const routeEntityRef = useRef<Cesium.Entity | null>(null)
  const trackEntityRef = useRef<Cesium.Entity | null>(null)
  const navigate = useNavigate()
  const isMobile = useIsMobile()
  const [terrainReady, setTerrainReady] = useState(false)

  // 初始化地图
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return

    const viewer = new Cesium.Viewer(containerRef.current, {
      animation: false,
      timeline: false,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      fullscreenButton: false,
      infoBox: false,
      selectionIndicator: false,
      creditContainer: undefined,
      shouldAnimate: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider()
    })
    viewerRef.current = viewer

    // 加载真实 DEM 地形
    const demProvider = new DEMTerrainProvider('/dem-wugongshan.tif')
    const geoTiffTerrain = new GeoTiffTerrainProvider(demProvider)
    geoTiffTerrain.readyPromise.then(() => {
      viewer.terrainProvider = geoTiffTerrain
      setTerrainReady(true)
      viewer.scene.globe.depthTestAgainstTerrain = true
    }).catch(() => {
      // DEM 加载失败时保持椭球体地形
    })
    ;(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'

    // 移动端渲染优化
    if (isMobile) {
      viewer.resolutionScale = 0.8
      viewer.scene.globe.enableLighting = false
      if (viewer.scene.skyAtmosphere) viewer.scene.skyAtmosphere.show = false
      viewer.scene.maximumRenderTimeChange = Infinity
      viewer.scene.screenSpaceCameraController.enableRotate = true
      viewer.scene.screenSpaceCameraController.enableTranslate = true
      viewer.scene.screenSpaceCameraController.enableZoom = true
      viewer.scene.screenSpaceCameraController.enableTilt = true
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 80000
    }

    // 初始相机定位：武功山金顶（中心点对准主峰）
    // 相机位于金顶东南方向约 2km，25000m 高空，俯视整个山脊
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.185, 27.465, 25000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0
      },
      duration: 0.01
    })

    // 标注尺寸配置 —— 跨平台字体 + 更大字号 + 更粗字重
    // PingFang SC 仅 macOS 有；Noto Sans SC 项目已配，Windows 上有 Microsoft YaHei 回退
    const LABEL_FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", "PingFang SC", sans-serif'
    const labelPixelOffset = isMobile ? -18 : -20
    const pointSize = isMobile ? 9 : 11
    const peakLabelFont = isMobile
      ? `700 13px ${LABEL_FONT_FAMILY}`
      : `700 15px ${LABEL_FONT_FAMILY}`
    const attrLabelFont = isMobile
      ? `600 12px ${LABEL_FONT_FAMILY}`
      : `600 13px ${LABEL_FONT_FAMILY}`
    // 标签背景：奶酪半透明，确保任何底色上都清晰
    const labelBgColor = new Cesium.Color(0.965, 0.945, 0.910, 0.88)  // #F4F1E8 奶酪
    const labelBgPadding = new Cesium.Cartesian2(8, 6)
    // 描边色：深森林，比白色在浅色地形上更稳
    const labelOutlineColor = Cesium.Color.fromCssColorString('#1F2818')
    // 山峰点色：青苹果深
    const peakPointColor = Cesium.Color.fromCssColorString('#577A18')
    const peakOutlineColor = Cesium.Color.fromCssColorString('#F4F1E8')

    // 山峰标注 —— 用真实海拔定位（不再贴 DEM 表面，避免 30m 精度偏差）
    peaks.forEach((p) => {
      const entity = viewer.entities.add({
        id: `peak-${p.id}`,
        name: `${p.name}\n${p.elevation} m`,
        // 关键：传入真实 elevation，让点显示在山峰真实海拔高度
        position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat, p.elevation),
        point: {
          pixelSize: pointSize,
          color: peakPointColor,
          outlineColor: peakOutlineColor,
          outlineWidth: 2,
          // NONE：使用绝对高度（即上面的 elevation），不依赖 DEM 贴地
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: `${p.name}  ${p.elevation}m`,
          font: peakLabelFont,
          fillColor: Cesium.Color.fromCssColorString('#1F2818'),
          outlineColor: labelOutlineColor,
          outlineWidth: 3,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, labelPixelOffset),
          // 标签也用绝对高度
          heightReference: Cesium.HeightReference.NONE,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          // 加奶酪背景，彻底解决与地形混淆
          showBackground: true,
          backgroundColor: labelBgColor,
          backgroundPadding: labelBgPadding
        }
      })
      ;(entity as any).peakId = p.id
    })

    // 景点标注（按真实海拔，区别于山峰用青苹果浅色）
    attractions.forEach((a) => {
      // 景点 type=service 的 elevation 可能是 0（游客中心），用 0 时退化为贴地
      const useElevation = a.elevation > 0
      const position = useElevation
        ? Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude, a.elevation)
        : Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude)
      viewer.entities.add({
        id: `attr-${a.id}`,
        name: a.name,
        position,
        point: {
          pixelSize: isMobile ? 7 : 9,
          color: a.type === 'service'
            ? Cesium.Color.fromCssColorString('#D97B3D')   // 暮色橙：服务设施
            : Cesium.Color.fromCssColorString('#8DB838'),  // 青苹果：景点
          outlineColor: Cesium.Color.fromCssColorString('#F4F1E8'),
          outlineWidth: 1.5,
          heightReference: useElevation ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        },
        label: {
          text: a.name,
          font: attrLabelFont,
          fillColor: Cesium.Color.fromCssColorString('#1F2818'),
          outlineColor: labelOutlineColor,
          outlineWidth: 2.5,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, isMobile ? -16 : -18),
          heightReference: useElevation ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: true,
          backgroundColor: labelBgColor,
          backgroundPadding: labelBgPadding
        }
      })
    })

    // 用户位置标注（可动态更新）—— GPS 点用暮色橙醒目
    const pos = userPosition ?? { lat: defaultUserPosition.lat, lng: defaultUserPosition.lng }
    userEntityRef.current = viewer.entities.add({
      id: 'user-pos',
      name: '当前位置',
      position: Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat),
      point: {
        pixelSize: isMobile ? 11 : 13,
        color: Cesium.Color.fromCssColorString('#D97B3D'),  // 暮色橙：用户位置最醒目
        outlineColor: Cesium.Color.fromCssColorString('#F4F1E8'),
        outlineWidth: 2.5,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      },
      label: {
        text: '📍 我的位置',
        font: isMobile
          ? `600 12px ${LABEL_FONT_FAMILY}`
          : `600 13px ${LABEL_FONT_FAMILY}`,
        fillColor: Cesium.Color.fromCssColorString('#1F2818'),
        outlineColor: labelOutlineColor,
        outlineWidth: 2.5,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, isMobile ? -22 : -24),
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
        showBackground: true,
        backgroundColor: labelBgColor,
        backgroundPadding: labelBgPadding
      }
    })

    // 点击山峰：有回调则回调，否则默认跳转详情页
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position)
      if (Cesium.defined(picked) && Cesium.defined(picked.id)) {
        const entity = picked.id as Cesium.Entity & { peakId?: string }
        if (entity.peakId) {
          if (onPeakSelect) onPeakSelect(entity.peakId)
          else navigate(`/peak/${entity.peakId}`)
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
      userEntityRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isMobile, onPeakSelect])

  // 监听用户位置变化，更新标注
  useEffect(() => {
    const entity = userEntityRef.current
    if (!entity || !userPosition) return
    entity.position = new Cesium.ConstantPositionProperty(
      Cesium.Cartesian3.fromDegrees(userPosition.lng, userPosition.lat)
    )
  }, [userPosition])

  // 监听路线变化，绘制/更新示意直线
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    // 清除旧路线
    if (routeEntityRef.current) {
      viewer.entities.remove(routeEntityRef.current)
      routeEntityRef.current = null
    }

    if (!route) return

    const positions = Cesium.Cartesian3.fromDegreesArray([
      route.from.lng, route.from.lat,
      route.to.lng, route.to.lat,
    ])

    routeEntityRef.current = viewer.entities.add({
      id: 'nav-route',
      name: '示意路线',
      polyline: {
        positions,
        width: 4,
        material: Cesium.Color.fromCssColorString('#f59e0b'),
        clampToGround: true,
      }
    })
  }, [route])

  // 监听轨迹变化，绘制/更新轨迹线
  useEffect(() => {
    const viewer = viewerRef.current
    if (!viewer) return

    // 清除旧轨迹
    if (trackEntityRef.current) {
      viewer.entities.remove(trackEntityRef.current)
      trackEntityRef.current = null
    }

    if (!trackPoints || trackPoints.length < 2) return

    const coords: number[] = []
    for (const p of trackPoints) {
      coords.push(p.lng, p.lat)
    }

    trackEntityRef.current = viewer.entities.add({
      id: 'gps-track',
      name: 'GPS 轨迹',
      polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray(coords),
        width: 3,
        material: Cesium.Color.fromCssColorString('#3b82f6'),
        clampToGround: true,
      }
    })
  }, [trackPoints])

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="cesium-container"
        aria-label="武功山 3D 地图"
        data-testid="cesium-container"
      />
      {!terrainReady && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 glass-light text-apple-700 text-sm rounded-full shadow-glass z-10 whitespace-nowrap inline-flex items-center gap-2">
          <span className="w-3 h-3 rounded-full border-2 border-apple-400/40 border-t-apple-500 animate-spin" />
          正在加载武功山三维地形…
        </div>
      )}
    </div>
  )
}
