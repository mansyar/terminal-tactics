import { describe, expect, it, mock } from 'bun:test'
import { useRallyHandler } from './commander'

function makeMockCtx(game: any, commander: any, allUnits: Array<any> = []) {
  return {
    db: {
      get: mock(async (id: string) => {
        if (id === game?._id) return game
        if (id === commander?._id) return commander
        return null
      }),
      patch: mock(() => {}),
      query: mock(() => ({
        withIndex: mock(() => ({
          collect: mock(() => allUnits),
        })),
      })),
    },
  }
}

function makeFloorGame(overrides = {}) {
  return {
    _id: 'game-1',
    status: 'playing',
    currentPlayer: 'p1',
    p1: 'user_123',
    p2: 'user_456',
    mapData: {
      tiles: Array.from({ length: 12 }, () =>
        Array.from({ length: 12 }, () => 'floor'),
      ),
    },
    ...overrides,
  }
}

const COMMANDER_UNIT = {
  _id: 'unit-c1',
  gameId: 'game-1',
  ownerId: 'p1',
  type: 'C',
  x: 4,
  y: 5,
  ap: 2,
}

const FRIENDLY_UNIT = {
  _id: 'unit-k1',
  gameId: 'game-1',
  ownerId: 'p1',
  type: 'K',
  x: 4,
  y: 6, // South-adjacent to Commander
  ap: 2,
  maxAp: 2,
}

const ENEMY_UNIT = {
  _id: 'unit-e1',
  gameId: 'game-1',
  ownerId: 'p2',
  type: 'K',
  x: 4,
  y: 6,
  ap: 2,
}

describe('Commander - useRallyHandler', () => {
  it('rejects rally when game is not found', async () => {
    const ctx = makeMockCtx(null, COMMANDER_UNIT)
    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'nonexistent',
        playerId: 'user_123',
        commanderId: 'unit-c1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('INVALID_GAME_STATE')
  })

  it('grants +1 AP to adjacent friendly unit', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, COMMANDER_UNIT, [FRIENDLY_UNIT])

    const result = await (useRallyHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      commanderId: 'unit-c1',
      targetX: 4,
      targetY: 6, // Friendly Knight at (4,6), adjacent to Commander at (4,5)
    })

    expect(result).toEqual({ success: true })
    // Target unit should have AP incremented
    const unitPatch = ctx.db.patch.mock.calls.find(
      (call: any) => call[0] === 'unit-k1',
    )
    expect(unitPatch).toBeDefined()
    expect((unitPatch as any)[1].ap).toBe(3) // 2 + 1
  })

  it('allows self-target (Commander on own tile)', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, COMMANDER_UNIT, [COMMANDER_UNIT])

    const result = await (useRallyHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      commanderId: 'unit-c1',
      targetX: 4,
      targetY: 5, // Commander's own tile
    })

    expect(result).toEqual({ success: true })
  })

  it('rejects rally on non-adjacent unit', async () => {
    const game = makeFloorGame()
    const farUnit = { ...FRIENDLY_UNIT, x: 7, y: 5 }
    const ctx = makeMockCtx(game, COMMANDER_UNIT, [farUnit])

    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        commanderId: 'unit-c1',
        targetX: 7,
        targetY: 5, // Too far (dist > 1)
      }),
    ).rejects.toThrow('NOT_ADJACENT')
  })

  it('rejects rally on enemy unit', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, COMMANDER_UNIT, [ENEMY_UNIT])

    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        commanderId: 'unit-c1',
        targetX: 4,
        targetY: 6, // Enemy unit
      }),
    ).rejects.toThrow('NOT_YOUR_UNIT')
  })

  it('rejects rally for non-Commander units', async () => {
    const game = makeFloorGame()
    const knight = { ...COMMANDER_UNIT, type: 'K' }
    const ctx = makeMockCtx(game, knight, [FRIENDLY_UNIT])

    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        commanderId: 'unit-c1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NOT_A_COMMANDER')
  })

  it('rejects rally when not your turn', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, COMMANDER_UNIT)

    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'wrong_user',
        commanderId: 'unit-c1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NOT_YOUR_TURN')
  })

  it('rejects rally with insufficient AP', async () => {
    const game = makeFloorGame()
    const noApCommander = { ...COMMANDER_UNIT, ap: 0 }
    const ctx = makeMockCtx(game, noApCommander, [FRIENDLY_UNIT])

    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        commanderId: 'unit-c1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('INSUFFICIENT_AP')
  })

  it('rejects rally on empty tile (no unit)', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, COMMANDER_UNIT, [])

    await expect(
      (useRallyHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        commanderId: 'unit-c1',
        targetX: 4,
        targetY: 6, // No unit here
      }),
    ).rejects.toThrow('NO_UNIT_AT_TARGET')
  })
})
