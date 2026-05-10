import { describe, expect, it } from 'bun:test'
import { PRESET_MAPS } from './mapPresets'
import type { TileType } from './mapPresets'

describe('PRESET_MAPS', () => {
  const presetNames = ['grid', 'maze', 'ridge']

  for (const name of presetNames) {
    describe(`${PRESET_MAPS[name].name}`, () => {
      const map = PRESET_MAPS[name]

      it('has a valid name', () => {
        expect(map.name).toBeTruthy()
        expect(typeof map.name).toBe('string')
      })

      it('has a valid description', () => {
        expect(map.description).toBeTruthy()
        expect(typeof map.description).toBe('string')
      })

      it('is a valid 12x12 grid', () => {
        expect(map.tiles).toHaveLength(12)
        for (const row of map.tiles) {
          expect(row).toHaveLength(12)
        }
      })

      it('has all valid tile types', () => {
        const validTiles: Array<TileType> = ['floor', 'wall', 'highground']
        for (const row of map.tiles) {
          for (const tile of row) {
            expect(validTiles).toContain(tile)
          }
        }
      })

      it('has clear spawn zones (rows 0,1 and 10,11)', () => {
        // Spawn rows should have no walls or high ground
        for (let y = 0; y <= 1; y++) {
          for (let x = 0; x < 12; x++) {
            expect(map.tiles[y][x]).toBe('floor')
          }
        }
        for (let y = 10; y <= 11; y++) {
          for (let x = 0; x < 12; x++) {
            expect(map.tiles[y][x]).toBe('floor')
          }
        }
      })
    })
  }

  it('each preset has a unique layout (not identical)', () => {
    const layouts = presetNames.map((name) =>
      JSON.stringify(PRESET_MAPS[name].tiles),
    )
    // Check each pair is different
    for (let i = 0; i < layouts.length; i++) {
      for (let j = i + 1; j < layouts.length; j++) {
        expect(layouts[i]).not.toBe(layouts[j])
      }
    }
  })

  it('all 3 presets are accessible by key', () => {
    expect(PRESET_MAPS.grid).toBeDefined()
    expect(PRESET_MAPS.maze).toBeDefined()
    expect(PRESET_MAPS.ridge).toBeDefined()
  })
})
