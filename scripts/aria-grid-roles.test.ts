import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('ARIA Grid Roles & Labels (Task 2.1)', () => {
  it('GridBoard SVG has role="grid"', () => {
    const content = readFileSync(
      resolve('src/components/Grid/GridBoard.tsx'),
      'utf-8',
    )
    expect(content).toContain('role="grid"')
  })

  it('GridBoard tiles have role="gridcell" and aria-label', () => {
    const content = readFileSync(
      resolve('src/components/Grid/GridBoard.tsx'),
      'utf-8',
    )
    expect(content).toContain('role="gridcell"')
    expect(content).toContain('aria-label')
  })

  it('ConsoleHistory has aria-live="polite"', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/ConsoleHistory.tsx'),
      'utf-8',
    )
    expect(content).toContain('aria-live="polite"')
  })

  it('TurnIndicator has role="status"', () => {
    const content = readFileSync(
      resolve('src/components/TurnIndicator.tsx'),
      'utf-8',
    )
    expect(content).toContain('role="status"')
  })

  it('Hover tooltip has role="tooltip"', () => {
    const content = readFileSync(
      resolve('src/components/Grid/GridBoard.tsx'),
      'utf-8',
    )
    expect(content).toContain('role="tooltip"')
  })

  it('UnitModel g elements have aria-label with unit info', () => {
    const content = readFileSync(
      resolve('src/components/Grid/UnitModel.tsx'),
      'utf-8',
    )
    expect(content).toContain('aria-label')
  })
})
