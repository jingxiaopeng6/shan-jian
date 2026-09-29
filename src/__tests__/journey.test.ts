import { describe, it, expect, beforeEach } from 'vitest'
import { addTrackPoint, getTrackPoints, getTrackDistanceKm, getTrackStats, clearTrack } from '../services/trackLog'
import { addVisit, getVisits, clearVisits } from '../services/travelLog'
import { nfcPoints } from '../data/nfcPoints'

describe('TrackLog service', () => {
  beforeEach(() => {
    clearTrack()
    clearVisits()
  })

  it('should start with empty track', () => {
    expect(getTrackPoints()).toEqual([])
    expect(getTrackDistanceKm()).toBe(0)
  })

  it('should add first point directly', () => {
    const added = addTrackPoint(27.4789, 114.1728, 10)
    expect(added).toBe(true)
    expect(getTrackPoints().length).toBe(1)
  })

  it('should filter points within 10m', () => {
    addTrackPoint(27.4789, 114.1728, 10)
    // Move ~5m — should be filtered
    const added = addTrackPoint(27.47892, 114.17282, 10)
    expect(added).toBe(false)
    expect(getTrackPoints().length).toBe(1)
  })

  it('should add point when moved > 10m', () => {
    addTrackPoint(27.4789, 114.1728, 10)
    // Move ~100m — should be added
    const added = addTrackPoint(27.4798, 114.1738, 10)
    expect(added).toBe(true)
    expect(getTrackPoints().length).toBe(2)
  })

  it('should filter low accuracy points', () => {
    const added = addTrackPoint(27.4789, 114.1728, 150)
    expect(added).toBe(false)
  })

  it('should calculate track distance', () => {
    addTrackPoint(27.4789, 114.1728, 10)
    addTrackPoint(27.4889, 114.1828, 10) // ~1.4 km
    const dist = getTrackDistanceKm()
    expect(dist).toBeGreaterThan(1)
    expect(dist).toBeLessThan(3)
  })

  it('should return track stats', () => {
    addTrackPoint(27.4789, 114.1728, 10)
    addTrackPoint(27.4889, 114.1828, 10)
    const stats = getTrackStats()
    expect(stats.pointCount).toBe(2)
    expect(stats.totalDistanceKm).toBeGreaterThan(1)
    expect(stats.startTime).toBeTruthy()
    expect(stats.endTime).toBeTruthy()
  })

  it('should clear track', () => {
    addTrackPoint(27.4789, 114.1728, 10)
    clearTrack()
    expect(getTrackPoints()).toEqual([])
  })
})

describe('Journey stats integration', () => {
  beforeEach(() => {
    clearVisits()
    clearTrack()
  })

  it('should calculate exploration progress from nfcPoints + visits', () => {
    // No visits
    const total = nfcPoints.length
    const explored = nfcPoints.filter((p) =>
      getVisits().some((v) => v.attractionId === p.attractionId)
    ).length
    expect(explored).toBe(0)
    expect(total).toBeGreaterThanOrEqual(3)

    // Add one visit
    addVisit('jinding', '金顶', { badge: '金顶探索者', badgeIcon: '🏔️' })
    const exploredAfter = nfcPoints.filter((p) =>
      getVisits().some((v) => v.attractionId === p.attractionId)
    ).length
    expect(exploredAfter).toBe(1)
    const progress = Math.round((exploredAfter / total) * 100)
    expect(progress).toBeGreaterThan(0)
  })
})
