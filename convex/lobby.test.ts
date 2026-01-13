import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { createLobbyHandler } from './lobby'

// Mock the Convex mutation context
const mockDb = {
  query: mock(() => ({
    withIndex: mock(() => ({
      unique: mock(() => null), // Default: no collision
      filter: mock(() => ({
        first: mock(() => null),
      })),
    })),
  })),
  insert: mock(() => 'mock-game-id'),
  patch: mock(() => {}),
  get: mock(() => null),
}

const mockCtx = {
  db: mockDb,
} as any

describe('Lobby System', () => {
  beforeEach(() => {
    mockDb.query.mockClear()
    mockDb.insert.mockClear()
    mockDb.patch.mockClear()
  })

  test('createLobby generates a code and inserts a game', async () => {
    const args = { isPublic: false, p1: 'user_123' }

    // @ts-ignore -- Calling the handler logic directly for testing purposes, ignoring strict Context type check
    const result = await createLobbyHandler(mockCtx, args)

    expect(result.gameId).toBe('mock-game-id')
    expect(result.code).toHaveLength(4)
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.insert).toHaveBeenCalledWith(
      'games',
      expect.objectContaining({
        status: 'lobby',
        p1: 'user_123',
        isPublic: false,
      }),
    )
  })

  // Note: Manual integration testing in browser is recommended for full flow.
})
