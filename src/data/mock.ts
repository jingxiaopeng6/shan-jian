import type { Peak, UserPosition, VisiblePeak, ViewshedSector, ViewshedProfileSample } from '../types'

// 武功山区域主要山峰 Mock 数据
// 坐标与海拔基于公开资料近似，允许误差。
export const peaks: Peak[] = [
  {
    id: 'jinding',
    name: '金顶',
    pinyin: 'Jinding',
    lat: 27.4789,
    lng: 114.1728,
    elevation: 1918,
    description:
      '武功山主峰，海拔 1918 米，又名白鹤峰。山顶有古祭坛群与世纪之碑，是观赏日出、云海与高山草甸的核心景点。',
    bestViewTime: '最佳观赏：日出 05:30–06:30 · 日落 18:30–19:30 · 云海 08:00–10:00',
    relatedIds: ['fayunjie', 'qianzhangyan', 'baihefeng']
  },
  {
    id: 'fayunjie',
    name: '发云界',
    pinyin: 'Fayunjie',
    lat: 27.5231,
    lng: 114.2103,
    elevation: 1628,
    description:
      '武功山东麓门户，以云雾生发源地而得名。拥有十万亩高山草甸的东起点，徒步穿越经典路段入口。',
    bestViewTime: '最佳观赏：清晨 06:00–08:00 · 云海高发时段',
    relatedIds: ['jinding', 'juewangpo', 'haohanpo']
  },
  {
    id: 'qianzhangyan',
    name: '千丈岩',
    pinyin: 'Qianzhangyan',
    lat: 27.4683,
    lng: 114.1847,
    elevation: 1580,
    description:
      '绝壁千仞的花岗岩崖壁，为武功山最具视觉冲击力的岩壁景点，岩面纵横如斧劈刀削。',
    bestViewTime: '最佳观赏：上午 09:00–11:00 · 侧光凸显岩壁质感',
    relatedIds: ['jinding', 'yangshimu']
  },
  {
    id: 'juewangpo',
    name: '绝望坡',
    pinyin: 'Juewangpo',
    lat: 27.5047,
    lng: 114.2019,
    elevation: 1720,
    description:
      '一段落差近 400 米的陡峭山脊，因坡度大、徒步者望而生畏得名。站于坡顶，草甸与远山层次极佳。',
    bestViewTime: '最佳观赏：上午 08:00–10:00 · 晴天逆光最少',
    relatedIds: ['fayunjie', 'haohanpo']
  },
  {
    id: 'haohanpo',
    name: '好汉坡',
    pinyin: 'Haohanpo',
    lat: 27.5133,
    lng: 114.1986,
    elevation: 1560,
    description:
      '由近千级石阶构成的爬坡路段，登顶后可俯瞰发云界全景，是徒步穿越"非好汉不过"的经典关口。',
    bestViewTime: '最佳观赏：午后 14:00–16:00 · 顺光视野开阔',
    relatedIds: ['fayunjie', 'juewangpo']
  },
  {
    id: 'yangshimu',
    name: '羊狮幕',
    pinyin: 'Yangshimu',
    lat: 27.4492,
    lng: 114.2081,
    elevation: 1674,
    description:
      '奇峰怪石与花岗岩峰林地貌，因常年云雾奔涌如同羊狮起舞而得名，与金顶、发云界并称为"武功三绝"。',
    bestViewTime: '最佳观赏：雨后初晴 09:00–11:00 · 云雾升腾最盛',
    relatedIds: ['qianzhangyan', 'jinding']
  },
  {
    id: 'baihefeng',
    name: '白鹤峰',
    pinyin: 'Baihefeng',
    lat: 27.4815,
    lng: 114.1681,
    elevation: 1880,
    description:
      '金顶北侧相邻高峰，峰顶有古白鹤寺遗址。冬季积雪留存时间长，为武功山观雪胜地。',
    bestViewTime: '最佳观赏：冬季 08:00–10:00 · 雪后日出',
    relatedIds: ['jinding', 'qianzhangyan']
  }
]

// 当前用户模拟位置（2 处）
export const userPositions: UserPosition[] = [
  {
    id: 'jinding-view-platform',
    name: '金顶观景台',
    lat: 27.4789,
    lng: 114.1728,
    elevation: 1918,
    headingDeg: 90 // 默认朝向正东
  },
  {
    id: 'fayunjie-visitor-center',
    name: '发云界游客中心',
    lat: 27.5231,
    lng: 114.2103,
    elevation: 1628,
    headingDeg: 225 // 朝向西南（指向金顶）
  }
]

export const defaultUserPosition = userPositions[0]

/**
 * 计算两点之间的近似距离（km）与方位角（度，0-360）
 * 使用简化的平面投影以保持 mock 数据可预测，而非真实 Haversine。
 */
function distanceAndAzimuth(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const latPerKm = 1 / 111
  const lngPerKm = 1 / (111 * Math.cos((a.lat * Math.PI) / 180))
  const dLatKm = (b.lat - a.lat) / latPerKm
  const dLngKm = (b.lng - a.lng) / lngPerKm
  const distance = Math.hypot(dLatKm, dLngKm)
  // 方位角：正北 0，顺时针
  let az = (Math.atan2(dLngKm, dLatKm) * 180) / Math.PI
  if (az < 0) az += 360
  return { distanceKm: distance, azimuthDeg: az }
}

