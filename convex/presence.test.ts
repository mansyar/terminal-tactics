import { beforeEach, describe, expect, mock, test } from 'bun:test'
import { checkDisconnectHandler, heartbeatHandler } from './presence'

// Mock the Convex mutation context
const mockDb = {
  get: mock(() => null),
  patch: mock(() => {}),
  query: mock(() => ({
    withIndex: mock(() => ({
      collect: mock(() => []),
    })),
  })),
}

const mockCtx = { db: mockDb } as any

describe('heartbeatHandler', () => {
  beforeEach(() => {
    mockDb.get.mockClear()
    mockDb.patch.mockClear()
  })

  test('updates lastHeartbeat and sets status to connected', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', playerId: 'user_123' }
    await heartbeatHandler(mockCtx, args)

    expect(mockDb.patch).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        p1LastHeartbeat: expect.any(Number),
        p1Status: 'connected',
      }),
    )
  })

  test('updates p2 heartbeat when player is p2', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', playerId: 'user_456' }
    await heartbeatHandler(mockCtx, args)

    expect(mockDb.patch).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        p2LastHeartbeat: expect.any(Number),
        p2Status: 'connected',
      }),
    )
  })

  test('clears disconnectStartTime on reconnect', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
      p1Status: 'disconnected',
      disconnectStartTime: 1000000,
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', playerId: 'user_123' }
    await heartbeatHandler(mockCtx, args)

    expect(mockDb.patch).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        p1LastHeartbeat: expect.any(Number),
        p1Status: 'connected',
        disconnectStartTime: undefined,
      }),
    )
  })

  test('throws for non-existent game', async () => {
    ;(mockDb as any).get = mock(() => null)

    const args = { gameId: 'game-1', playerId: 'user_123' }
    await expect(heartbeatHandler(mockCtx, args)).rejects.toThrow(
      'GAME_NOT_FOUND',
    )
  })

  test('throws for non-participant player', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', playerId: 'user_789' }
    await expect(heartbeatHandler(mockCtx, args)).rejects.toThrow(
      'NOT_A_PLAYER',
    )
  })

  test('does nothing when game is not in playing status', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'lobby',
      p1: 'user_123',
      p2: 'user_456',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', playerId: 'user_123' }
    await heartbeatHandler(mockCtx, args)

    expect(mockDb.patch).not.toHaveBeenCalled()
  })
})

describe('checkDisconnectHandler', () => {
  beforeEach(() => {
    mockDb.get.mockClear()
    mockDb.patch.mockClear()
  })

  const now = Date.now()

  test('marks player as disconnected after 30s of no heartbeat', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
      p1LastHeartbeat: now - 35000, // 35s ago — past 30s threshold
      p2LastHeartbeat: now - 5000, // 5s ago — still active
      p1Status: 'connected',
      p2Status: 'connected',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', now }
    await checkDisconnectHandler(mockCtx, args)

    expect(mockDb.patch).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        p1Status: 'disconnected',
        disconnectStartTime: expect.any(Number),
      }),
    )
  })

  test('does NOT mark a connected player as disconnected', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
      p1LastHeartbeat: now - 10000, // 10s ago — within threshold
      p2LastHeartbeat: now - 5000,
      p1Status: 'connected',
      p2Status: 'connected',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', now }
    await checkDisconnectHandler(mockCtx, args)

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('is idempotent — does not re-mark already disconnected player', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
      p1LastHeartbeat: now - 35000,
      p2LastHeartbeat: now - 5000,
      p1Status: 'disconnected', // Already marked
      p2Status: 'connected',
      disconnectStartTime: now - 10000, // Already set
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', now }
    await checkDisconnectHandler(mockCtx, args)

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('does nothing for non-playing game', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'lobby',
      p1: 'user_123',
      p2: 'user_456',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', now }
    await checkDisconnectHandler(mockCtx, args)

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  test('handles both players disconnected', async () => {
    const mockGame = {
      _id: 'game-1',
      status: 'playing',
      p1: 'user_123',
      p2: 'user_456',
      p1LastHeartbeat: now - 35000,
      p2LastHeartbeat: now - 35000,
      p1Status: 'connected',
      p2Status: 'connected',
    }
    ;(mockDb as any).get = mock(() => mockGame)

    const args = { gameId: 'game-1', now }
    await checkDisconnectHandler(mockCtx, args)

    expect(mockDb.patch).toHaveBeenCalledWith(
      'game-1',
      expect.objectContaining({
        p1Status: 'disconnected',
        p2Status: 'disconnected',
        disconnectStartTime: expect.any(Number),
      }),
    )
  })
})
