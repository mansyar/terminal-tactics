import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { UNIT_TEMPLATES } from '../src/lib/unitTemplates'
import { submitDraft } from './squadBuilder'

const mockDb = {
  get: mock(() => null),
  patch: mock(() => {}),
}

const mockCtx = { db: mockDb } as any

describe('squadBuilding logic', () => {
  beforeEach(() => {
    mockDb.get.mockClear()
    mockDb.patch.mockClear()
  })

  it('has valid template costs', () => {
    expect(UNIT_TEMPLATES['K'].cost).toBe(300)
    expect(UNIT_TEMPLATES['A'].cost).toBe(200)
    expect(UNIT_TEMPLATES['S'].cost).toBe(150)
    expect(UNIT_TEMPLATES['M'].cost).toBe(250)
  })

  it('calculates squad budget correctly for a full squad', () => {
    const squad = ['K', 'K', 'A', 'S', 'S']
    const total = squad.reduce(
      (sum, type) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // 300+300+200+150+150 = 1100
    expect(total).toBe(1100)
    expect(total > 1000).toBe(true) // Should be rejected
  })

  it('allows a valid 1000cr budget squad', () => {
    const squad = ['K', 'K', 'A', 'A']
    const total = squad.reduce(
      (sum, type) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // 300+300+200+200 = 1000
    expect(total).toBe(1000)
    expect(total <= 1000).toBe(true)
  })

  describe('submitDraft', () => {
    it('throws error when game is not in drafting state', async () => {
      ;(mockDb as any).get = mock(() => ({
        _id: 'game-1',
        status: 'lobby',
        p1: 'user_123',
        p2: 'user_456',
      }))

      const args = {
        gameId: 'game-1',
        playerId: 'user_123',
        squad: ['K', 'K', 'A', 'A'],
      }
      await expect(
        (submitDraft as any)._handler(mockCtx, args),
      ).rejects.toThrow('INVALID_GAME_STATE')
    })

    it('throws error for invalid unit type', async () => {
      ;(mockDb as any).get = mock(() => ({
        _id: 'game-1',
        status: 'drafting',
        p1: 'user_123',
        p2: 'user_456',
      }))

      const args = {
        gameId: 'game-1',
        playerId: 'user_123',
        squad: ['X', 'K', 'A'],
      }
      await expect(
        (submitDraft as any)._handler(mockCtx, args),
      ).rejects.toThrow('INVALID_UNIT_TYPE')
    })

    it('throws error for exceeding budget', async () => {
      ;(mockDb as any).get = mock(() => ({
        _id: 'game-1',
        status: 'drafting',
        p1: 'user_123',
        p2: 'user_456',
      }))

      // K(300) + K(300) + K(300) + S(150) + S(150) = 1200 > 1000
      const args = {
        gameId: 'game-1',
        playerId: 'user_123',
        squad: ['K', 'K', 'K', 'S', 'S'],
      }
      await expect(
        (submitDraft as any)._handler(mockCtx, args),
      ).rejects.toThrow('BUDGET_EXCEEDED')
    })

    it('throws error when player is not part of the game', async () => {
      ;(mockDb as any).get = mock(() => ({
        _id: 'game-1',
        status: 'drafting',
        p1: 'user_123',
        p2: 'user_456',
      }))

      const args = {
        gameId: 'game-1',
        playerId: 'user_999',
        squad: ['K', 'K', 'A', 'A'],
      }
      await expect(
        (submitDraft as any)._handler(mockCtx, args),
      ).rejects.toThrow('NOT_A_PLAYER')
    })

    it('updates p1Squad correctly for p1 player', async () => {
      let getCalls = 0
      ;(mockDb as any).get = mock(() => {
        getCalls++
        if (getCalls === 1) {
          return {
            _id: 'game-1',
            status: 'drafting',
            p1: 'user_123',
            p2: 'user_456',
          }
        }
        return {
          _id: 'game-1',
          status: 'drafting',
          p1: 'user_123',
          p2: 'user_456',
          p1Squad: ['K', 'K', 'A', 'A'],
        }
      })

      const args = {
        gameId: 'game-1',
        playerId: 'user_123',
        squad: ['K', 'K', 'A', 'A'],
      }
      await (submitDraft as any)._handler(mockCtx, args)

      expect(mockDb.patch).toHaveBeenCalledWith('game-1', {
        p1Squad: ['K', 'K', 'A', 'A'],
      })
    })
  })
})
