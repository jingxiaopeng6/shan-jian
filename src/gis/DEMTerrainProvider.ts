/**
 * DEMTerrainProvider — 真实 DEM GeoTIFF 地形数据 Provider
 *
 * 使用 geotiff.js 在浏览器端解析 GeoTIFF，提供：
 * - getElevation(lat, lng)：单点高程查询
 * - getProfile(observer, target, sampleCount)：沿路径采样真实地形剖面
 *
 * 坐标系统：
 * DEM 文件是 EPSG:32649 (WGS84 / UTM Zone 49N) — 投影坐标（米）
 * 项目内部统一用 WGS84 经纬度 (lat, lng)
 * 因此 getElevation() 内部需要：WGS84 → UTM49N → row/col
 *
 * 数据缓存：GeoTIFF 只解析一次，raster 数据缓存在内存中。
 */

import proj4 from 'proj4'
import type { TerrainProvider, TerrainProfile, TerrainSample, GeoPoint } from './TerrainProvider'
import type { LatLng } from '../utils/geoUtils'

/** WGS84 → UTM Zone 49N 投影定义（武功山所在区域） */
const UTM49N = '+proj=utm +zone=49 +datum=WGS84 +units=m +no_defs'

/** GeoTIFF 元数据（坐标系已转换说明） */
interface DemMetadata {
  width: number
  height: number
  /** 左上角投影 X 坐标（UTM 米） */
  originX: number
  /** 左上角投影 Y 坐标（UTM 米） */
  originY: number
  /** 像素宽度（米） */
  pixelWidth: number
  /** 像素高度（米，负值表示从上到下递减） */
  pixelHeight: number
  /** bbox（投影坐标米） */
  bbox: [number, number, number, number]
  /** EPSG 代码 */
  epsg: number
}

/** DEM 加载状态 */
export type DemLoadStatus = 'idle' | 'loading' | 'ready' | 'error'

export class DEMTerrainProvider implements TerrainProvider {
  readonly source = 'dem' as const

  private metadata: DemMetadata | null = null
  private raster: Float32Array | null = null
  private _status: DemLoadStatus = 'idle'
  private _error: string | null = null
  private _tiffUrl: string

  constructor(tiffUrl: string) {
    this._tiffUrl = tiffUrl
  }

  get status(): DemLoadStatus {
    return this._status
  }

  get error(): string | null {
    return this._error
  }

  get meta(): DemMetadata | null {
    return this.metadata
  }

  /** 是否已加载就绪 */
  get isReady(): boolean {
    return this._status === 'ready' && this.raster !== null && this.metadata !== null
  }

  /** DEM 覆盖范围（投影坐标米） */
  get bbox(): [number, number, number, number] | null {
    return this.metadata?.bbox ?? null
  }

  /**
   * 异步加载 GeoTIFF 文件
   *
   * 流程：先 fetch 整个文件为 ArrayBuffer（单次请求），
   * 再用 GeoTIFF.fromArrayBuffer 解析。
   * 避免 geotiff.fromUrl 内部的多次 HTTP Range 请求
   * 在移动端 Chrome 上触发 ERR_INSUFFICIENT_RESOURCES。
   */
  async load(): Promise<void> {
    if (this._status === 'loading') return
    this._status = 'loading'
    this._error = null

    try {
      // 1. 完整 fetch 整个 TIFF 文件（单次请求，5MB）
      const response = await fetch(this._tiffUrl, { cache: 'no-cache' })
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      const arrayBuffer = await response.arrayBuffer()

      // 2. 用 fromArrayBuffer 解析（避免 Range requests）
      const GeoTIFF = await import('geotiff')
      const tiff = await GeoTIFF.fromArrayBuffer(arrayBuffer)
      const image = await tiff.getImage()

      const rasters = await image.readRasters()
      const width = image.getWidth()
      const height = image.getHeight()
      const [originX, originY] = image.getOrigin()
      const [pixelWidth, pixelHeight] = image.getResolution()
      const bbox = image.getBoundingBox()

      // 尝试读取 GeoKeys 确定 EPSG
      const geoKeys = image.getGeoKeys()
      const epsg = geoKeys?.ProjectedCSTypeGeoKey ?? 0

      // 提取第一个波段的数据，转成 Float32Array
      const band0 = rasters[0]
      const data = new Float32Array(width * height)
      for (let i = 0; i < width * height; i++) {
        const v = band0[i]
        // GeoTIFF 中 nodata 值可能为 -9999 或 NaN
        data[i] = v === -9999 || v === -32768 || Number.isNaN(v) ? -1 : v
      }

      this.raster = data
      this.metadata = {
        width,
        height,
        originX,
        originY,
        pixelWidth,
        pixelHeight,
        bbox: [bbox[0], bbox[1], bbox[2], bbox[3]],
        epsg
      }
      this._status = 'ready'
    } catch (err) {
      this._status = 'error'
      this._error = err instanceof Error ? err.message : String(err)
    }
  }

