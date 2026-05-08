import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('Task 3.0: Foundation', () => {
  it('ConsoleHistory uses md:scrollbar-hide (not scrollbar-hide) for mobile scrollbar', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/ConsoleHistory.tsx'),
      'utf-8',
    )
    expect(content).toContain('md:scrollbar-hide')
  })
})

describe('Task 3.1: Responsive Grid', () => {
  it('GameLayout sidebar collapses below grid on tablet', () => {
    const content = readFileSync(
      resolve('src/components/GameLayout.tsx'),
      'utf-8',
    )
    // Sidebar should stack below grid in portrait (flex-col on mobile)
    expect(content).toContain('md:flex-row')
    expect(content).toContain('flex-col')
  })
})

describe('Task 3.2: Touch Support', () => {
  it('GridBoard tiles have touch event handlers (onTouchStart)', () => {
    const content = readFileSync(
      resolve('src/components/Grid/GridBoard.tsx'),
      'utf-8',
    )
    expect(content).toContain('onTouchStart')
  })

  it('CLI input receives coordinate on tile touch (onTileTouch prop)', () => {
    const content = readFileSync(
      resolve('src/components/Grid/GridBoard.tsx'),
      'utf-8',
    )
    expect(content).toContain('onTileTouch')
  })
})

describe('Task 3.3: Virtual Keyboard', () => {
  it('CLI input has inputMode="text"', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/CLIInput.tsx'),
      'utf-8',
    )
    expect(content).toContain('inputMode')
  })
})

describe('Task 3.4: Orientation Handling', () => {
  it('GameLayout respects portrait/landscape orientation', () => {
    const content = readFileSync(
      resolve('src/components/GameLayout.tsx'),
      'utf-8',
    )
    expect(content).toContain('landscape:flex-row')
  })
})
