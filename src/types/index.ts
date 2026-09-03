// 全局类型定义
export interface Peak {
  id: string
  name: string
  pinyin: string
  /** 纬度（WGS84，十进制度） */
  lat: number
  /** 经度（WGS84，十进制度） */
  lng: number
  /** 海拔（米） */
  elevation: number
  /** 简介（1-2 段话） */
  description: string
  /** 推荐观赏时段说明 */
  bestViewTime: string
  /** 关联山峰 ID 列表 */
  relatedIds: string[]
}

export interface UserPosition {
  id: string
  name: string
  lat: number
  lng: number
  elevation: number
  /** 设备默认朝向（度，正北=0，顺时针） */
  headingDeg: number
}

export interface VisiblePeak {
  peakId: Peak['id']
  /** 与当前用户位置的距离（公里） */
  distanceKm: number
  /** 相对用户的方位角（度，[0,360)） */
  azimuthDeg: number
  /** 是否可视（遮挡关系 Mock） */
  visible: boolean
}

export interface ViewshedSector {
  /** 扇区起始方位 */
  azimuthStartDeg: number
  /** 扇区终止方位 */
  azimuthEndDeg: number
  /** 最远距离（米） */
  distanceM: number
  /** 被何遮挡（山峰 ID，可选） */
  blockedBy?: Peak['id']
  /** 扇区状态 */
  status: 'visible' | 'partial' | 'blocked'
}

export interface ViewshedProfileSample {
  /** 距离起点（米） */
  distance: number
  /** 地形海拔（米） */
  terrainElevation: number
  /** 视线高度（米） */
  lineOfSight: number
  /** 是否遮挡 */
  blocked: boolean
}
