import { beforeEach, describe, expect, it, mock } from 'bun:test'
import { aiTurn } from './ai'

const mockCollect = mock((): Array<any> => [])
const mockFilter = mock((): any => ({
  collect: mockCollect,
}))
const mockWithIndex = mock((): any => ({
  collect: mockCollect,
  filter: mockFilter,
}))

const mockDb = {
  get: mock((): any => null),
  patch: mock((): any => {}),
  delete: mock((): any => {}),
  insert: mock((): any => 'log-id'),
  query: mock((): any => ({
    withIndex: mockWithIndex,
    filter: mockFilter,
  })),
}

const mockCtx = { db: mockDb } as any

describe('AI Turn Mutation', () => {
  beforeEach(() => {
    mockDb.get.mockClear()
    mockDb.patch.mockClear()
    mockDb.delete.mockClear()
    mockDb.insert.mockClear()
  })

  it('does nothing when game is not found', async () => {
    mockDb.get.mockReturnValue(null)

    const result = await (aiTurn as any)._handler(mockCtx, {
      gameId: 'game-1',
      difficulty: 'medium',
    })

    expect(result).toBeUndefined()
    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  it('does nothing when game is not in playing status', async () => {
    mockDb.get.mockReturnValue({ _id: 'game-1', status: 'drafting' })

    await (aiTurn as any)._handler(mockCtx, {
      gameId: 'game-1',
      difficulty: 'medium',
    })

    expect(mockDb.patch).not.toHaveBeenCalled()
  })

  it('can run with valid game state and AI units', async () => {
    // Seed: 3 rounds of get calls
    let callCount = 0
    mockDb.get.mockImplementation(() => {
      callCount++
      if (callCount <= 1) {
        return {
          _id: 'game-1',
          status: 'playing',
          currentPlayer: 'p2',
          p1: 'user_human',
          p2: '__ai_medium__',
          turnNum: 3,
          mapData: {
            width: 12,
            height: 12,
            tiles: Array.from({ length: 12 }, () => Array(12).fill('floor')),
          },
          p1Rap: 1,
          p2Rap: 0,
        }
      }
      return null
    })

    // Mock units query: one AI unit and one human unit
    const unitData = [
      {
        _id: 'ai-unit-1',
        ownerId: 'p2',
        type: 'K',
        hp: 100,
        maxHp: 100,
        atk: 30,
        rng: 1,
        vis: 3,
        ap: 2,
        maxAp: 2,
        x: 5,
        y: 5,
        direction: 'N',
      },
      {
        _id: 'human-unit-1',
        ownerId: 'p1',
        type: 'K',
        hp: 100,
        maxHp: 100,
        atk: 30,
        rng: 1,
        vis: 3,
        ap: 2,
        maxAp: 2,
        x: 8,
        y: 8,
        direction: 'S',
      },
    ]
    const unitCollectMock = mock(() => unitData)
    const unitFilterMock = mock(() => ({ collect: unitCollectMock }))
    mockDb.query.mockImplementation(() => ({
      withIndex: mock(() => ({
        collect: unitCollectMock,
        filter: unitFilterMock,
      })),
      filter: unitFilterMock,
    }))

    await (aiTurn as any)._handler(mockCtx, {
      gameId: 'game-1',
      difficulty: 'medium',
    })

    // Should have patched at least one unit (AI action) and the game (endTurn)
    expect(mockDb.patch).toHaveBeenCalled()
    // Should have inserted log entries for AI actions
    expect(mockDb.insert).toHaveBeenCalled()
  })

  it('works with easy difficulty', async () => {
    mockDb.get.mockReturnValue({
      _id: 'game-1',
      status: 'playing',
      currentPlayer: 'p2',
      p1: 'user_human',
      p2: '__ai_easy__',
      turnNum: 3,
      mapData: {
        width: 12,
        height: 12,
        tiles: Array.from({ length: 12 }, () => Array(12).fill('floor')),
      },
    })

    const unitData = [
      {
        _id: 'ai-unit-1',
        ownerId: 'p2',
        type: 'K',
        hp: 100,
        maxHp: 100,
        atk: 30,
        rng: 1,
        vis: 3,
        ap: 2,
        maxAp: 2,
        x: 5,
        y: 5,
        direction: 'N',
      },
    ]
    const unitCollectMock = mock(() => unitData)
    const unitFilterMock = mock(() => ({ collect: unitCollectMock }))
    mockDb.query.mockImplementation(() => ({
      withIndex: mock(() => ({
        collect: unitCollectMock,
        filter: unitFilterMock,
      })),
      filter: unitFilterMock,
    }))

    await (aiTurn as any)._handler(mockCtx, {
      gameId: 'game-1',
      difficulty: 'easy',
    })

    expect(mockDb.patch).toHaveBeenCalled()
  })

  it('works with hard difficulty', async () => {
    mockDb.get.mockReturnValue({
      _id: 'game-1',
      status: 'playing',
      currentPlayer: 'p2',
      p1: 'user_human',
      p2: '__ai_hard__',
      turnNum: 3,
      mapData: {
        width: 12,
        height: 12,
        tiles: Array.from({ length: 12 }, () => Array(12).fill('floor')),
      },
    })

    const unitData = [
      {
        _id: 'ai-unit-1',
        ownerId: 'p2',
        type: 'K',
        hp: 100,
        maxHp: 100,
        atk: 30,
        rng: 1,
        vis: 3,
        ap: 2,
        maxAp: 2,
        x: 5,
        y: 5,
        direction: 'N',
      },
    ]
    const unitCollectMock = mock(() => unitData)
    const unitFilterMock = mock(() => ({ collect: unitCollectMock }))
    mockDb.query.mockImplementation(() => ({
      withIndex: mock(() => ({
        collect: unitCollectMock,
        filter: unitFilterMock,
      })),
      filter: unitFilterMock,
    }))

    await (aiTurn as any)._handler(mockCtx, {
      gameId: 'game-1',
      difficulty: 'hard',
    })

    expect(mockDb.patch).toHaveBeenCalled()
  })
})
