import { describe, it, expect } from 'vitest'
import { peaks, userPositions, getPeakById, getVisiblePeaks, getViewshedSectors, getViewshedProfile } from '../data/mock'

describe('Mock 数据层', () => {
  it('TR-2.1 peaks.length >= 6 且所有山峰含必填字段', () => {
    expect(peaks.length).toBeGreaterThanOrEqual(6)
    for (const p of peaks) {
      expect(p.id).toBeTruthy()
      expect(p.name).toBeTruthy()
      expect(typeof p.lat).toBe('number')
      expect(typeof p.lng).toBe('number')
      expect(typeof p.elevation).toBe('number')
      expect(p.elevation).toBeGreaterThan(1000)
    }
    expect(userPositions.length).toBeGreaterThanOrEqual(2)
  })

  it('TR-2.2 getVisiblePeaks 返回 length >= 3 且字段合法', () => {
    const visible = getVisiblePeaks(userPositions[0])
    expect(visible.length).toBeGreaterThanOrEqual(3)
    for (const v of visible) {
      expect(v.distanceKm).toBeGreaterThan(0)
      expect(v.azimuthDeg).toBeGreaterThanOrEqual(0)
      expect(v.azimuthDeg).toBeLessThan(360)
      expect(typeof v.visible).toBe('boolean')
    }
  })

  it('getPeakById 正确映射 / 返回 undefined', () => {
    const jinding = getPeakById('jinding')
    expect(jinding).toBeTruthy()
    expect(jinding!.name).toBe('金顶')
    expect(getPeakById('not-exist-id')).toBeUndefined()
  })

  it('getViewshedSectors 返回扇区 >= 6 且角度合法', () => {
    const sectors = getViewshedSectors(userPositions[0])
    expect(sectors.length).toBeGreaterThanOrEqual(6)
    for (const s of sectors) {
      expect(s.azimuthStartDeg).toBeGreaterThanOrEqual(0)
      expect(s.azimuthEndDeg).toBeGreaterThanOrEqual(s.azimuthStartDeg)
      expect(s.distanceM).toBeGreaterThan(0)
      expect(['visible', 'partial', 'blocked']).toContain(s.status)
    }
  })

  it('getViewshedProfile 采样数组有效', () => {
    const samples = getViewshedProfile(userPositions[0])
    expect(samples.length).toBeGreaterThanOrEqual(10)
    for (const s of samples) {
      expect(typeof s.distance).toBe('number')
      expect(typeof s.terrainElevation).toBe('number')
      expect(typeof s.lineOfSight).toBe('number')
      expect(typeof s.blocked).toBe('boolean')
    }
  })
})
