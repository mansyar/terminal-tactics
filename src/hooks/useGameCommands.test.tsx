import { describe, expect, it } from 'bun:test'
import { useGameCommands } from './useGameCommands'
import { useGameDerivedState } from './useGameDerivedState'

describe('useGameCommands', () => {
  it('is a function', () => {
    expect(typeof useGameCommands).toBe('function')
  })
})

describe('useGameDerivedState', () => {
  it('is a function', () => {
    expect(typeof useGameDerivedState).toBe('function')
  })
})
