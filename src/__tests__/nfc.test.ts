import { describe, it, expect, beforeEach, vi } from 'vitest'
import { nfcPoints, findNfcPoint, findNfcByAttraction } from '../data/nfcPoints'
import { addVisit, getVisits, hasVisited, clearVisits } from '../services/travelLog'

describe('NFC Points data', () => {
  it('should have at least 3 NFC points', () => {
    expect(nfcPoints.length).toBeGreaterThanOrEqual(3)
  })

  it('should include jinding, fayunjie, yangshimu', () => {
    const ids = nfcPoints.map((p) => p.attractionId)
    expect(ids).toContain('jinding')
    expect(ids).toContain('fayunjie')
    expect(ids).toContain('yangshimu')
  })

  it('each point should have badge and unlockedContent', () => {
    for (const p of nfcPoints) {
      expect(p.badge).toBeTruthy()
      expect(p.unlockedContent).toBeTruthy()
      expect(p.badgeIcon).toBeTruthy()
    }
  })

  it('findNfcPoint should return by nfcId', () => {
    const point = findNfcPoint('wugongshan-jinding')
    expect(point).toBeDefined()
    expect(point!.name).toBe('金顶')
  })

  it('findNfcByAttraction should return by attractionId', () => {
    const point = findNfcByAttraction('fayunjie')
    expect(point).toBeDefined()
    expect(point!.badge).toBe('云端行者')
  })
})

describe('TravelLog service', () => {
  beforeEach(() => {
    clearVisits()
  })

  it('should add a visit record', () => {
    const record = addVisit('jinding', '金顶', {
      badge: '金顶探索者',
      badgeIcon: '🏔️',
    })
    expect(record).not.toBeNull()
    expect(record!.attractionId).toBe('jinding')
    expect(record!.name).toBe('金顶')
    expect(record!.badge).toBe('金顶探索者')
  })

  it('should detect existing visit', () => {
    addVisit('jinding', '金顶')
    expect(hasVisited('jinding')).toBe(true)
    expect(hasVisited('fayunjie')).toBe(false)
  })

  it('should prevent repeat checkin within threshold', () => {
    addVisit('jinding', '金顶')
    const second = addVisit('jinding', '金顶')
    expect(second).toBeNull()
  })

  it('should list all visits', () => {
    addVisit('jinding', '金顶')
    addVisit('fayunjie', '发云界')
    const visits = getVisits()
    expect(visits.length).toBe(2)
  })

  it('should handle corrupted localStorage gracefully', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockReturnValue('{bad json')
    expect(getVisits()).toEqual([])
    vi.restoreAllMocks()
  })
})
