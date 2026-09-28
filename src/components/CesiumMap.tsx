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
}

/**
 * Cesium 3D 地图组件
 * - GeoTiffTerrainProvider：基于真实 DEM (ASTER GDEM 30m) 渲染武功山三维地形
 * - 武功山中心相机定位，山峰 + 景点 + 当前位置标注
 * - 山峰标注可点击进入详情页
 * - 支持基础路线绘制（MVP 示意直线）
 * - 移动端优化：降低渲染精度、支持触摸手势、减小标注尺寸
 */
export default function CesiumMap({ userPosition, route }: CesiumMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Cesium.Viewer | null>(null)
  const userEntityRef = useRef<Cesium.Entity | null>(null)
  const routeEntityRef = useRef<Cesium.Entity | null>(null)
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

    // 初始相机定位：武功山
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(114.192, 27.485 - 0.05, 35000),
      orientation: {
        heading: Cesium.Math.toRadians(0),
        pitch: Cesium.Math.toRadians(-55),
        roll: 0
      },
      duration: 0.01
    })

    // 标注尺寸配置
    const labelPixelOffset = isMobile ? -14 : -16
    const pointSize = isMobile ? 7 : 9
    const labelFont = isMobile
      ? '600 11px "PingFang SC", sans-serif'
      : '600 13px "PingFang SC", sans-serif'

    // 山峰标注
    peaks.forEach((p) => {
      const entity = viewer.entities.add({
        id: `peak-${p.id}`,
        name: `${p.name}\n${p.elevation} m`,
        position: Cesium.Cartesian3.fromDegrees(p.lng, p.lat),
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
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
      ;(entity as any).peakId = p.id
    })

    // 景点标注（蓝色点，区别于山峰）
    attractions.forEach((a) => {
      viewer.entities.add({
        id: `attr-${a.id}`,
        name: a.name,
        position: Cesium.Cartesian3.fromDegrees(a.longitude, a.latitude),
        point: {
          pixelSize: isMobile ? 6 : 8,
          color: a.type === 'service'
            ? Cesium.Color.fromCssColorString('#2563eb')
            : Cesium.Color.fromCssColorString('#059669'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 1,
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
        },
        label: {
          text: a.name,
          font: isMobile
            ? '500 10px "PingFang SC", sans-serif'
            : '500 11px "PingFang SC", sans-serif',
          fillColor: Cesium.Color.fromCssColorString('#1e3a5f'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          pixelOffset: new Cesium.Cartesian2(0, isMobile ? -12 : -14),
          heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
          disableDepthTestDistance: Number.POSITIVE_INFINITY
        }
      })
    })

    // 用户位置标注（可动态更新）
    const pos = userPosition ?? { lat: defaultUserPosition.lat, lng: defaultUserPosition.lng }
    userEntityRef.current = viewer.entities.add({
      id: 'user-pos',
      name: '当前位置',
      position: Cesium.Cartesian3.fromDegrees(pos.lng, pos.lat),
      point: {
        pixelSize: isMobile ? 10 : 12,
        color: Cesium.Color.fromCssColorString('#325043'),
        outlineColor: Cesium.Color.fromCssColorString('#e6d2a9'),
        outlineWidth: 2,
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND
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
        heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
        disableDepthTestDistance: Number.POSITIVE_INFINITY
      }
    })

    // 点击山峰跳详情
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
      userEntityRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, isMobile])

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

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="cesium-container"
        aria-label="武功山 3D 地图"
        data-testid="cesium-container"
      />
      {!terrainReady && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#23362f]/90 text-[#e6d2a9] text-sm rounded-full shadow-lg z-10 whitespace-nowrap">
          正在加载武功山三维地形…
        </div>
      )}
    </div>
  )
}
