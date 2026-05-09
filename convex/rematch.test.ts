import { beforeEach, describe, expect, mock, test } from 'bun:test'
import {
  clearRematchHandler,
  getRematchInfoHandler,
  initiateRematchHandler,
} from './rematch'

const mockDb = {
  query: mock(() => ({
    withIndex: mock(() => ({
      unique: mock(() => null),
      filter: mock(() => ({
        first: mock(() => null),
      })),
    })),
  })),
  insert: mock(() => 'rematch-lobby-id'),
  patch: mock(() => {}),
  get: mock(() => null),
}

const mockCtx = {
  db: mockDb,
} as any

describe('Rematch System', () => {
  beforeEach(() => {
    mockDb.query.mockClear()
    mockDb.insert.mockClear()
    mockDb.patch.mockClear()
    mockDb.get.mockClear()
  })

  test('initiateRematch throws when game not found', async () => {
    // @ts-ignore -- Mocking null return for testing handler logic
    mockDb.get.mockResolvedValue(null)

    expect(
      initiateRematchHandler(mockCtx, {
        gameId: 'nonexistent',
        playerId: 'user_p1',
      }),
    ).rejects.toThrow('GAME_NOT_FOUND')
  })

  test('initiateRematch throws when game is not finished', async () => {
    // @ts-expect-error - Mock value for handler logic test
    mockDb.get.mockResolvedValue({
      _id: 'game123',
      status: 'playing',
      p1: 'user_p1',
      p2: 'user_p2',
    })

    expect(
      initiateRematchHandler(mockCtx, {
        gameId: 'game123',
        playerId: 'user_p1',
      }),
    ).rejects.toThrow('GAME_NOT_FINISHED')
  })

  test('initiateRematch throws when player is not in the game', async () => {
    // @ts-expect-error - Mock value for handler logic test
    mockDb.get.mockResolvedValue({
      _id: 'game123',
      status: 'finished',
      p1: 'user_p1',
      p2: 'user_p2',
    })

    expect(
      initiateRematchHandler(mockCtx, {
        gameId: 'game123',
        playerId: 'user_intruder',
      }),
    ).rejects.toThrow('NOT_YOUR_GAME')
  })

  test('initiateRematch creates a new lobby and patches the finished game', async () => {
    // @ts-expect-error - Mock value for handler logic test
    mockDb.get.mockResolvedValue({
      _id: 'game123',
      status: 'finished',
      p1: 'user_p1',
      p2: 'user_p2',
    })

    const result = await initiateRematchHandler(mockCtx, {
      gameId: 'game123',
      playerId: 'user_p1',
    })

    expect(result.code).toHaveLength(4)
    expect(result.gameId).toBe('rematch-lobby-id')
    expect(mockDb.insert).toHaveBeenCalled()
    expect(mockDb.patch).toHaveBeenCalledWith('game123', {
      rematchCode: result.code,
      rematchLobbyId: 'rematch-lobby-id',
    })
  })

  test('getRematchInfo returns null when game not found', async () => {
    // @ts-expect-error - Mock value for handler logic test
    mockDb.get.mockResolvedValue(null)

    const result = await getRematchInfoHandler(mockCtx, {
      gameId: 'nonexistent',
    })

    expect(result).toBeNull()
  })

  test('getRematchInfo returns null when game is not finished', async () => {
    // @ts-expect-error - Mock value for handler logic test
    mockDb.get.mockResolvedValue({
      _id: 'game123',
      status: 'playing',
    })

    const result = await getRematchInfoHandler(mockCtx, {
      gameId: 'game123',
    })

    expect(result).toBeNull()
  })

  test('getRematchInfo returns rematch info when set', async () => {
    // @ts-expect-error - Mock value for handler logic test
    mockDb.get.mockResolvedValue({
      _id: 'game123',
      status: 'finished',
      rematchCode: 'ABCD',
      rematchLobbyId: 'lobby456',
    })

    const result = await getRematchInfoHandler(mockCtx, {
      gameId: 'game123',
    })

    expect(result).toEqual({
      rematchCode: 'ABCD',
      rematchLobbyId: 'lobby456',
    })
  })

  test('clearRematch clears rematchCode and rematchLobbyId', async () => {
    await clearRematchHandler(mockCtx, {
      gameId: 'game123',
    })

    expect(mockDb.patch).toHaveBeenCalledWith('game123', {
      rematchCode: undefined,
      rematchLobbyId: undefined,
    })
  })
})
