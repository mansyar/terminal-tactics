import { describe, expect, it } from 'bun:test'
import { createChannelName, isValidMessage } from './tabCoordinator'

describe('createChannelName', () => {
  it('generates a valid channel name from gameId', () => {
    const name = createChannelName('game-123')
    expect(name).toBe('tt-tab-coord-game-123')
  })

  it('handles gameId with special characters', () => {
    const name = createChannelName('game_abc_def')
    expect(name).toBe('tt-tab-coord-game_abc_def')
  })
})

describe('isValidMessage', () => {
  it('accepts tab-joined message', () => {
    const result = isValidMessage({
      type: 'tab-joined',
      gameId: 'game-1',
      tabId: 'tab-abc',
      timestamp: Date.now(),
    })
    expect(result).toBe(true)
  })

  it('accepts tab-left message', () => {
    const result = isValidMessage({
      type: 'tab-left',
      gameId: 'game-1',
      tabId: 'tab-abc',
      timestamp: Date.now(),
    })
    expect(result).toBe(true)
  })

  it('accepts ping message', () => {
    const result = isValidMessage({
      type: 'ping',
      gameId: 'game-1',
      tabId: 'tab-abc',
      timestamp: Date.now(),
    })
    expect(result).toBe(true)
  })

  it('rejects message with missing type', () => {
    const result = isValidMessage({
      gameId: 'game-1',
      tabId: 'tab-abc',
      timestamp: Date.now(),
    })
    expect(result).toBe(false)
  })

  it('rejects message with unknown type', () => {
    const result = isValidMessage({
      type: 'unknown-type',
      gameId: 'game-1',
      tabId: 'tab-abc',
      timestamp: Date.now(),
    })
    expect(result).toBe(false)
  })

  it('rejects null/undefined', () => {
    expect(isValidMessage(null)).toBe(false)
    expect(isValidMessage(undefined)).toBe(false)
  })
})
