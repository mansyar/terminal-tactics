import { describe, expect, it } from 'bun:test'
import {
  calculateDamage,
  getPositionMultiplier,
  getScannedHostiles,
  hasLineOfSight,
  isInRange,
} from './combatSystem'
import type { MapData } from './mapGenerator'

describe('combatSystem', () => {
  const mockMap: MapData = {
    width: 12,
    height: 12,
    tiles: Array.from({ length: 12 }, () =>
      Array.from({ length: 12 }, () => 'floor'),
    ),
  }

  describe('hasLineOfSight', () => {
    it('returns true for clear path', () => {
      expect(hasLineOfSight({ x: 0, y: 0 }, { x: 5, y: 0 }, mockMap)).toBe(true)
      expect(hasLineOfSight({ x: 0, y: 0 }, { x: 5, y: 5 }, mockMap)).toBe(true)
    })

    it('returns false if blocked by wall', () => {
      const wallMap = {
        ...mockMap,
        tiles: mockMap.tiles.map((row) => [...row]),
      }
      wallMap.tiles[0][2] = 'wall'
      expect(hasLineOfSight({ x: 0, y: 0 }, { x: 5, y: 0 }, wallMap)).toBe(
        false,
      )
    })

    it('returns true if wall is at start or end position (units occupy tiles)', () => {
      const wallMap = {
        ...mockMap,
        tiles: mockMap.tiles.map((row) => [...row]),
      }
      wallMap.tiles[0][0] = 'wall'
      wallMap.tiles[0][5] = 'wall'
      expect(hasLineOfSight({ x: 0, y: 0 }, { x: 5, y: 0 }, wallMap)).toBe(true)
    })
  })

  describe('getPositionMultiplier', () => {
    it('correctly identifies front, flank, and rear for North facing', () => {
      const defender = { x: 5, y: 5 }
      const dir = 'N'
      expect(getPositionMultiplier({ x: 5, y: 4 }, defender, dir).zone).toBe(
        'front',
      )
      expect(getPositionMultiplier({ x: 5, y: 6 }, defender, dir).zone).toBe(
        'rear',
      )
      expect(getPositionMultiplier({ x: 4, y: 5 }, defender, dir).zone).toBe(
        'flank',
      )
      expect(getPositionMultiplier({ x: 6, y: 5 }, defender, dir).zone).toBe(
        'flank',
      )
    })

    it('returns correct multipliers', () => {
      const defender = { x: 5, y: 5 }
      expect(
        getPositionMultiplier({ x: 5, y: 4 }, defender, 'N').multiplier,
      ).toBe(1.0)
      expect(
        getPositionMultiplier({ x: 4, y: 5 }, defender, 'N').multiplier,
      ).toBe(1.25)
      expect(
        getPositionMultiplier({ x: 5, y: 6 }, defender, 'N').multiplier,
      ).toBe(1.5)
    })
  })

  describe('isInRange', () => {
    it('validates basic range', () => {
      expect(isInRange({ x: 0, y: 0 }, { x: 2, y: 0 }, 2, false)).toBe(true)
      expect(isInRange({ x: 0, y: 0 }, { x: 2, y: 1 }, 2, false)).toBe(false)
    })

    it('applies elevation bonus', () => {
      expect(isInRange({ x: 0, y: 0 }, { x: 2, y: 1 }, 2, true)).toBe(true)
      expect(isInRange({ x: 0, y: 0 }, { x: 3, y: 1 }, 2, true)).toBe(false)
    })
  })

  describe('calculateDamage', () => {
    it('applies basic damage', () => {
      const attacker = { type: 'A' as const, atk: 20, x: 0, y: 0 }
      const defender = {
        type: 'S' as const,
        x: 2,
        y: 0,
        direction: 'E' as const,
      }
      // Attacker at (0,0) is west of defender at (2,0) facing East -> Rear
      const result = calculateDamage(attacker, defender, false)
      expect(result.damage).toBe(30) // 20 * 1.5
      expect(result.zone).toBe('rear')
    })

    it('applies Knight shield and elevation bonus', () => {
      const attacker = { type: 'A' as const, atk: 20, x: 0, y: 0 }
      const defender = {
        type: 'K' as const,
        x: 0,
        y: 2,
        direction: 'N' as const,
      }
      // Attacker (0,0) is North of defender (0,2) facing North -> Frontal
      // Knight frontal shield (0.8) + High ground (+10)
      const result = calculateDamage(attacker, defender, true)
      expect(result.damage).toBe(26) // floor(20 * 1.0 * 0.8) + 10 = 16 + 10
      expect(result.shieldApplied).toBe(true)
    })
  })

  describe('getScannedHostiles', () => {
    const units: Array<{ type: string; ownerId: string }> = [
      { type: 'K', ownerId: 'p2' },
      { type: 'A', ownerId: 'p2' },
      { type: 'S', ownerId: 'p2' }, // Hostile Scout (Hidden)
      { type: 'M', ownerId: 'p1' }, // Friendly (Ignored)
    ]

    it('returns hostiles but excludes Scouts', () => {
      const result = getScannedHostiles(units, 'p1')
      expect(result).toHaveLength(2)
      expect(result.some((u) => u.type === 'K')).toBe(true)
      expect(result.some((u) => u.type === 'A')).toBe(true)
      expect(result.some((u) => u.type === 'S')).toBe(false)
    })
  })
})
