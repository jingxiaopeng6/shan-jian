/**
 * NFC 景点配置
 *
 * 将 NFC 标签 ID 关联到现有统一景点/Peak 数据。
 * 禁止在此创建新的景点数据，只做 ID 映射 + 徽章/解锁内容。
 */

export interface NfcPoint {
  /** NFC 标签写入的标识符（NDEF 文本内容） */
  nfcId: string
  /** 关联的景点 ID（对应 attractions.ts 或 mock.ts peaks 的 id） */
  attractionId: string
  /** 关联的山峰 ID（如果同时是山峰，对应 mock.ts peaks 的 id） */
  peakId?: string
  /** 景点名称（从统一数据源读取，此处仅用于 NFC 查找） */
  name: string
  /** 解锁内容（打卡后展示） */
  unlockedContent: string
  /** 徽章名称 */
  badge: string
  /** 徽章图标（emoji） */
  badgeIcon: string
  /** 打卡描述 */
  description: string
  /** 徽章描述说明 */
  badgeDescription: string
}

export const nfcPoints: NfcPoint[] = [
  {
    nfcId: 'wugongshan-jinding',
    attractionId: 'jinding',
    peakId: 'jinding',
    name: '金顶',
    unlockedContent: '武功山主峰，海拔 1918 米。站在世纪之碑旁，云海在脚下翻涌，十万亩草甸铺展天际。你已征服江西之巅！',
    badge: '金顶探索者',
    badgeIcon: '🏔️',
    description: '登顶武功山最高峰',
    badgeDescription: '完成金顶打卡，征服江西之巅',
  },
  {
    nfcId: 'wugongshan-fayunjie',
    attractionId: 'fayunjie',
    peakId: 'fayunjie',
    name: '发云界',
    unlockedContent: '十万亩高山草甸的东起点，云雾从此生发。清晨时分，云海如瀑布般倾泻山脊，是武功山最壮观的云海观赏地。',
    badge: '云端行者',
    badgeIcon: '☁️',
    description: '漫步云端草甸',
    badgeDescription: '完成发云界探索任务，漫步云端',
  },
  {
    nfcId: 'wugongshan-yangshimu',
    attractionId: 'yangshimu',
    peakId: 'yangshimu',
    name: '羊狮幕',
    unlockedContent: '奇峰怪石与花岗岩峰林地貌，常年云雾奔涌如同羊狮起舞。与金顶、发云界并称"武功三绝"，是武功山最神秘的区域。',
    badge: '山野发现者',
    badgeIcon: '🦁',
    description: '探索武功三绝之一',
    badgeDescription: '完成多个景点探索，发现武功三绝',
  },
]

/** 根据 NFC ID 查找景点配置 */
export function findNfcPoint(nfcId: string): NfcPoint | undefined {
  return nfcPoints.find((p) => p.nfcId === nfcId)
}

/** 根据 attractionId 查找 NFC 配置 */
export function findNfcByAttraction(attractionId: string): NfcPoint | undefined {
  return nfcPoints.find((p) => p.attractionId === attractionId)
}
