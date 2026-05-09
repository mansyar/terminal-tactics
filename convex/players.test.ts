import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  getOrCreatePlayerHandler,
  getPlayerByUserIdHandler,
  getPlayersByUserIdsHandler,
  setHandleHandler,
} from './players'

// ---------------------------------------------------------------------------
// Mutable mock for chained Convex db queries
// ---------------------------------------------------------------------------
const collectorFns = {
  getResult: null as any,
  collectResult: [] as Array<any>,
  uniqueResult: null as any,
}

function freshMockDb() {
  return {
    db: {
      query: mock(() => ({
        withIndex: mock((_indexName: string, _predicate?: any) => ({
          unique: mock(() => collectorFns.uniqueResult),
          collect: mock(() => collectorFns.collectResult),
        })),
        collect: mock(() => collectorFns.collectResult),
      })),
      insert: mock(() => 'mock-player-id'),
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
  collectorFns.uniqueResult = null

  mockDb = freshMockDb().db
})

// ===========================================================================
// getOrCreatePlayerHandler
// ===========================================================================
describe('getOrCreatePlayerHandler', () => {
  test('creates a new player doc with auto-handle user_xxxx for new userId', async () => {
    // Simulate no existing player doc
    collectorFns.uniqueResult = null

    const result = await getOrCreatePlayerHandler(mockCtx(), {
      userId: 'user_abc123',
    })

    expect(result.userId).toBe('user_abc123')
    expect(result.handle).toMatch(/^user_[a-z0-9]+$/)
    expect(result.gamesPlayed).toBe(0)
    expect(result.wins).toBe(0)
    expect(result.losses).toBe(0)
    expect(result.draws).toBe(0)
    expect(mockDb.insert).toHaveBeenCalledWith(
      'players',
      expect.objectContaining({
        userId: 'user_abc123',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      }),
    )
  })

  test('returns existing player doc on repeat calls (idempotent)', async () => {
    const existingPlayer = {
      _id: 'player456',
      userId: 'user_abc123',
      handle: 'user_abc123',
      gamesPlayed: 5,
      wins: 3,
      losses: 2,
      draws: 0,
    }
    collectorFns.uniqueResult = existingPlayer

    const result = await getOrCreatePlayerHandler(mockCtx(), {
      userId: 'user_abc123',
    })

    expect(result).toEqual(existingPlayer)
    expect(mockDb.insert).not.toHaveBeenCalled()
  })
})

// ===========================================================================
// setHandleHandler
// ===========================================================================
describe('setHandleHandler', () => {
  test('rejects handle that is too short (< 2 chars)', async () => {
    collectorFns.uniqueResult = {
      _id: 'player1',
      userId: 'user_abc',
      handle: 'user_abc',
    }

    await expect(
      setHandleHandler(mockCtx(), {
        userId: 'user_abc',
        newHandle: 'a',
      }),
    ).rejects.toThrow('HANDLE_TOO_SHORT')
    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('rejects handle that is too long (> 20 chars)', async () => {
    collectorFns.uniqueResult = {
      _id: 'player1',
      userId: 'user_abc',
      handle: 'user_abc',
    }

    await expect(
      setHandleHandler(mockCtx(), {
        userId: 'user_abc',
        newHandle: 'a'.repeat(21),
      }),
    ).rejects.toThrow('HANDLE_TOO_LONG')
    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('rejects handle with invalid characters (non-alphanumeric, non-underscore)', async () => {
    collectorFns.uniqueResult = {
      _id: 'player1',
      userId: 'user_abc',
      handle: 'user_abc',
    }

    await expect(
      setHandleHandler(mockCtx(), {
        userId: 'user_abc',
        newHandle: 'hello world!',
      }),
    ).rejects.toThrow('HANDLE_INVALID_CHARS')
    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('rejects duplicate handle with HANDLE_TAKEN', async () => {
    // Two players: player1 (user_abc) trying to take player2's handle 'player42'
    collectorFns.collectResult = [
      {
        _id: 'player1',
        userId: 'user_abc',
        handle: 'user_abc',
        gamesPlayed: 3,
        wins: 2,
        losses: 1,
        draws: 0,
      },
      {
        _id: 'player2',
        userId: 'user_other',
        handle: 'player42',
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        draws: 0,
      },
    ]

    await expect(
      setHandleHandler(mockCtx(), {
        userId: 'user_abc',
        newHandle: 'player42',
      }),
    ).rejects.toThrow('HANDLE_TAKEN')
    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('successfully updates handle when validation passes', async () => {
    // Only one player — no collision possible
    collectorFns.collectResult = [
      {
        _id: 'player1',
        userId: 'user_abc',
        handle: 'user_abc',
        gamesPlayed: 3,
        wins: 2,
        losses: 1,
        draws: 0,
      },
    ]

    await setHandleHandler(mockCtx(), {
      userId: 'user_abc',
      newHandle: 'player42',
    })

    expect(mockDb.patch).toHaveBeenCalledWith('player1', { handle: 'player42' })
  })

  test('allows setting handle to the same value (no-op for re-set)', async () => {
    collectorFns.collectResult = [
      {
        _id: 'player1',
        userId: 'user_abc',
        handle: 'player42',
        gamesPlayed: 3,
        wins: 2,
        losses: 1,
        draws: 0,
      },
    ]

    await setHandleHandler(mockCtx(), {
      userId: 'user_abc',
      newHandle: 'player42',
    })

    // Should succeed (allowing same handle)
    expect(mockDb.patch).toHaveBeenCalled()
  })
})

// ===========================================================================
// getPlayerByUserIdHandler
// ===========================================================================
describe('getPlayerByUserIdHandler', () => {
  test('returns correct player for a given userId', async () => {
    const player = {
      _id: 'player1',
      userId: 'user_abc',
      handle: 'user_abc',
      gamesPlayed: 3,
      wins: 2,
      losses: 1,
      draws: 0,
    }
    collectorFns.uniqueResult = player

    const result = await getPlayerByUserIdHandler(mockCtx(), {
      userId: 'user_abc',
    })

    expect(result).toEqual(player)
    expect(mockDb.query).toHaveBeenCalledWith('players')
  })

  test('returns null for non-existent userId', async () => {
    collectorFns.uniqueResult = null

    const result = await getPlayerByUserIdHandler(mockCtx(), {
      userId: 'user_nonexistent',
    })

    expect(result).toBeNull()
  })
})

// ===========================================================================
// getPlayersByUserIdsHandler
// ===========================================================================
describe('getPlayersByUserIdsHandler', () => {
  test('returns a map of userId → player for batch lookup', async () => {
    const players = [
      {
        _id: 'player1',
        userId: 'user_abc',
        handle: 'player1',
        gamesPlayed: 5,
        wins: 3,
        losses: 2,
        draws: 0,
      },
      {
        _id: 'player2',
        userId: 'user_xyz',
        handle: 'player2',
        gamesPlayed: 3,
        wins: 1,
        losses: 2,
        draws: 0,
      },
    ]
    // Collect returns all players, then we filter client-side
    collectorFns.collectResult = players

    const result = await getPlayersByUserIdsHandler(mockCtx(), {
      userIds: ['user_abc', 'user_xyz', 'user_missing'],
    })

    expect(result).toHaveProperty('user_abc')
    expect(result).toHaveProperty('user_xyz')
    expect(result).not.toHaveProperty('user_missing')
    expect(result.user_abc.handle).toBe('player1')
    expect(result.user_xyz.handle).toBe('player2')
  })

  test('returns empty map for empty userIds array', async () => {
    collectorFns.collectResult = []

    const result = await getPlayersByUserIdsHandler(mockCtx(), {
      userIds: [],
    })

    expect(result).toEqual({})
  })
})
