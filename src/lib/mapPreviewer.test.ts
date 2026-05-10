import { describe, expect, it } from 'bun:test'
import { renderMapAscii } from './mapPreviewer'
import { PRESET_MAPS } from './mapPresets'

describe('renderMapAscii', () => {
  const presetNames = ['grid', 'maze', 'ridge']

  for (const name of presetNames) {
    describe(`${PRESET_MAPS[name].name}`, () => {
      const map = PRESET_MAPS[name]
      const output = renderMapAscii(map)

      it('returns a string', () => {
        expect(typeof output).toBe('string')
      })

      it('returns 12 rows of 12 characters each', () => {
        const rows = output.trim().split('\n')
        expect(rows).toHaveLength(12)
        for (const row of rows) {
          expect(row).toHaveLength(12)
        }
      })

      it('uses only valid ASCII characters (. # ^)', () => {
        const rows = output.trim().split('\n')
        for (const row of rows) {
          for (const char of row) {
            expect(['.', '#', '^']).toContain(char)
          }
        }
      })

      it('maps floor to `.`, wall to `#`, high ground to `^`', () => {
        const rows = output.trim().split('\n')
        for (let y = 0; y < 12; y++) {
          for (let x = 0; x < 12; x++) {
            const expectedChar =
              map.tiles[y][x] === 'floor'
                ? '.'
                : map.tiles[y][x] === 'wall'
                  ? '#'
                  : '^'
            expect(rows[y][x]).toBe(expectedChar)
          }
        }
      })
    })
  }

  it('returns different ASCII for different presets', () => {
    const gridOutput = renderMapAscii(PRESET_MAPS.grid)
    const mazeOutput = renderMapAscii(PRESET_MAPS.maze)
    const ridgeOutput = renderMapAscii(PRESET_MAPS.ridge)
    expect(gridOutput).not.toBe(mazeOutput)
    expect(mazeOutput).not.toBe(ridgeOutput)
    expect(gridOutput).not.toBe(ridgeOutput)
  })
})
