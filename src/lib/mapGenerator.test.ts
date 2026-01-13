import { describe, expect, it } from 'bun:test'
import { generateMap } from './mapGenerator'

describe('mapGenerator', () => {
  it('generates a map with correct dimensions', () => {
    const map = generateMap(12, 12)
    expect(map.width).toBe(12)
    expect(map.height).toBe(12)
    expect(map.tiles.length).toBe(12)
    expect(map.tiles[0].length).toBe(12)
  })

  it('keeps spawn zones clear of walls', () => {
    const map = generateMap(12, 12)
    // P1 spawn (bottom rows 0, 1 in our 0-indexed logic)
    // Actually the generator used 0,1 and height-1, height-2
    // Let's verify those
    for (let x = 0; x < 12; x++) {
      expect(map.tiles[0][x]).toBe('floor')
      expect(map.tiles[1][x]).toBe('floor')
      expect(map.tiles[10][x]).toBe('floor')
      expect(map.tiles[11][x]).toBe('floor')
    }
  })

  it('contains some highground', () => {
    // This is probabilistic but with 12x12 and 10% chance it should almost always have one
    // unless the random seed is very unlucky.
    let hasHighground = false
    for (let i = 0; i < 10; i++) {
      const map = generateMap(12, 12)
      if (map.tiles.flat().includes('highground')) {
        hasHighground = true
        break
      }
    }
    expect(hasHighground).toBe(true)
  })
})
