import { describe, expect, it } from 'bun:test'
import { isValidMove } from './movementValidator'
import type { MapData } from './mapGenerator'

describe('movementValidator', () => {
  const mockMap: MapData = {
    width: 12,
    height: 12,
    tiles: Array.from({ length: 12 }, () =>
      Array.from({ length: 12 }, () => 'floor'),
    ),
  }
  // Add a wall at 5,5
  mockMap.tiles[5][5] = 'wall'

  const mockUnits = [
    { _id: 'u1', ownerId: 'p1', x: 2, y: 2 },
    { _id: 'u2', ownerId: 'p2', x: 2, y: 3 },
  ]

  it('allows valid move within AP range', () => {
    const result = isValidMove(mockMap, mockUnits, 'u1', { x: 3, y: 2 }, 2)
    expect(result.valid).toBe(true)
  })

  it('rejects move out of AP range', () => {
    const result = isValidMove(mockMap, mockUnits, 'u1', { x: 5, y: 2 }, 2)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('INSUFFICIENT_AP')
  })

  it('rejects move into wall', () => {
    const result = isValidMove(mockMap, mockUnits, 'u1', { x: 5, y: 5 }, 4)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('OBSTRUCTED_BY_WALL')
  })

  it('rejects move into another unit', () => {
    const result = isValidMove(mockMap, mockUnits, 'u1', { x: 2, y: 3 }, 2)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('OBSTRUCTED_BY_UNIT')
  })

  it('rejects move out of bounds', () => {
    const result = isValidMove(mockMap, mockUnits, 'u1', { x: -1, y: 2 }, 2)
    expect(result.valid).toBe(false)
    expect(result.reason).toBe('OUT_OF_BOUNDS')
  })
})
