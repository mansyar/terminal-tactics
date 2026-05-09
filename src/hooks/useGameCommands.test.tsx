import { afterAll, beforeAll, describe, expect, it, jest } from 'bun:test'
import { act, renderHook } from '@testing-library/react'
import { useGameCommands } from './useGameCommands'
import type { GameMutations } from './useGameCommands'

let OriginalAudio: typeof globalThis.Audio

beforeAll(() => {
  OriginalAudio = globalThis.Audio
  // @ts-ignore - Mock Audio for jsdom test environment
  globalThis.Audio = class {
    volume = 0
    play() {
      return {
        catch(_fn: (err: Error) => void) {
          // no-op
        },
      }
    }
  }
})

afterAll(() => {
  globalThis.Audio = OriginalAudio
})

function createMockMutations(): GameMutations {
  return {
    logCommand: jest.fn(() => Promise.resolve()),
    setTyping: jest.fn(() => Promise.resolve()),
    endTurn: jest.fn(() => Promise.resolve()),
    moveUnit: jest.fn(() => Promise.resolve({ originX: 0, originY: 0 })),
    attackUnit: jest.fn(() =>
      Promise.resolve({ damage: 10, zone: 'front', destroyed: false }),
    ),
    healUnit: jest.fn(() => Promise.resolve({ healed: 5 })),
    scanArea: jest.fn(() => Promise.resolve({ hostilesCount: 0 })),
    setOverwatch: jest.fn(() => Promise.resolve()),
    sudoMove: jest.fn(() => Promise.resolve()),
    sudoScan: jest.fn(() => Promise.resolve()),
    sudoAttack: jest.fn(() =>
      Promise.resolve({ damage: 10, destroyed: false }),
    ),
    forfeit: jest.fn(() => Promise.resolve()),
    offerDraw: jest.fn(() => Promise.resolve()),
    acceptDraw: jest.fn(() => Promise.resolve()),
    sendMessage: jest.fn(() => Promise.resolve()),
    checkDraftTimeout: jest.fn(() => Promise.resolve()),
    checkTurnTimeout: jest.fn(() => Promise.resolve()),
    checkDisconnect: jest.fn(() => Promise.resolve()),
    checkDisconnectGracePeriod: jest.fn(() => Promise.resolve()),
    heartbeat: jest.fn(() => Promise.resolve()),
    setHandle: jest.fn(),
    buildWall: jest.fn(() => Promise.resolve()),
    demolishWall: jest.fn(() => Promise.resolve()),
  }
}

function createMockGameState(overrides: Record<string, any> = {}) {
  return {
    _id: 'game123',
    status: 'playing',
    p1: 'user_p1',
    p2: 'user_p2',
    currentPlayer: 'p1',
    turnNum: 5,
    turnStartTime: Date.now(),
    units: [],
    mapData: { width: 12, height: 12, tiles: [] },
    ...overrides,
  }
}

describe('handleCommand - handle', () => {
  it('calls setHandle mutation with the correct arguments', async () => {
    const mockMutations = createMockMutations()
    const gameState = createMockGameState()

    const { result } = renderHook(() =>
      useGameCommands({
        playerId: 'user_p1',
        gameState,
        logs: [],
        mutations: mockMutations,
      }),
    )

    await act(async () => {
      await result.current.handleCommand('handle Neo')
    })

    expect(mockMutations.setHandle).toHaveBeenCalledWith({
      userId: 'user_p1',
      newHandle: 'Neo',
    })
  })

  it('displays HANDLE_SET with the returned handle on success', async () => {
    const mockMutations = createMockMutations()
    const mockSetHandle = mockMutations.setHandle as jest.Mock
    mockSetHandle.mockResolvedValue({ handle: 'Neo' })
    const gameState = createMockGameState()
    const mockLogCommand = mockMutations.logCommand as jest.Mock

    const { result } = renderHook(() =>
      useGameCommands({
        playerId: 'user_p1',
        gameState,
        logs: [],
        mutations: mockMutations,
      }),
    )

    await act(async () => {
      await result.current.handleCommand('handle Neo')
    })

    const logCall = mockLogCommand.mock.calls[0]
    expect(logCall[0].result).toContain('HANDLE_SET: Neo')
  })

  it('displays error message on server rejection', async () => {
    const mockMutations = createMockMutations()
    const mockSetHandle = mockMutations.setHandle as jest.Mock
    mockSetHandle.mockRejectedValue(new Error('HANDLE_TAKEN'))
    const gameState = createMockGameState()
    const mockLogCommand = mockMutations.logCommand as jest.Mock

    const { result } = renderHook(() =>
      useGameCommands({
        playerId: 'user_p1',
        gameState,
        logs: [],
        mutations: mockMutations,
      }),
    )

    await act(async () => {
      await result.current.handleCommand('handle Neo')
    })

    const logCall = mockLogCommand.mock.calls[0]
    expect(logCall[0].result).toContain('HANDLE_TAKEN')
  })
})

