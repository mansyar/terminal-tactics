import { afterAll, beforeAll, describe, expect, it } from 'bun:test'
import {
  playAttack,
  playError,
  playHeal,
  playKernelPanic,
  playKeystroke,
  playSFX,
  playSuccess,
  playTurnEnd,
} from './audio'

let OriginalAudio: typeof globalThis.Audio

beforeAll(() => {
  OriginalAudio = globalThis.Audio
  // @ts-ignore - Mock Audio for jsdom test environment
  globalThis.Audio = class {
    volume = 0
    play() {
      return {
        catch(fn: (err: Error) => void) {
          fn(new Error('blocked'))
        },
      }
    }
  }
})

afterAll(() => {
  globalThis.Audio = OriginalAudio
})

describe('audio', () => {
  it('exports all sound functions', () => {
    expect(playSFX).toBeDefined()
    expect(playKeystroke).toBeDefined()
    expect(playError).toBeDefined()
    expect(playSuccess).toBeDefined()
    expect(playAttack).toBeDefined()
    expect(playHeal).toBeDefined()
    expect(playKernelPanic).toBeDefined()
    expect(playTurnEnd).toBeDefined()
  })

  it('playSFX does not throw when called', () => {
    expect(() => playSFX('keystroke')).not.toThrow()
  })
})
