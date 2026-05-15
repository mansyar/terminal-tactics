import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  getMatchHistoryHandler,
  getOrCreatePlayerHandler,
  getPlayerByUserIdHandler,
  getPlayerStatsHandler,
  getPlayersByUserIdsHandler,
  recordGameEndHandler,
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

// ===========================================================================
// recordGameEndHandler
// ===========================================================================
describe('recordGameEndHandler', () => {
  const baseArgs = {
    gameId: 'game123' as any,
    p1Id: 'user_p1',
    p2Id: 'user_p2',
    endReason: 'elimination',
    turns: 12,
    duration: 450000,
  }

  test('increments winner wins and loser losses for P1 win', async () => {
    collectorFns.collectResult = [
      {
        _id: 'p1',
        userId: 'user_p1',
        handle: 'neon_ninja',
        gamesPlayed: 4,
        wins: 3,
        losses: 1,
        draws: 0,
      },
      {
        _id: 'p2',
        userId: 'user_p2',
        handle: 'shadow_ops',
        gamesPlayed: 2,
        wins: 1,
        losses: 0,
        draws: 1,
      },
    ]

    await recordGameEndHandler(mockCtx(), {
      ...baseArgs,
      winner: 'p1',
    })

    // Patch only sends changed fields (not unchanging ones like draws)
    expect(mockDb.patch).toHaveBeenCalledWith('p1', { gamesPlayed: 5, wins: 4 })
    expect(mockDb.patch).toHaveBeenCalledWith('p2', {
      gamesPlayed: 3,
      losses: 1,
    })
  })

  test('increments winner wins and loser losses for P2 win', async () => {
    collectorFns.collectResult = [
      {
        _id: 'p1',
        userId: 'user_p1',
        handle: 'neon_ninja',
        gamesPlayed: 1,
        wins: 1,
        losses: 0,
        draws: 0,
      },
      {
        _id: 'p2',
        userId: 'user_p2',
        handle: 'shadow_ops',
        gamesPlayed: 1,
        wins: 0,
        losses: 1,
        draws: 0,
      },
    ]

    await recordGameEndHandler(mockCtx(), {
      ...baseArgs,
      winner: 'p2',
    })

    expect(mockDb.patch).toHaveBeenCalledWith('p1', {
      gamesPlayed: 2,
      losses: 1,
    })
    expect(mockDb.patch).toHaveBeenCalledWith('p2', { gamesPlayed: 2, wins: 1 })
  })

  test('records draw correctly (no winner, both get +1 draws)', async () => {
    collectorFns.collectResult = [
      {
        _id: 'p1',
        userId: 'user_p1',
        handle: 'neon_ninja',
        gamesPlayed: 1,
        wins: 0,
        losses: 0,
        draws: 0,
      },
      {
        _id: 'p2',
        userId: 'user_p2',
        handle: 'shadow_ops',
        gamesPlayed: 1,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    ]

    await recordGameEndHandler(mockCtx(), {
      ...baseArgs,
      winner: null,
      endReason: 'draw',
    })

    expect(mockDb.patch).toHaveBeenCalledWith('p1', {
      gamesPlayed: 2,
      draws: 1,
    })
    expect(mockDb.patch).toHaveBeenCalledWith('p2', {
      gamesPlayed: 2,
      draws: 1,
    })
  })

  test('inserts match record with correct fields', async () => {
    collectorFns.collectResult = [
      {
        _id: 'p1',
        userId: 'user_p1',
        handle: 'neon_ninja',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
      {
        _id: 'p2',
        userId: 'user_p2',
        handle: 'shadow_ops',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    ]

    await recordGameEndHandler(mockCtx(), {
      ...baseArgs,
      winner: 'p1',
      endReason: 'forfeit',
      turns: 8,
      duration: 300000,
    })

    // Check that insert was called with matches table with the correct structure
    const insertCalls = mockDb.insert.mock.calls as any as Array<[string, any]>
    const matchInsert = insertCalls.find((call: any) => call[0] === 'matches')!
    expect(matchInsert).toBeDefined()
    expect(matchInsert[1]).toMatchObject({
      gameId: 'game123',
      p1Id: 'user_p1',
      p2Id: 'user_p2',
      p1Handle: 'neon_ninja',
      p2Handle: 'shadow_ops',
      winner: 'p1',
      endReason: 'forfeit',
      turns: 8,
      duration: 300000,
    })
    expect(matchInsert[1]).toHaveProperty('finishedAt')
    expect(typeof matchInsert[1].finishedAt).toBe('number')
  })

  test('snapshots handles at game-end time', async () => {
    // Players have different handles than their userIds
    collectorFns.collectResult = [
      {
        _id: 'p1',
        userId: 'user_p1',
        handle: 'original_handle',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
      {
        _id: 'p2',
        userId: 'user_p2',
        handle: 'old_handle',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    ]

    await recordGameEndHandler(mockCtx(), {
      ...baseArgs,
      winner: 'p1',
      endReason: 'elimination',
    })

    const insertCalls = mockDb.insert.mock.calls as any as Array<[string, any]>
    const matchInsert = insertCalls.find((call: any) => call[0] === 'matches')!
    expect(matchInsert).toBeDefined()
    expect(matchInsert[1].p1Handle).toBe('original_handle')
    expect(matchInsert[1].p2Handle).toBe('old_handle')
  })

  test('stores correct endReason for each path', async () => {
    // Set up existing players once
    collectorFns.collectResult = [
      {
        _id: 'p1',
        userId: 'user_p1',
        handle: 'hacker',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
      {
        _id: 'p2',
        userId: 'user_p2',
        handle: 'soldier',
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      },
    ]

    const reasons = ['elimination', 'forfeit', 'disconnect', 'timeout', 'draw']

    for (const reason of reasons) {
      await recordGameEndHandler(mockCtx(), {
        ...baseArgs,
        winner: reason === 'draw' ? null : 'p1',
        endReason: reason,
      })
    }

    // Check all 5 match inserts each have the correct endReason
    const insertCalls = mockDb.insert.mock.calls as any as Array<[string, any]>
    const matchInserts = insertCalls.filter(
      (call: any) => call[0] === 'matches',
    )
    expect(matchInserts).toHaveLength(5)
    for (let i = 0; i < reasons.length; i++) {
      expect(matchInserts[i][1].endReason).toBe(reasons[i])
    }
  })

  test('handles player docs not existing yet (auto-create)', async () => {
    // No players exist yet in the collect
    collectorFns.collectResult = []

    await recordGameEndHandler(mockCtx(), {
      ...baseArgs,
      winner: 'p1',
      endReason: 'elimination',
    })

    // Should insert two new player docs (auto-create)
    const insertCalls = mockDb.insert.mock.calls as any as Array<[string, any]>
    const playerInserts = insertCalls.filter(
      (call: any) => call[0] === 'players',
    )
    expect(playerInserts.length).toBe(2)
    expect(playerInserts[0][1].userId).toBe('user_p1')
    expect(playerInserts[1][1].userId).toBe('user_p2')
  })
})

// ===========================================================================
// getMatchHistoryHandler
// ===========================================================================
describe('getMatchHistoryHandler', () => {
  const makeMatch = (
    id: string,
    p1Id: string,
    p2Id: string,
    finishedAt: number,
  ) => ({
    _id: `m${id}`,
    gameId: `g${id}`,
    p1Id,
    p2Id,
    p1Handle: 'player1',
    p2Handle: 'player2',
    winner: 'p1',
    endReason: 'elimination',
    turns: 10,
    duration: 300000,
    finishedAt,
  })

  test('returns last 20 matches for a player, sorted by finishedAt desc', async () => {
    const now = Date.now()
    const matches = Array.from({ length: 25 }, (_, i) =>
      makeMatch(`${i}`, 'user_me', 'user_other', now - i * 60000),
    )
    collectorFns.collectResult = matches

    const result = await getMatchHistoryHandler(mockCtx(), {
      userId: 'user_me',
      limit: 20,
    })

    expect(result).toHaveLength(20)
    // Should be sorted descending by finishedAt
    for (let i = 1; i < result.length; i++) {
      expect(result[i - 1].finishedAt).toBeGreaterThanOrEqual(
        result[i].finishedAt,
      )
    }
  })

  test('does not return matches involving only other players', async () => {
    collectorFns.collectResult = [
      makeMatch('1', 'user_other1', 'user_other2', 1000),
      makeMatch('2', 'user_other3', 'user_other4', 2000),
    ]

    const result = await getMatchHistoryHandler(mockCtx(), {
      userId: 'user_me',
    })

    expect(result).toHaveLength(0)
  })

  test('returns matches where user is either p1 or p2', async () => {
    collectorFns.collectResult = [
      makeMatch('1', 'user_me', 'user_other', 3000),
      makeMatch('2', 'user_other', 'user_me', 2000),
    ]

    const result = await getMatchHistoryHandler(mockCtx(), {
      userId: 'user_me',
    })

    expect(result).toHaveLength(2)
  })

  test('returns empty array for user with no matches', async () => {
    collectorFns.collectResult = []

    const result = await getMatchHistoryHandler(mockCtx(), {
      userId: 'user_me',
    })

    expect(result).toEqual([])
  })
})

// ===========================================================================
// getPlayerStatsHandler
// ===========================================================================
describe('getPlayerStatsHandler', () => {
  test('returns correct W/L/D summary', async () => {
    collectorFns.uniqueResult = {
      _id: 'p1',
      userId: 'user_abc',
      handle: 'neon_ninja',
      gamesPlayed: 10,
      wins: 5,
      losses: 3,
      draws: 2,
    }

    const result = await getPlayerStatsHandler(mockCtx(), {
      userId: 'user_abc',
    })

    expect(result).toEqual({
      handle: 'neon_ninja',
      wins: 5,
      losses: 3,
      draws: 2,
      gamesPlayed: 10,
      achievements: [],
    })
  })

  test('returns null for non-existent player', async () => {
    collectorFns.uniqueResult = null

    const result = await getPlayerStatsHandler(mockCtx(), {
      userId: 'user_nonexistent',
    })

    expect(result).toBeNull()
  })
})
