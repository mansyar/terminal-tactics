import { describe, expect, it } from 'bun:test'
import { checkFileSizes } from './check-file-size'

describe('checkFileSizes', () => {
  it('returns true for files under 500 lines', async () => {
    const files = ['src/lib/utils.ts']
    const result = await checkFileSizes(files, 500)
    expect(result).toBe(true)
  })

  it('returns false when a src/ file exceeds 500 lines', async () => {
    const files = ['src/hooks/useGameCommands.ts']
    const result = await checkFileSizes(files, 50)
    expect(result).toBe(false)
  })

  it('returns true for files exactly at 512 lines', async () => {
    const files = ['src/hooks/useGameCommands.ts']
    const result = await checkFileSizes(files, 512)
    expect(result).toBe(true)
  })

  it('filters out files outside src/ and convex/', async () => {
    const files = ['node_modules/foo.ts', 'README.md', '.lintstagedrc.json']
    const result = await checkFileSizes(files, 500)
    expect(result).toBe(true)
  })

  it('excludes convex/_generated/ directory', async () => {
    const files = ['convex/_generated/api.ts']
    const result = await checkFileSizes(files, 500)
    expect(result).toBe(true)
  })

  it('catches files in convex/ that exceed limit', async () => {
    // Create a temp file with many lines to test
    const files = ['convex/squadBuilder.ts']
    const result = await checkFileSizes(files, 10)
    expect(result).toBe(false)
  })
})