describe('handleCommand - history', () => {
  it('displays NO_MATCHES_FOUND when match history is empty', async () => {
    const mockMutations = createMockMutations()
    const gameState = createMockGameState()
    const mockLogCommand = mockMutations.logCommand as jest.Mock

    const { result } = renderHook(() =>
      useGameCommands({
        playerId: 'user_p1',
        gameState,
        logs: [],
        mutations: mockMutations,
        matchHistory: [],
      }),
    )

    await act(async () => {
      await result.current.handleCommand('history')
    })

    const logCall = mockLogCommand.mock.calls[0]
    expect(logCall[0].result).toContain('NO_MATCHES_FOUND')
  })

  it('displays match history formatted as ASCII table when matches exist', async () => {
    const mockMutations = createMockMutations()
    const gameState = createMockGameState()
    const mockLogCommand = mockMutations.logCommand as jest.Mock

    const { result } = renderHook(() =>
      useGameCommands({
        playerId: 'user_p1',
        gameState,
        logs: [],
        mutations: mockMutations,
        matchHistory: [
          {
            _id: 'm1',
            p1Id: 'user_p1',
            p2Id: 'user_p2',
            p1Handle: 'Neo',
            p2Handle: 'Morpheus',
            winner: 'p1',
            endReason: 'elimination',
            turns: 12,
            duration: 512000,
            finishedAt: Date.now(),
          },
        ],
      }),
    )

    await act(async () => {
      await result.current.handleCommand('history')
    })

    const logCall = mockLogCommand.mock.calls[0]
    expect(logCall[0].result).toContain('Morpheus')
    expect(logCall[0].result).toContain('WIN')
    expect(logCall[0].result).toContain('12')
    expect(logCall[0].result).toContain('8m 32s')
  })

  it('truncates match history display to 20 entries', async () => {
    const mockMutations = createMockMutations()
    const gameState = createMockGameState()
    const mockLogCommand = mockMutations.logCommand as jest.Mock

    const matches = Array.from({ length: 25 }, (_, i) => ({
      _id: `m${i}`,
      p1Id: 'user_p1',
      p2Id: 'user_p2',
      p1Handle: 'Neo',
      p2Handle: `player${i}`,
      winner: i % 2 === 0 ? 'p1' : 'p2',
      endReason: 'elimination',
      turns: 5 + i,
      duration: 60000 * (i + 1),
      finishedAt: Date.now() - i * 10000,
    }))

    const { result } = renderHook(() =>
      useGameCommands({
        playerId: 'user_p1',
        gameState,
        logs: [],
        mutations: mockMutations,
        matchHistory: matches,
      }),
    )

    await act(async () => {
      await result.current.handleCommand('history')
    })

    const logCall = mockLogCommand.mock.calls[0]
    const output = logCall[0].result
    // Should have 20 entries (not 25)
    const lines = output.split('\n')
    // Count lines that match data row pattern (start with spacing and a number)
    const dataRows = lines.filter((l: string) => {
      const trimmed = l.trim()
      return /^\d+\s+│/.test(trimmed)
    })
    expect(dataRows.length).toBeLessThanOrEqual(20)
    expect(dataRows.length).toBe(20)
  })
})