  /**
   * 查询指定经纬度的 DEM 高程
   *
   * 坐标转换流程：
   *   WGS84 (lat, lng) → UTM Zone 49N (easting, northing) → raster (col, row) → 高程值
   *
   * @returns 高程（米），如果坐标超出 DEM 范围返回 null
   */
  getElevation(lat: number, lng: number): number | null {
    if (!this.isReady || !this.metadata || !this.raster) return null

    const { width, height, originX, originY, pixelWidth, pixelHeight, bbox } = this.metadata

    // 1. WGS84 lat/lng → UTM Zone 49N easting/northing
    // proj4([from], [to], [x, y]) — 注意是 [lng, lat] 顺序
    const [easting, northing] = proj4('WGS84', UTM49N, [lng, lat])

    // 2. 检查是否在 DEM bbox 范围内
    if (
      easting < bbox[0] || easting > bbox[2] ||
      northing < bbox[1] || northing > bbox[3]
    ) {
      return null
    }

    // 3. UTM 坐标 → raster row/col
    //    col = (easting - originX) / pixelWidth
    //    row = (originY - northing) / |pixelHeight|   (originY 是左上角，northing 越小越靠下)
    const col = Math.floor((easting - originX) / pixelWidth)
    const row = Math.floor((originY - northing) / Math.abs(pixelHeight))

    // 4. 边界保护
    if (col < 0 || col >= width || row < 0 || row >= height) {
      return null
    }

    const idx = row * width + col
    const elev = this.raster[idx]

    // 5. nodata 检查
    if (elev < 0) return null

    return Number(elev.toFixed(1))
  }

  /**
   * 沿 observer → target 路径采样真实 DEM 地形剖面
   *
   * 在两点之间均匀插值 N 个经纬度点，
   * 对每个点调用 getElevation() 获取真实高程。
   */
  getProfile(observer: GeoPoint, target: GeoPoint, sampleCount = 200): TerrainProfile {
    if (!this.isReady) {
      return { samples: [], totalDistance: 0, source: 'dem' }
    }

    const N = Math.max(2, sampleCount)
    const totalDistance = haversineMeters(observer, target)

    const samples: TerrainSample[] = []

    for (let i = 0; i < N; i++) {
      const ratio = i / (N - 1) // 0 → 1
      const distance = ratio * totalDistance

      // 线性插值经纬度
      const lat = observer.lat + (target.lat - observer.lat) * ratio
      const lng = observer.lng + (target.lng - observer.lng) * ratio

      const elevation = this.getElevation(lat, lng)

      samples.push({
        distance: Number(distance.toFixed(1)),
        elevation: elevation ?? 0 // 超出范围用 0
      })
    }

    return { samples, totalDistance, source: 'dem' }
  }
}

/** Haversine 距离（米） */
function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000
  const lat1 = (a.lat * Math.PI) / 180
  const lat2 = (b.lat * Math.PI) / 180
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}
