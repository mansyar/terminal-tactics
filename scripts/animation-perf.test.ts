import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('Animation Performance (60fps)', () => {
  it('SVG glow filter is removed from GridBoard.tsx (replaced by CSS drop-shadow)', () => {
    const content = readFileSync(
      resolve('src/components/Grid/GridBoard.tsx'),
      'utf-8',
    )
    expect(content).not.toContain('filter id="glow"')
    expect(content).not.toContain('feGaussianBlur')
  })

  it('will-change: transform is applied to animated motion.g in UnitModel.tsx', () => {
    const content = readFileSync(
      resolve('src/components/Grid/UnitModel.tsx'),
      'utf-8',
    )
    expect(content).toContain('willChange')
  })
})
