import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  getGameState,
  logCommandHandler,
  getFilteredLogsHandler,
  endTurn,
} from './game'

// ---------------------------------------------------------------------------
// Mutable mock for chained Convex db queries.
// Each test sets collectorFns.* to the desired return value.
// ---------------------------------------------------------------------------
const collectorFns = {
  getResult: null as any,
  collectResult: [] as any[],
  orderCollectResult: [] as any[],
  filterCollectResult: [] as any[],
}

function freshMockDb() {
  // Each call to these mints new mock functions so the "not.toHaveBeenCalled"
  // assertions in beforeEach isolation are reliable.
  return {
    db: {
      query: mock(() => ({
        withIndex: mock(() => ({
          collect: mock(() => collectorFns.collectResult),
          order: mock(() => ({
            collect: mock(() => collectorFns.orderCollectResult),
          })),
          filter: mock(() => ({
            collect: mock(() => collectorFns.filterCollectResult),
          })),
        })),
      })),
      insert: mock(() => 'mock-id'),
      patch: mock(() => {}),
      get: mock(() => collectorFns.getResult),
    },
  }
}

let mockDb: ReturnType<typeof freshMockDb>['db']

const mockCtx = () => ({ db: mockDb }) as any

beforeEach(() => {
  // Reset mutable state
  collectorFns.getResult = null
  collectorFns.collectResult = []
  collectorFns.orderCollectResult = []
  collectorFns.filterCollectResult = []

  // Create fresh mockDb so call-counts start at zero
  mockDb = freshMockDb().db
})

// ===========================================================================
// getGameState
// ===========================================================================
describe('getGameState', () => {
  test('returns null when no gameId is provided', async () => {
    const result = await (getGameState as any)._handler(mockCtx(), {
      gameId: undefined,
    })

    expect(result).toBeNull()
    expect(mockDb.get).not.toHaveBeenCalled()
  })

  test('returns null when game is not found', async () => {
    // getResult already null
    const result = await (getGameState as any)._handler(mockCtx(), {
      gameId: 'game123' as any,
    })

    expect(result).toBeNull()
    expect(mockDb.get).toHaveBeenCalledWith('game123')
  })

  test('returns game with units when found', async () => {
    collectorFns.getResult = {
      _id: 'game456',
      turnNum: 3,
      currentPlayer: 'p1',
      status: 'playing',
      environmentFlags: [],
      mapData: {},
      isPublic: true,
    }
    collectorFns.collectResult = [
      { _id: 'unit1', ownerId: 'p1', type: 'K' },
      { _id: 'unit2', ownerId: 'p2', type: 'S' },
    ]

    const result = await (getGameState as any)._handler(mockCtx(), {
      gameId: 'game456' as any,
    })

    expect(result).toMatchObject({
      turnNum: 3,
      currentPlayer: 'p1',
      units: expect.arrayContaining([
        expect.objectContaining({ _id: 'unit1' }),
        expect.objectContaining({ _id: 'unit2' }),
      ]),
    })
    expect(mockDb.get).toHaveBeenCalledWith('game456')
    expect(mockDb.query).toHaveBeenCalledWith('units')
  })
})

// ===========================================================================
// logCommandHandler (standalone function – callable directly)
// ===========================================================================
describe('logCommandHandler', () => {
  test('inserts a log entry with the correct fields', async () => {
    await logCommandHandler(mockCtx(), {
      gameId: 'g1',
      playerId: 'p1',
      command: 'MOVE 3,5',
      result: 'OK',
    })

    expect(mockDb.insert).toHaveBeenCalledTimes(1)
    expect(mockDb.insert).toHaveBeenCalledWith(
      'logs',
      expect.objectContaining({
        gameId: 'g1',
        playerId: 'p1',
        commandString: 'MOVE 3,5',
        result: 'OK',
      }),
    )
  })

  test('inserts a log entry with a private visibility field', async () => {
    await logCommandHandler(mockCtx(), {
      gameId: 'g1',
      playerId: 'p2',
      command: 'ATTACK 4,2',
      result: 'HIT',
      visibility: 'private',
    })

    expect(mockDb.insert).toHaveBeenCalledWith(
      'logs',
      expect.objectContaining({
        visibility: 'private',
      }),
    )
  })
})

// ===========================================================================
// getFilteredLogsHandler (standalone function – callable directly)
// ===========================================================================
describe('getFilteredLogsHandler', () => {
  const publicLog = {
    gameId: 'g1',
    playerId: 'p1',
    commandString: 'MOVE',
    result: 'OK',
    visibility: 'public',
    timestamp: 100,
  }
  const p1PrivateLog = {
    gameId: 'g1',
    playerId: 'p1',
    commandString: 'SCAN',
    result: 'ENEMY_FOUND',
    visibility: 'private',
    timestamp: 200,
  }
  const p2PrivateLog = {
    gameId: 'g1',
    playerId: 'p2',
    commandString: 'DEPLOY',
    result: 'OK',
    visibility: 'private',
    timestamp: 300,
  }

  test('returns public logs for all players', async () => {
    collectorFns.orderCollectResult = [publicLog, p1PrivateLog, p2PrivateLog]

    const result = await getFilteredLogsHandler(mockCtx(), {
      gameId: 'g1',
      playerId: 'p1',
    })

    expect(result).toContainEqual(publicLog)
    expect(result).toContainEqual(p1PrivateLog)
    expect(result).not.toContainEqual(p2PrivateLog)
  })

  test('includes private logs belonging to the requesting player', async () => {
    collectorFns.orderCollectResult = [p1PrivateLog, p2PrivateLog]

    const result = await getFilteredLogsHandler(mockCtx(), {
      gameId: 'g1',
      playerId: 'p1',
    })

    expect(result).toContainEqual(p1PrivateLog)
    expect(result).not.toContainEqual(p2PrivateLog)
  })

  test('excludes private logs from other players', async () => {
    collectorFns.orderCollectResult = [p1PrivateLog, p2PrivateLog]

    const result = await getFilteredLogsHandler(mockCtx(), {
      gameId: 'g1',
      playerId: 'p2',
    })

    expect(result).not.toContainEqual(p1PrivateLog)
    expect(result).toContainEqual(p2PrivateLog)
  })
})

// ===========================================================================
// endTurn
// ===========================================================================
describe('endTurn', () => {
  const baseGame = {
    _id: 'g1',
    turnNum: 1,
    currentPlayer: 'p1',
    status: 'playing',
    p1: 'user1',
    p2: 'user2',
    environmentFlags: [],
    mapData: {},
    isPublic: true,
  }

  test('throws error for wrong player', async () => {
    collectorFns.getResult = baseGame

    const promise = (endTurn as any)._handler(mockCtx(), {
      gameId: 'g1',
      playerId: 'user2',
    })

    await expect(promise).rejects.toThrow('NOT_YOUR_TURN')
    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('advances turn number and switches current player', async () => {
    collectorFns.getResult = baseGame
    collectorFns.filterCollectResult = [
      {
        _id: 'u1',
        ownerId: 'p2',
        type: 'K',
        ap: 0,
        maxAp: 2,
        isStealthed: false,
      },
    ]

    await (endTurn as any)._handler(mockCtx(), {
      gameId: 'g1',
      playerId: 'user1',
    })

    // Game patched with switched player and incremented turn
    expect(mockDb.patch).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        currentPlayer: 'p2',
        turnNum: 2,
      }),
    )

    // Next player's unit received AP restore
    expect(mockDb.patch).toHaveBeenCalledWith('u1', { ap: 2 })
  })
})
