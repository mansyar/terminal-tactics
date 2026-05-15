import { describe, expect, it } from 'bun:test'
import {
  BOT_HANDLE_MAP,
  BOT_IDS,
  getBotDifficulty,
  getBotHandle,
  isBot,
} from './botDetection'

describe('Bot Detection — isBot()', () => {
  it('returns true for __ai_easy__', () => {
    expect(isBot('__ai_easy__')).toBe(true)
  })

  it('returns true for __ai_medium__', () => {
    expect(isBot('__ai_medium__')).toBe(true)
  })

  it('returns true for __ai_hard__', () => {
    expect(isBot('__ai_hard__')).toBe(true)
  })

  it('returns false for a normal user ID', () => {
    expect(isBot('user_abc123')).toBe(false)
  })

  it('returns false for null', () => {
    expect(isBot(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isBot(undefined)).toBe(false)
  })

  it('returns false for empty string', () => {
    expect(isBot('')).toBe(false)
  })

  it('returns true for any ID starting with __ai_', () => {
    expect(isBot('__ai_custom__')).toBe(true)
  })
})

describe('Bot Detection — BOT_IDS constants', () => {
  it('defines EASY as __ai_easy__', () => {
    expect(BOT_IDS.EASY).toBe('__ai_easy__')
  })

  it('defines MEDIUM as __ai_medium__', () => {
    expect(BOT_IDS.MEDIUM).toBe('__ai_medium__')
  })

  it('defines HARD as __ai_hard__', () => {
    expect(BOT_IDS.HARD).toBe('__ai_hard__')
  })
})

describe('Bot Detection — getBotHandle()', () => {
  it('returns AI_EASY for easy bot', () => {
    expect(getBotHandle('__ai_easy__')).toBe('AI_EASY')
  })

  it('returns AI_MEDIUM for medium bot', () => {
    expect(getBotHandle('__ai_medium__')).toBe('AI_MEDIUM')
  })

  it('returns AI_HARD for hard bot', () => {
    expect(getBotHandle('__ai_hard__')).toBe('AI_HARD')
  })

  it('returns null for normal user ID', () => {
    expect(getBotHandle('user_abc')).toBe(null)
  })

  it('returns null for null', () => {
    expect(getBotHandle(null)).toBe(null)
  })

  it('maps handles correctly in BOT_HANDLE_MAP', () => {
    expect(BOT_HANDLE_MAP['__ai_easy__']).toBe('AI_EASY')
    expect(BOT_HANDLE_MAP['__ai_medium__']).toBe('AI_MEDIUM')
    expect(BOT_HANDLE_MAP['__ai_hard__']).toBe('AI_HARD')
  })
})

describe('Bot Detection — getBotDifficulty()', () => {
  it('returns easy for easy bot', () => {
    expect(getBotDifficulty('__ai_easy__')).toBe('easy')
  })

  it('returns medium for medium bot', () => {
    expect(getBotDifficulty('__ai_medium__')).toBe('medium')
  })

  it('returns hard for hard bot', () => {
    expect(getBotDifficulty('__ai_hard__')).toBe('hard')
  })

  it('returns null for normal user', () => {
    expect(getBotDifficulty('user_abc')).toBe(null)
  })

  it('returns medium as fallback for unknown bot ID', () => {
    expect(getBotDifficulty('__ai_unknown__')).toBe('medium')
  })
})
