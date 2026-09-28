/**
 * 武功山景点数据
 *
 * Stage 6 MVP：少量真实景点，用于三维地图标记和基础导航。
 * 坐标 WGS84 经纬度，与 Peak 数据统一坐标系。
 */

export interface Attraction {
  id: string
  name: string
  longitude: number
  latitude: number
  /** 海拔（米），未知则填 0 */
  elevation: number
  description: string
  /** 景点类型：peak 山峰 | scenic 景点 | service 服务设施 */
  type: 'peak' | 'scenic' | 'service'
}

export const attractions: Attraction[] = [
  {
    id: 'jinding',
    name: '金顶',
    longitude: 114.1728,
    latitude: 27.4789,
    elevation: 1918,
    description: '武功山主峰，江西省最高峰，可观云海日出。',
    type: 'peak',
  },
  {
    id: 'fayunjie',
    name: '发云界',
    longitude: 114.1486,
    latitude: 27.4631,
    elevation: 1628,
    description: '十万亩高山草甸核心区域，云海壮观。',
    type: 'scenic',
  },
  {
    id: 'yangshimu',
    name: '羊狮幕',
    longitude: 114.2000,
    latitude: 27.4300,
    elevation: 1674,
    description: '奇峰怪石、流泉飞瀑，以花岗岩峰林地貌著称。',
    type: 'scenic',
  },
  {
    id: 'hongyangu',
    name: '红岩谷瀑布',
    longitude: 114.1850,
    latitude: 27.4450,
    elevation: 1200,
    description: '多级瀑布群，夏季清凉避暑胜地。',
    type: 'scenic',
  },
  {
    id: 'visitor-center',
    name: '武功山游客中心',
    longitude: 114.1600,
    latitude: 27.4300,
    elevation: 480,
    description: '景区入口，提供票务、导览、接驳服务。',
    type: 'service',
  },
]
