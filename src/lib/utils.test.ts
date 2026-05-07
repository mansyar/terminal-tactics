import { describe, expect, it } from 'bun:test'
import { cleanErrorMessage, getOrSetUserId, parseCoord } from './utils'

describe('cleanErrorMessage', () => {
  it('strips CONVEX M prefix', () => {
    const result = cleanErrorMessage('[CONVEX M(foo)] some error')
    expect(result).toBe('SOME ERROR')
  })

  it('strips Request ID', () => {
    const result = cleanErrorMessage('Error [Request ID: abc123]')
    expect(result).toBe('ERROR')
  })

  it('strips Server Error prefix', () => {
    const result = cleanErrorMessage('Server Error: something broke')
    expect(result).toBe(': SOMETHING BROKE')
  })

  it('strips Uncaught Error prefix', () => {
    const result = cleanErrorMessage('Uncaught Error: fail')
    expect(result).toBe('FAIL')
  })

  it('splits at handler marker', () => {
    const result = cleanErrorMessage('msg at handler')
    expect(result).toBe('MSG')
  })

  it('converts to uppercase', () => {
    const result = cleanErrorMessage('hello world')
    expect(result).toBe('HELLO WORLD')
  })

  it('handles empty input', () => {
    const result = cleanErrorMessage('')
    expect(result).toBe('')
  })

  it('handles complex real-world error', () => {
    const msg =
      '[CONVEX M(foo)] Server Error: Not your turn [Request ID: xyz] at handler'
    const result = cleanErrorMessage(msg)
    expect(result).toBe(': NOT YOUR TURN')
  })
})

describe('parseCoord', () => {
  it('parses A1 as bottom-left corner', () => {
    const result = parseCoord('A1')
    expect(result).toEqual({ x: 0, y: 11, label: 'A1' })
  })

  it('parses L12 as top-right corner', () => {
    const result = parseCoord('L12')
    expect(result).toEqual({ x: 11, y: 0, label: 'L12' })
  })

  it('parses C5 as correct coordinate', () => {
    const result = parseCoord('C5')
    expect(result).toEqual({ x: 2, y: 7, label: 'C5' })
  })

  it('handles lowercase input', () => {
    const result = parseCoord('f7')
    expect(result).toEqual({ x: 5, y: 5, label: 'F7' })
  })

  it('returns null for empty string', () => {
    expect(parseCoord('')).toBeNull()
  })

  it('returns null for out-of-range column (M)', () => {
    expect(parseCoord('M1')).toBeNull()
  })

  it('returns null for out-of-range row (13)', () => {
    expect(parseCoord('A13')).toBeNull()
  })

  it('returns null for invalid row (0)', () => {
    expect(parseCoord('A0')).toBeNull()
  })

  it('parses coordinate with trailing chars by extracting numeric prefix', () => {
    // JS parseInt extracts the leading number, so "A3B" -> x=0, y=12-3=9
    const result = parseCoord('A3B')
    expect(result).not.toBeNull()
    expect(result!.x).toBe(0)
    expect(result!.y).toBe(9)
  })
})

describe('getOrSetUserId', () => {
  it('returns a string user ID', () => {
    // localStorage is polyfilled by bun-setup.ts, but if not, provide mock
    if (typeof localStorage === 'undefined') {
      const store: Record<string, string> = {}
      ;(globalThis as any).localStorage = {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => { store[k] = v },
      }
    }
    const id = getOrSetUserId()
    expect(typeof id).toBe('string')
    expect(id.startsWith('user_')).toBe(true)
  })
})
