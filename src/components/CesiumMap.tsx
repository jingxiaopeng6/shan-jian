import { useEffect, useRef } from 'react'
import * as Cesium from 'cesium'
import 'cesium/Build/Cesium/Widgets/widgets.css'
import { peaks, defaultUserPosition } from '../data/mock'
import { useNavigate } from 'react-router-dom'
import { useIsMobile } from '../hooks/useIsMobile'

/**
 * Cesium 3D 地图组件
 * - EllipsoidTerrainProvider 避免真实地形瓦片依赖
 * - 武功山中心相机定位，山峰 + 当前位置标注
 * - 山峰标注可点击进入详情页
 * - 移动端优化：降低渲染精度、支持触摸手势、减小标注尺寸
 */
export default function CesiumMap() {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

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
    // 移除 Cesium 版权文字 DOM
    ;(viewer.cesiumWidget.creditContainer as HTMLElement).style.display = 'none'

    // 移动端渲染优化：降低分辨率比例、关闭高精度光照
    if (isMobile) {
      // 降低渲染分辨率以提升手机性能
      viewer.resolutionScale = 0.8
      // 关闭大气和光照效果（减少 GPU 压力）
      viewer.scene.globe.enableLighting = false
      if (viewer.scene.skyAtmosphere) {
        viewer.scene.skyAtmosphere.show = false
      }
      // 限制帧率以降低功耗
      viewer.scene.maximumRenderTimeChange = Infinity
      // 启用触摸输入（Cesium 默认已支持，但显式确认）
      viewer.scene.screenSpaceCameraController.enableRotate = true
      viewer.scene.screenSpaceCameraController.enableTranslate = true
      viewer.scene.screenSpaceCameraController.enableZoom = true
      viewer.scene.screenSpaceCameraController.enableTilt = true
      // 移动端缩小最大缩放距离限制
      viewer.scene.screenSpaceCameraController.minimumZoomDistance = 1000
      viewer.scene.screenSpaceCameraController.maximumZoomDistance = 80000
    }

    // 初始相机定位：武功山
    const centerLat = 27.485
    const centerLng = 114.192
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(centerLng, centerLat - 0.05, 35000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0
      },
      duration: 0.01
    })

    // 添加山峰标注（移动端缩小标注尺寸避免遮挡）
    const labelPixelOffset = isMobile ? -14 : -16
    const pointSize = isMobile ? 7 : 9
    const labelFont = isMobile
      ? '600 11px "PingFang SC", sans-serif'
      : '600 13px "PingFang SC", sans-serif'

    peaks.forEach((p) => {
      const entity = viewer.entities.add({
        id: `peak-${p.id}`,
        name: `${p.name}\n${p.elevation} m`,
        position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat, p.elevation),
        point: {
          pixelSize: pointSize,
          color: Cesium.Color.fromCssColorString('#b3813d'),
          outlineColor: Cesium.Color.fromCssColorString('#325043'),
          outlineWidth: 1.2,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: `${p.name}  ${p.elevation}m`,
          font: labelFont,
          fillColor: Cesium.Color.fromCssColorString('#23362f'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, labelPixelOffset),
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      // 存储自定义数据以便点击判断
      ;(entity as any).peakId = p.id
    })

    // 当前用户位置
    const user = defaultUserPosition
    viewer.entities.add({
      id: 'user-pos',
      name: `当前位置 · ${user.name}`,
      position: Cesium.Cartesian3.fromDegrees(user.lng, user.lat, user.elevation + 20),
      point: {
        pixelSize: isMobile ? 10 : 12,
        color: Cesium.Color.fromCssColorString('#325043'),
        outlineColor: Cesium.Color.fromCssColorString('#e6d2a9'),
        outlineWidth: 2
      },
      label: {
        text: '当前位置',
        font: isMobile
          ? '500 11px "PingFang SC", sans-serif'
          : '500 12px "PingFang SC", sans-serif',
        fillColor: Cesium.Color.fromCssColorString('#325043'),
        outlineColor: Cesium.Color.WHITE,
        outlineWidth: 2,
        style: Cesium.LabelStyle.FILL_AND_OUTLINE,
        pixelOffset: new Cesium.Cartesian2(0, isMobile ? -18 : -20),
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })

    // 山峰点击跳详情（移动端同时支持触摸事件）
    const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas)
    handler.setInputAction((click: { position: Cesium.Cartesian2 }) => {
      const picked = viewer.scene.pick(click.position)
      if (Cesium.defined(picked) && Cesium.defined(picked.id)) {
        const entity = picked.id as Cesium.Entity & { peakId?: string }
        if (entity.peakId) {
          navigate(`/peak/${entity.peakId}`)
        }
      }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

    return () => {
      handler.destroy()
      viewer.destroy()
      viewerRef.current = null
    }
  }, [navigate, isMobile])

  return (
    <div
      ref={containerRef}
      className="cesium-container"
      aria-label="武功山 3D 地图"
      data-testid="cesium-container"
    />
  )
}
