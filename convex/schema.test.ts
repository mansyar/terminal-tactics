import { describe, expect, it } from 'bun:test'
import schema from './schema'

describe('Convex Schema', () => {
  describe('games table', () => {
    it('includes mapPreset as optional string field', () => {
      const gamesTable = (schema as any).tables?.games
      expect(gamesTable).toBeDefined()

      // The schema validator should allow mapPreset in documents
      const fields = gamesTable?.validator?.fields ?? gamesTable?.fields ?? {}
      const mapPreset = fields.mapPreset
      expect(mapPreset).toBeDefined()
    })
  })

  describe('units table', () => {
    it('includes engineerWallCount as optional number field', () => {
      const unitsTable = (schema as any).tables?.units
      expect(unitsTable).toBeDefined()

      const fields = unitsTable?.validator?.fields ?? unitsTable?.fields ?? {}
      const engineerWallCount = fields.engineerWallCount
      expect(engineerWallCount).toBeDefined()
    })

    it('includes sniperMovedThisTurn as optional boolean field', () => {
      const unitsTable = (schema as any).tables?.units
      expect(unitsTable).toBeDefined()

      const fields = unitsTable?.validator?.fields ?? unitsTable?.fields ?? {}
      const sniperMovedThisTurn = fields.sniperMovedThisTurn
      expect(sniperMovedThisTurn).toBeDefined()
    })
  })
})
