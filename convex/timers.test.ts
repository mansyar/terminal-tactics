import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  checkDisconnectGracePeriod,
  checkTurnTimeout,
  getRemainingGraceTime,
} from './timers'

// ---------------------------------------------------------------------------
// Mutable mock for chained Convex db queries
// ---------------------------------------------------------------------------
const collectorFns = {
  getResult: null as any,
  collectResult: [] as Array<any>,
  filterCollectResult: [] as Array<any>,
}

function freshMockDb() {
  return {
    db: {
      query: mock(() => ({
        withIndex: mock(() => ({
          collect: mock(() => collectorFns.collectResult),
          order: mock(() => ({
            collect: mock(() => []),
          })),
          filter: mock(() => ({
            collect: mock(() => collectorFns.filterCollectResult),
            first: mock(() => null),
          })),
        })),
        collect: mock(() => collectorFns.collectResult),
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
  collectorFns.getResult = null
  collectorFns.collectResult = []
  collectorFns.filterCollectResult = []
  mockDb = freshMockDb().db
})

// ===========================================================================
// checkDisconnectGracePeriod
// ===========================================================================
describe('checkDisconnectGracePeriod', () => {
  const baseGame = {
    _id: 'g1',
    status: 'playing',
    p1: 'user1',
    p2: 'user2',
    turnNum: 5,
    currentPlayer: 'p1',
    p1Status: 'disconnected',
    p2Status: 'connected',
    disconnectStartTime: 1000,
    turnStartTime: 500,
  }

  test('auto-forfeits disconnected player after 2-minute grace period', async () => {
    const now = 1000 + 121_000 // 121s after disconnect (past 2min)
    collectorFns.getResult = { ...baseGame }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        status: 'finished',
        winner: 'user2', // P2 (connected player) wins
      }),
    )
  })

  test('does NOT forfeit within grace period', async () => {
    const now = 1000 + 60_000 // 60s after disconnect (within 2min)
    collectorFns.getResult = { ...baseGame }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('reconnection before grace expiry prevents forfeit', async () => {
    const now = 1000 + 60_000 // 60s after disconnect
    collectorFns.getResult = {
      ...baseGame,
      p1Status: 'connected', // Reconnected
      disconnectStartTime: undefined, // Grace cleared
    }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('connected player cannot be auto-forfeited', async () => {
    const now = 1000 + 121_000
    collectorFns.getResult = {
      ...baseGame,
      p1Status: 'connected', // P1 is connected
      p2Status: 'connected', // P2 is connected
    }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('dual-disconnect results in draw (no winner)', async () => {
    const now = 1000 + 121_000
    collectorFns.getResult = {
      ...baseGame,
      p1Status: 'disconnected',
      p2Status: 'disconnected', // Both disconnected
      disconnectStartTime: 1000,
    }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        status: 'finished',
        winner: undefined, // Draw
      }),
    )
  })

  test('sleep/wake scenario: heartbeat after 40s gap resumes before grace expiry', async () => {
    const now = 1000 + 40_000 // 40s after disconnect (well within 2min)
    collectorFns.getResult = {
      ...baseGame,
      p1Status: 'connected', // Already reconnected via heartbeat
      disconnectStartTime: 1000, // But grace timer not yet cleared
    }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).not.toHaveBeenCalled() // Should not forfeit
  })

  test('does nothing for non-playing game', async () => {
    const now = 1000 + 121_000
    collectorFns.getResult = {
      ...baseGame,
      status: 'lobby',
    }

    await (checkDisconnectGracePeriod as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// Timer Pause: checkTurnTimeout skips when disconnected player's turn
// ===========================================================================
describe('checkTurnTimeout (with disconnect pause)', () => {
  const baseGame = {
    _id: 'g1',
    status: 'playing',
    p1: 'user1',
    p2: 'user2',
    turnNum: 5,
    currentPlayer: 'p1',
    p1Status: 'disconnected',
    p2Status: 'connected',
    turnStartTime: 500,
  }

  test('does NOT advance turn when current player is disconnected (timer pause)', async () => {
    const now = 500 + 100_000 // 100s elapsed (past 95s threshold)
    collectorFns.getResult = { ...baseGame }

    await (checkTurnTimeout as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).not.toHaveBeenCalled() // Timer paused
  })

  test('DOES advance turn when current player is connected (normal behavior)', async () => {
    const now = 500 + 100_000
    collectorFns.getResult = {
      ...baseGame,
      p1Status: 'connected', // P1 is connected
    }
    collectorFns.filterCollectResult = [] // No units to restore

    await (checkTurnTimeout as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        currentPlayer: 'p2',
        turnNum: 6,
      }),
    )
  })

  test('DOES advance when opponent is disconnected but current player is connected', async () => {
    const now = 500 + 100_000
    collectorFns.getResult = {
      ...baseGame,
      currentPlayer: 'p2', // P2 is the current player
      p1Status: 'disconnected', // P1 is disconnected
      p2Status: 'connected', // P2 is connected
    }
    collectorFns.filterCollectResult = []

    await (checkTurnTimeout as any)._handler(mockCtx(), {
      gameId: 'g1',
      now,
    })

    expect(mockDb.patch).toHaveBeenCalledWith(
      'g1',
      expect.objectContaining({
        currentPlayer: 'p1',
        turnNum: 6,
      }),
    )
  })
})

// ===========================================================================
// getRemainingGraceTime
// ===========================================================================
describe('getRemainingGraceTime', () => {
  test('returns remaining ms when disconnectStartTime is set', async () => {
    collectorFns.getResult = {
      _id: 'g1',
      disconnectStartTime: 1000,
      p1Status: 'disconnected',
      p2Status: 'connected',
    }

    const result = await (getRemainingGraceTime as any)._handler(mockCtx(), {
      gameId: 'g1',
      now: 1000 + 60_000, // 60s elapsed
    })

    expect(result).toBe(120_000 - 60_000) // 60s remaining
  })

  test('returns 0 when grace has expired', async () => {
    collectorFns.getResult = {
      _id: 'g1',
      disconnectStartTime: 1000,
      p1Status: 'disconnected',
      p2Status: 'connected',
    }

    const result = await (getRemainingGraceTime as any)._handler(mockCtx(), {
      gameId: 'g1',
      now: 1000 + 121_000,
    })

    expect(result).toBe(0)
  })

  test('returns null when there is no disconnect', async () => {
    collectorFns.getResult = {
      _id: 'g1',
      disconnectStartTime: undefined,
    }

    const result = await (getRemainingGraceTime as any)._handler(mockCtx(), {
      gameId: 'g1',
      now: Date.now(),
    })

    expect(result).toBeNull()
  })
})