/** 根据用户位置返回该位置可见的山峰（Mock 版，可视阈值内视为可见） */
export function getVisiblePeaks(user: UserPosition, headingFilterDeg?: number): VisiblePeak[] {
  const all: VisiblePeak[] = peaks
    .filter((p) => p.id !== user.id.replace(/-view-platform|-visitor-center/g, ''))
    .map((p) => {
      const { distanceKm, azimuthDeg } = distanceAndAzimuth(user, p)
      // Mock 规则：距离 <= 8 km 或为主要山峰则 visible=true，远距离偶有遮挡
      const visible = distanceKm <= 8 ? true : p.id === 'jinding' || p.id === 'fayunjie'
      return {
        peakId: p.id,
        distanceKm: Number(distanceKm.toFixed(2)),
        azimuthDeg: Number(azimuthDeg.toFixed(1)),
        visible
      }
    })
  if (headingFilterDeg == null) return all
  // 视角过滤：保留视线方向 ± 60° 范围的山峰（模拟 AR 取景窗口）
  const half = 60
  return all.filter((v) => angleDiff(v.azimuthDeg, headingFilterDeg) <= half)
}

export function angleDiff(a: number, b: number): number {
  const d = Math.abs(((a - b + 180) % 360) - 180)
  return d
}

/** 按 ID 取山峰 */
export function getPeakById(id: string): Peak | undefined {
  return peaks.find((p) => p.id === id)
}

/** 视域扇区 Mock 数据：用于示意图（默认用户位置金顶观景台） */
export function getViewshedSectors(user: UserPosition): ViewshedSector[] {
  if (user.id === 'jinding-view-platform') {
    return [
      { azimuthStartDeg: 0,   azimuthEndDeg: 50,  distanceM: 5800, status: 'visible' },
      { azimuthStartDeg: 50,  azimuthEndDeg: 100, distanceM: 6500, status: 'visible' },
      { azimuthStartDeg: 100, azimuthEndDeg: 150, distanceM: 3200, status: 'partial', blockedBy: 'qianzhangyan' },
      { azimuthStartDeg: 150, azimuthEndDeg: 210, distanceM: 4100, status: 'blocked', blockedBy: 'baihefeng' },
      { azimuthStartDeg: 210, azimuthEndDeg: 270, distanceM: 7000, status: 'visible' },
      { azimuthStartDeg: 270, azimuthEndDeg: 320, distanceM: 7500, status: 'visible' },
      { azimuthStartDeg: 320, azimuthEndDeg: 360, distanceM: 5200, status: 'partial', blockedBy: 'yangshimu' }
    ]
  }
  // 发云界游客中心
  return [
    { azimuthStartDeg: 0,   azimuthEndDeg: 60,  distanceM: 4200, status: 'visible' },
    { azimuthStartDeg: 60,  azimuthEndDeg: 120, distanceM: 2800, status: 'blocked', blockedBy: 'haohanpo' },
    { azimuthStartDeg: 120, azimuthEndDeg: 200, distanceM: 6000, status: 'visible' },
    { azimuthStartDeg: 200, azimuthEndDeg: 260, distanceM: 7200, status: 'visible' },
    { azimuthStartDeg: 260, azimuthEndDeg: 320, distanceM: 3100, status: 'partial', blockedBy: 'juewangpo' },
    { azimuthStartDeg: 320, azimuthEndDeg: 360, distanceM: 5100, status: 'visible' }
  ]
}

/** 视域剖面图取样点（Mock） */
export function getViewshedProfile(user: UserPosition, targetPeakId?: Peak['id']): ViewshedProfileSample[] {
  const target = targetPeakId ? getPeakById(targetPeakId) : undefined
  const totalM = 8000
  const step = 400
  const samples: ViewshedProfileSample[] = []
  for (let d = 0; d <= totalM; d += step) {
    // 生成一段起伏的地形 + 最后高峰
    const ratio = d / totalM
    let terrain =
      user.elevation -
      160 * ratio +
      Math.sin(d / 300) * 28 +
      Math.sin(d / 1100) * 55 +
      Math.cos(d / 700) * 22
    // 目标峰在终点凸起
    if (target && d > totalM * 0.88) {
      terrain = Math.max(terrain, target.elevation * (0.92 + (d - totalM * 0.88) / (totalM * 0.12) * 0.08))
    }
    // 视线：从用户身高线性下降至终点（考虑地球曲率的简化 mock，直接取线性）
    const targetElev = target ? target.elevation : user.elevation - 30
    const los = user.elevation + 1.6 + ((targetElev + 1.6) - (user.elevation + 1.6)) * ratio
    const blocked = terrain > los + 0.5
    samples.push({ distance: d, terrainElevation: Number(terrain.toFixed(1)), lineOfSight: Number(los.toFixed(1)), blocked })
  }
  return samples
}
