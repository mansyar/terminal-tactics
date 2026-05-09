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
      handle: 'Neo',
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
