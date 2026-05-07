import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { logCommandHandler } from './game'
import { sendMessageHandler } from './chat'

// Mock the Convex mutation context
const mockDb = {
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
    const [[table, data]] = mockDb.insert.mock.calls
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
    const [[table, data]] = mockDb.insert.mock.calls
    expect(table).toBe('logs')
    expect(data).not.toHaveProperty('visibility')
  })

  test('sendMessage inserts logs with public visibility', async () => {
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
    const [[table, data]] = mockDb.insert.mock.calls
    expect(table).toBe('logs')
    expect(data).toHaveProperty('visibility')
    expect(data.visibility).toBe('public')
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
    const [[table, data]] = mockDb.insert.mock.calls
    expect(table).toBe('logs')
    expect(data.visibility).toBe('public')
  })
})
