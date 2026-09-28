/**
 * GeoTiffTerrainProvider — Cesium 自定义地形 Provider
 *
 * 基于真实 DEM GeoTIFF 数据，在浏览器端生成 Cesium 三维地形。
 * 复用 DEMTerrainProvider 已加载的栅格数据，避免重复加载。
 *
 * 工作原理：
 * 1. Cesium 请求某个 tile (x, y, level) 的几何数据
 * 2. 计算该 tile 的 WGS84 经纬度范围
 * 3. 将经纬度范围转换为 DEM (UTM49N) 的像素范围
 * 4. 从 DEM raster 中采样 N×N 个高程点
 * 5. 封装为 HeightmapTerrainData 返回给 Cesium 渲染
 *
 * 限制：
 * - 仅在 DEM 覆盖范围内提供地形数据，范围外返回 undefined（Cesium 用上采样）
 * - 不支持顶点法线（无地形光照），因为 heightmap 格式不包含法线
 */

import * as Cesium from 'cesium'
import proj4 from 'proj4'
import type { DEMTerrainProvider } from './DEMTerrainProvider'

/** WGS84 → UTM Zone 49N 投影定义（武功山所在区域） */
const UTM49N = '+proj=utm +zone=49 +datum=WGS84 +units=m +no_defs'

/** heightmap 采样尺寸（65×65 = 64×64 网格 + 1 边界） */
const TILE_SIZE = 65

/** 支持的最大瓦片层级 */
const MAX_LEVEL = 14

export class GeoTiffTerrainProvider implements Cesium.TerrainProvider {
  private _demProvider: DEMTerrainProvider
  private _tilingScheme: Cesium.GeographicTilingScheme
  private _readyPromise: Promise<void>
  private _errorEvent = new Cesium.Event()

  constructor(demProvider: DEMTerrainProvider) {
    this._demProvider = demProvider
    this._tilingScheme = new Cesium.GeographicTilingScheme({
      numberOfLevelZeroTilesX: 2,
      numberOfLevelZeroTilesY: 1,
    })

    // 等待 DEM 数据加载完成
    this._readyPromise = (async () => {
      if (!demProvider.isReady) {
        await demProvider.load()
      }
    })()
  }

  get errorEvent(): Cesium.Event {
    return this._errorEvent
  }

  get ready(): boolean {
    return this._demProvider.isReady
  }

  get readyPromise(): Promise<void> {
    return this._readyPromise
  }

  get tilingScheme(): Cesium.GeographicTilingScheme {
    return this._tilingScheme
  }

  get credit(): Cesium.Credit {
    return new Cesium.Credit('ASTER GDEM 30m · 武功山')
  }

  /** 是否支持水掩膜（DEM 无水体数据） */
  get hasWaterMask(): boolean {
    return false
  }

  /** 是否支持顶点法线（heightmap 格式不包含法线） */
  get hasVertexNormals(): boolean {
    return false
  }

  /** 瓦片可用性信息（按需返回） */
  get availability(): Cesium.TileAvailability | undefined {
    return undefined
  }

  /**
   * 加载指定 tile 的可用性信息
   * 本 Provider 不预计算可用性，返回 undefined 让 Cesium 自行判断
   */
  loadTileDataAvailability(_x: number, _y: number, _level: number): Promise<void> | undefined {
    return undefined
  }

  /**
   * 请求指定 tile 的地形几何数据
   * 返回 HeightmapTerrainData，或 undefined（tile 不在 DEM 范围内）
   */
  requestTileGeometry(
    x: number,
    y: number,
    level: number,
  ): Promise<Cesium.TerrainData> | undefined {
    if (!this.ready) return undefined
    if (level > MAX_LEVEL) return undefined

    const meta = this._demProvider.meta
    const raster = this._demProvider.rasterData
    if (!meta || !raster) return undefined

    // 1. 计算 tile 的 WGS84 经纬度范围
    const rectangle = this._tilingScheme.tileXYToRectangle(x, y, level)
    const west = Cesium.Math.toDegrees(rectangle.west)
    const south = Cesium.Math.toDegrees(rectangle.south)
    const east = Cesium.Math.toDegrees(rectangle.east)
    const north = Cesium.Math.toDegrees(rectangle.north)

    // 2. 快速剔除：tile 与 DEM 范围不相交则返回 undefined
    const demBBox = this._demProvider.latLngBBox // [south, west, north, east]
    if (demBBox) {
      const [demSouth, demWest, demNorth, demEast] = demBBox
      if (east < demWest || west > demEast || north < demSouth || south > demNorth) {
        return undefined
      }
    }

    // 3. 采样 TILE_SIZE × TILE_SIZE 个高程点
    const heights = new Float32Array(TILE_SIZE * TILE_SIZE)
    const { width, height, originX, originY, pixelWidth, pixelHeight } = meta

    for (let row = 0; row < TILE_SIZE; row++) {
      // 纬度从北到南（row=0 是北边）
      const lat = north - (north - south) * (row / (TILE_SIZE - 1))
      for (let col = 0; col < TILE_SIZE; col++) {
        // 经度从西到东
        const lng = west + (east - west) * (col / (TILE_SIZE - 1))

        // WGS84 → UTM49N
        const [easting, northing] = proj4('WGS84', UTM49N, [lng, lat])

        // UTM → raster row/col
        const rasterCol = Math.floor((easting - originX) / pixelWidth)
        const rasterRow = Math.floor((originY - northing) / Math.abs(pixelHeight))

        // 边界检查：超出 DEM 范围用 0（海平面）
        if (
          rasterCol >= 0 && rasterCol < width &&
          rasterRow >= 0 && rasterRow < height
        ) {
          const elev = raster[rasterRow * width + rasterCol]
          heights[row * TILE_SIZE + col] = elev > 0 ? elev : 0
        } else {
          heights[row * TILE_SIZE + col] = 0
        }
      }
    }

    // 4. 封装为 HeightmapTerrainData
    return Promise.resolve(
      new Cesium.HeightmapTerrainData({
        buffer: heights,
        width: TILE_SIZE,
        height: TILE_SIZE,
        childTileMask: level < MAX_LEVEL ? 15 : 0,
      }),
    )
  }

  /**
   * 获取指定层级的最大几何误差
   * 用于 Cesium 的 LOD 选择
   */
  getLevelMaximumGeometricError(level: number): number {
    return Cesium.TerrainProvider.getEstimatedLevelZeroGeometricErrorForAHeightmap(
      this._tilingScheme.ellipsoid,
      TILE_SIZE,
      this._tilingScheme.getNumberOfXTilesAtLevel(0),
    ) / (1 << level)
  }

  /**
   * 判断指定 tile 是否有数据
   */
  getTileDataAvailable(x: number, y: number, level: number): boolean | undefined {
    if (level > MAX_LEVEL) return false
    if (!this.ready) return undefined

    const demBBox = this._demProvider.latLngBBox
    if (!demBBox) return undefined

    const [demSouth, demWest, demNorth, demEast] = demBBox
    const rectangle = this._tilingScheme.tileXYToRectangle(x, y, level)
    const west = Cesium.Math.toDegrees(rectangle.west)
    const south = Cesium.Math.toDegrees(rectangle.south)
    const east = Cesium.Math.toDegrees(rectangle.east)
    const north = Cesium.Math.toDegrees(rectangle.north)

    return !(east < demWest || west > demEast || north < demSouth || south > demNorth)
  }
}
