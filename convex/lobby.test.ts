import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { createLobbyHandler, joinLobby, joinQuickPlay, setTyping } from './lobby'

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

  describe('joinLobby', () => {
    test('successfully joins a lobby', async () => {
      const mockGame = { _id: 'game-1', status: 'lobby', p1: 'user_123', p2: null, code: 'ABCD' }
      ;(mockDb as any).query = mock(() => ({
        withIndex: mock(() => ({
          unique: mock(() => mockGame),
        })),
      }))

      const args = { code: 'ABCD', p2: 'user_456' }
      const result = await (joinLobby as any)._handler(mockCtx, args)

      expect(result).toBe('game-1')
      expect(mockDb.patch).toHaveBeenCalledWith(
        'game-1',
        expect.objectContaining({ p2: 'user_456', status: 'drafting' }),
      )
    })

    test('throws error when game is not found', async () => {
      ;(mockDb as any).query = mock(() => ({
        withIndex: mock(() => ({
          unique: mock(() => null),
        })),
      }))

      const args = { code: 'NONEXIST', p2: 'user_456' }
      await expect((joinLobby as any)._handler(mockCtx, args)).rejects.toThrow('LOBBY_NOT_FOUND')
    })

    test('throws error when game already started', async () => {
      const mockGame = { _id: 'game-1', status: 'playing', p1: 'user_123', p2: 'user_456' }
      ;(mockDb as any).query = mock(() => ({
        withIndex: mock(() => ({
          unique: mock(() => mockGame),
        })),
      }))

      const args = { code: 'ABCD', p2: 'user_789' }
      await expect((joinLobby as any)._handler(mockCtx, args)).rejects.toThrow('GAME_ALREADY_STARTED')
    })

    test('throws error when lobby is full', async () => {
      const mockGame = { _id: 'game-1', status: 'lobby', p1: 'user_123', p2: 'user_456' }
      ;(mockDb as any).query = mock(() => ({
        withIndex: mock(() => ({
          unique: mock(() => mockGame),
        })),
      }))

      const args = { code: 'ABCD', p2: 'user_789' }
      await expect((joinLobby as any)._handler(mockCtx, args)).rejects.toThrow('LOBBY_FULL')
    })
  })

  describe('joinQuickPlay', () => {
    test('joins an existing public lobby when one is open', async () => {
      const mockOpenLobby = { _id: 'game-1', status: 'lobby', isPublic: true, p1: 'user_123', p2: null }
      ;(mockDb as any).query = mock(() => ({
        withIndex: mock(() => ({
          unique: mock(() => null),
          filter: mock(() => ({
            first: mock(() => mockOpenLobby),
          })),
        })),
      }))

      const args = { playerId: 'user_456' }
      const result = await (joinQuickPlay as any)._handler(mockCtx, args)

      expect(result).toBe('game-1')
      expect(mockDb.patch).toHaveBeenCalledWith(
        'game-1',
        expect.objectContaining({ p2: 'user_456', status: 'drafting' }),
      )
    })

    test('creates a new public lobby when none is available', async () => {
      ;(mockDb as any).query = mock(() => ({
        withIndex: mock(() => ({
          unique: mock(() => null),
          filter: mock(() => ({
            first: mock(() => null),
          })),
        })),
      }))

      const args = { playerId: 'user_456' }
      const result = await (joinQuickPlay as any)._handler(mockCtx, args)

      expect(result).toBe('mock-game-id')
      expect(mockDb.insert).toHaveBeenCalledWith(
        'games',
        expect.objectContaining({ isPublic: true, p1: 'user_456', status: 'lobby' }),
      )
    })
  })

  describe('setTyping', () => {
    test('updates p1Typing when player is p1', async () => {
      const mockGame = { _id: 'game-1', p1: 'user_123', p2: 'user_456' }
      ;(mockDb as any).get = mock(() => mockGame)

      const args = { gameId: 'game-1', playerId: 'user_123', isTyping: true }
      await (setTyping as any)._handler(mockCtx, args)

      expect(mockDb.patch).toHaveBeenCalledWith('game-1', { p1Typing: true })
    })

    test('updates p2Typing when player is p2', async () => {
      const mockGame = { _id: 'game-1', p1: 'user_123', p2: 'user_456' }
      ;(mockDb as any).get = mock(() => mockGame)

      const args = { gameId: 'game-1', playerId: 'user_456', isTyping: true }
      await (setTyping as any)._handler(mockCtx, args)

      expect(mockDb.patch).toHaveBeenCalledWith('game-1', { p2Typing: true })
    })

    test('does nothing when player is not found', async () => {
      const mockGame = { _id: 'game-1', p1: 'user_123', p2: 'user_456' }
      ;(mockDb as any).get = mock(() => mockGame)

      const args = { gameId: 'game-1', playerId: 'user_999', isTyping: true }
      await (setTyping as any)._handler(mockCtx, args)

      expect(mockDb.patch).not.toHaveBeenCalled()
    })
  })
})
