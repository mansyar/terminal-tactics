import { describe, expect, it, mock } from 'bun:test'
import { buildWallHandler, demolishWallHandler } from './engineer'

// ---------------------------------------------------------------------------
// Helper: create a mock game with full 12x12 floor tiles
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Helper: create a mock context with specific game/unit returns
// ---------------------------------------------------------------------------
function makeMockCtx(game: any, unit: any, otherUnits: Array<any> = []) {
  return {
    db: {
      get: mock(async (id: string) => {
        if (id === game?._id) return game
        if (id === unit?._id) return unit
        return null
      }),
      patch: mock(() => {}),
      query: mock(() => ({
        withIndex: mock(() => ({
          collect: mock(() => otherUnits),
        })),
      })),
    },
  }
}

const ENGINEER_UNIT = {
  _id: 'unit-e1',
  gameId: 'game-1',
  ownerId: 'p1',
  type: 'E',
  x: 4,
  y: 5,
  ap: 3,
  engineerWallCount: 1,
}

const KNIGHT_UNIT = {
  _id: 'unit-k1',
  gameId: 'game-1',
  ownerId: 'p1',
  type: 'K',
  x: 4,
  y: 5,
  ap: 3,
}

describe('Engineer - buildWallHandler', () => {
  it('rejects build when game is not found', async () => {
    const ctx = makeMockCtx(null, ENGINEER_UNIT)
    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'nonexistent',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('INVALID_GAME_STATE')
  })

  it('accepts build on valid adjacent floor coordinate', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    const result = await (buildWallHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      unitId: 'unit-e1',
      targetX: 4,
      targetY: 6, // South-adjacent to Engineer at (4,5)
    })

    expect(result).toEqual({ success: true })
    // Should patch mapData to set the wall
    const patchCall = ctx.db.patch.mock.calls.find(
      (call: any) => call[0] === 'game-1',
    )
    expect(patchCall).toBeDefined()
    const mapData = (patchCall as any)[1].mapData
    expect(mapData.tiles[6][4]).toBe('wall')
  })

  it('rejects build on non-adjacent tile', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 6, // Too far (Manhattan dist > 1)
        targetY: 5,
      }),
    ).rejects.toThrow('NOT_ADJACENT')
  })

  it('rejects build on existing wall tile', async () => {
    const game = makeFloorGame()
    game.mapData.tiles[4][4] = 'wall' // North-adjacent to Engineer at (4,5)
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 4, // North-adjacent but is a wall
      }),
    ).rejects.toThrow('INVALID_TARGET_TILE')
  })

  it('rejects build on occupied tile', async () => {
    const game = makeFloorGame()
    const otherUnit = { _id: 'unit-o1', x: 4, y: 6, ownerId: 'p2', type: 'K' }
    const ctx = makeMockCtx(game, ENGINEER_UNIT, [otherUnit])

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6, // South-adjacent but occupied
      }),
    ).rejects.toThrow('TILE_OCCUPIED')
  })

  it('rejects build when Engineer has used its 1 build (engineerWallCount = 0)', async () => {
    const game = makeFloorGame()
    const spentEngineer = { ...ENGINEER_UNIT, engineerWallCount: 0 }
    const ctx = makeMockCtx(game, spentEngineer)

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NO_BUILDS_REMAINING')
  })

  it('accepts build again after demolish (reusable)', async () => {
    const game = makeFloorGame()
    const reusableEngineer = { ...ENGINEER_UNIT, engineerWallCount: 1 }
    const ctx = makeMockCtx(game, reusableEngineer)

    const result = await (buildWallHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      unitId: 'unit-e1',
      targetX: 4,
      targetY: 6,
    })

    expect(result).toEqual({ success: true })
  })

  it('rejects build for non-Engineer units', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, KNIGHT_UNIT)

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-k1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NOT_AN_ENGINEER')
  })

  it('rejects build when not your turn', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'wrong_user',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NOT_YOUR_TURN')
  })

  it('rejects build with insufficient AP', async () => {
    const game = makeFloorGame()
    const noApEngineer = { ...ENGINEER_UNIT, ap: 0 }
    const ctx = makeMockCtx(game, noApEngineer)

    await expect(
      (buildWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('INSUFFICIENT_AP')
  })
})

describe('Engineer - demolishWallHandler', () => {
  it('rejects demolish on non-wall tile', async () => {
    const game = makeFloorGame() // All floor tiles — no wall to demolish
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    await expect(
      (demolishWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6, // Floor tile
      }),
    ).rejects.toThrow('NOT_A_WALL')
  })

  it('accepts demolish on adjacent wall tile and restores engineerWallCount', async () => {
    const game = makeFloorGame()
    game.mapData.tiles[6][4] = 'wall' // Target is a wall
    const usedEngineer = { ...ENGINEER_UNIT, engineerWallCount: 0 }
    const ctx = makeMockCtx(game, usedEngineer)

    const result = await (demolishWallHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      unitId: 'unit-e1',
      targetX: 4,
      targetY: 6, // South-adjacent wall
    })

    expect(result).toEqual({ success: true })

    // Should restore engineerWallCount
    const patchCall = ctx.db.patch.mock.calls.find(
      (call: any) => call[0] === 'unit-e1',
    )
    expect(patchCall).toBeDefined()
    expect((patchCall as any)[1].engineerWallCount).toBe(1)

    // Should set tile back to floor
    const gamePatch = ctx.db.patch.mock.calls.find(
      (call: any) => call[0] === 'game-1',
    )
    expect(gamePatch).toBeDefined()
    expect((gamePatch as any)[1].mapData.tiles[6][4]).toBe('floor')
  })

  it('rejects demolish on non-adjacent tile', async () => {
    const game = makeFloorGame()
    game.mapData.tiles[5][6] = 'wall' // Wall exists but not adjacent
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    await expect(
      (demolishWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 5,
        targetY: 6, // Too far
      }),
    ).rejects.toThrow('NOT_ADJACENT')
  })

  it('rejects demolish for non-Engineer units', async () => {
    const game = makeFloorGame()
    const ctx = makeMockCtx(game, KNIGHT_UNIT)

    await expect(
      (demolishWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-k1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NOT_AN_ENGINEER')
  })

  it('rejects demolish when not your turn', async () => {
    const game = makeFloorGame()
    game.mapData.tiles[6][4] = 'wall'
    const ctx = makeMockCtx(game, ENGINEER_UNIT)

    await expect(
      (demolishWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'wrong_user',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('NOT_YOUR_TURN')
  })

  it('rejects demolish with insufficient AP', async () => {
    const game = makeFloorGame()
    game.mapData.tiles[6][4] = 'wall'
    const noApEngineer = { ...ENGINEER_UNIT, ap: 0 }
    const ctx = makeMockCtx(game, noApEngineer)

    await expect(
      (demolishWallHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        unitId: 'unit-e1',
        targetX: 4,
        targetY: 6,
      }),
    ).rejects.toThrow('INSUFFICIENT_AP')
  })
})
