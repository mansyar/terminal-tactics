import { describe, expect, it, mock } from 'bun:test'
import { selectMapPresetHandler } from './mapSelection'

const makeMockCtx = () => ({
  db: {
    get: mock((): any => null),
    patch: mock(() => {}),
  },
})

describe('selectMapPresetHandler', () => {
  it('rejects when game is not found', async () => {
    const ctx = makeMockCtx()
    await expect(
      (selectMapPresetHandler as any)(ctx, {
        gameId: 'nonexistent',
        playerId: 'user_123',
        presetName: 'grid',
      }),
    ).rejects.toThrow('GAME_NOT_FOUND')
  })

  it('rejects when non-host tries to select map', async () => {
    const ctx = makeMockCtx()
    ctx.db.get = mock(() => ({
      _id: 'game-1',
      p1: 'user_123',
      p2: 'user_456',
    }))

    await expect(
      (selectMapPresetHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_456',
        presetName: 'grid',
      }),
    ).rejects.toThrow('NOT_LOBBY_HOST')
  })

  it('rejects invalid preset name', async () => {
    const ctx = makeMockCtx()
    ctx.db.get = mock(() => ({
      _id: 'game-1',
      p1: 'user_123',
    }))

    await expect(
      (selectMapPresetHandler as any)(ctx, {
        gameId: 'game-1',
        playerId: 'user_123',
        presetName: 'nonexistent',
      }),
    ).rejects.toThrow('INVALID_PRESET')
  })

  it('accepts valid preset selection', async () => {
    const ctx = makeMockCtx()
    ctx.db.get = mock(() => ({
      _id: 'game-1',
      p1: 'user_123',
    }))

    const result = await (selectMapPresetHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      presetName: 'grid',
    })

    expect(result).toEqual({ success: true })
    expect(ctx.db.patch).toHaveBeenCalledWith('game-1', {
      mapPreset: 'grid',
    })
  })

  it('accepts null preset (back to random)', async () => {
    const ctx = makeMockCtx()
    ctx.db.get = mock(() => ({
      _id: 'game-1',
      p1: 'user_123',
    }))

    const result = await (selectMapPresetHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      presetName: null,
    })

    expect(result).toEqual({ success: true })
    expect(ctx.db.patch).toHaveBeenCalledWith('game-1', {
      mapPreset: undefined,
    })
  })

  it('accepts maze preset', async () => {
    const ctx = makeMockCtx()
    ctx.db.get = mock(() => ({
      _id: 'game-1',
      p1: 'user_123',
    }))

    const result = await (selectMapPresetHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      presetName: 'maze',
    })

    expect(result).toEqual({ success: true })
  })

  it('accepts ridge preset', async () => {
    const ctx = makeMockCtx()
    ctx.db.get = mock(() => ({
      _id: 'game-1',
      p1: 'user_123',
    }))

    const result = await (selectMapPresetHandler as any)(ctx, {
      gameId: 'game-1',
      playerId: 'user_123',
      presetName: 'ridge',
    })

    expect(result).toEqual({ success: true })
  })
})
