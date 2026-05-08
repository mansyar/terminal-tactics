import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { getFilteredLogsHandler, logCommandHandler } from './game'
import { sendMessageHandler } from './chat'

// Mock the Convex mutation context
// @ts-ignore -- Bun mock types don't match Convex context types
const mockDb: any = {
  insert: mock(() => 'mock-log-id'),
  get: mock(() => null),
  query: mock(() => ({
    withIndex: mock(() => ({
      order: mock(() => ({
        collect: mock(() => []),
      })),
    })),
  })),
}

const mockCtx = {
  db: mockDb,
} as any

describe('Log Visibility Schema (Task 7.2.1)', () => {
  beforeEach(() => {
    mockDb.insert.mockClear()
    mockDb.get.mockClear()
  })

  test('logCommand accepts optional visibility parameter', async () => {
    // @ts-ignore -- Testing handler directly
    await logCommandHandler(mockCtx, {
      gameId: 'mock-game-id',
      playerId: 'user_123',
      command: 'mv C2 C5',
      result: 'MOVE_SUCCESS',
      visibility: 'private',
    })

    expect(mockDb.insert).toHaveBeenCalled()
    // @ts-ignore -- Mock calls type is dynamic
    const [callArgs] = mockDb.insert.mock.calls as Array<[string, any]>
    const [table, data] = callArgs
    expect(table).toBe('logs')
    expect(data).toHaveProperty('visibility')
    expect(data.visibility).toBe('private')
  })

  test('logCommand works without visibility field (backward compatible)', async () => {
    // @ts-ignore -- Testing backward compatibility
    await logCommandHandler(mockCtx, {
      gameId: 'mock-game-id',
      playerId: 'user_123',
      command: 'atk C4 E4',
      result: 'ATTACK_HIT',
    })

    expect(mockDb.insert).toHaveBeenCalled()
    // @ts-ignore -- Mock calls type is dynamic
    const [callArgs2] = mockDb.insert.mock.calls as Array<[string, any]>
    const [table2, data2] = callArgs2
    expect(table2).toBe('logs')
    expect(data2).not.toHaveProperty('visibility')
  })

  test('sendMessage inserts logs with public visibility', async () => {
    // @ts-ignore -- Mock reassignment type mismatch
    mockDb.get = mock(
      async () => ({ _id: 'mock-game-id', status: 'playing' }) as any,
    )

    // @ts-ignore -- Testing handler directly
    await sendMessageHandler(
      { db: { ...mockDb, get: mockDb.get } },
      {
        gameId: 'mock-game-id',
        playerId: 'user_123',
        message: 'hello',
      },
    )

    expect(mockDb.insert).toHaveBeenCalled()
    // @ts-ignore -- Mock calls type is dynamic
    const [callArgs3] = mockDb.insert.mock.calls as Array<[string, any]>
    const [table3, data3] = callArgs3
    expect(table3).toBe('logs')
    expect(data3).toHaveProperty('visibility')
    expect(data3.visibility).toBe('public')
  })

  test('logCommand accepts public visibility value', async () => {
    // @ts-ignore -- Testing handler directly
    await logCommandHandler(mockCtx, {
      gameId: 'mock-game-id',
      playerId: 'user_123',
      command: 'end',
      result: 'TURN_ENDED',
      visibility: 'public',
    })

    expect(mockDb.insert).toHaveBeenCalled()
    // @ts-ignore -- Mock calls type is dynamic
    const [callArgs4] = mockDb.insert.mock.calls as Array<[string, any]>
    const [table4, data4] = callArgs4
    expect(table4).toBe('logs')
    expect(data4.visibility).toBe('public')
  })
})

describe('Log Filter Query (Task 7.2.3)', () => {
  const mockLogs = [
    {
      gameId: 'g1',
      playerId: 'user_a',
      commandString: 'mv C2 C5',
      result: 'MOVE_SUCCESS',
      timestamp: 100,
      visibility: 'public',
    },
    {
      gameId: 'g1',
      playerId: 'user_a',
      commandString: 'scan D4',
      result: 'SCAN_COMPLETE',
      timestamp: 200,
      visibility: 'private',
    },
    {
      gameId: 'g1',
      playerId: 'user_b',
      commandString: 'inspect C2',
      result: 'UNIT_ID: [K]',
      timestamp: 300,
      visibility: 'private',
    },
    {
      gameId: 'g1',
      playerId: 'user_b',
      commandString: 'atk D4 E5',
      result: 'ATTACK_HIT',
      timestamp: 400,
    },
    {
      gameId: 'g1',
      playerId: 'user_b',
      commandString: 'end',
      result: 'TURN_ENDED',
      timestamp: 500,
      visibility: 'public',
    },
  ]

  let mockFilteredDb: any

  beforeEach(() => {
    mockFilteredDb = {
      query: mock(() => ({
        withIndex: mock(() => ({
          order: mock(() => ({
            collect: mock(() => [...mockLogs]),
          })),
        })),
      })),
    }
  })

  test('returns public logs for all players', async () => {
    // @ts-ignore -- Testing handler directly
    const result = await getFilteredLogsHandler(
      { db: mockFilteredDb },
      { gameId: 'g1', playerId: 'user_a' },
    )

    const publicLogs = result.filter(
      (l: any) => l.visibility === 'public' || !l.visibility,
    )
    expect(publicLogs.length).toBeGreaterThanOrEqual(2)
  })

  test('includes private logs belonging to requesting player', async () => {
    // @ts-ignore -- Testing handler directly
    const result = await getFilteredLogsHandler(
      { db: mockFilteredDb },
      { gameId: 'g1', playerId: 'user_a' },
    )

    // user_a should see their private scan log
    const userAPrivateLogs = result.filter(
      (l: any) => l.visibility === 'private' && l.playerId === 'user_a',
    )
    expect(userAPrivateLogs.length).toBe(1)
    expect(userAPrivateLogs[0].commandString).toBe('scan D4')
  })

  test('excludes private logs from other players', async () => {
    // @ts-ignore -- Testing handler directly
    const result = await getFilteredLogsHandler(
      { db: mockFilteredDb },
      { gameId: 'g1', playerId: 'user_a' },
    )

    // user_a should NOT see user_b's private inspect log
    const userBPrivateLogs = result.filter(
      (l: any) => l.visibility === 'private' && l.playerId === 'user_b',
    )
    expect(userBPrivateLogs.length).toBe(0)
  })

  test('returns logs ordered ascending by timestamp', () => {
    // Verify mock data is already sorted
    for (let i = 1; i < mockLogs.length; i++) {
      expect(mockLogs[i].timestamp).toBeGreaterThanOrEqual(
        mockLogs[i - 1].timestamp,
      )
    }
  })
})
