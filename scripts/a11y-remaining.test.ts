import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('Task 2.3: Focus Management', () => {
  it('styles.css has :focus-visible styles', () => {
    const content = readFileSync(resolve('src/styles.css'), 'utf-8')
    expect(content).toContain('focus-visible')
    expect(content).toContain('outline')
  })

  it('App.tsx has skip-to-content link', () => {
    const content = readFileSync(resolve('src/App.tsx'), 'utf-8')
    expect(content).toContain('Skip to game content')
    expect(content).toContain('game-content')
  })
})

describe('Task 2.4: High Contrast Mode', () => {
  it('styles.css has prefers-contrast: more media query', () => {
    const content = readFileSync(resolve('src/styles.css'), 'utf-8')
    expect(content).toContain('prefers-contrast')
    expect(content).toContain('more')
  })
})

describe('Task 2.5: Reduced Motion', () => {
  it('styles.css has prefers-reduced-motion: reduce media query', () => {
    const content = readFileSync(resolve('src/styles.css'), 'utf-8')
    expect(content).toContain('prefers-reduced-motion')
    expect(content).toContain('reduce')
  })

  it('UnitModel uses useReducedMotion from framer-motion', () => {
    const content = readFileSync(
      resolve('src/components/Grid/UnitModel.tsx'),
      'utf-8',
    )
    expect(content).toContain('useReducedMotion')
  })
})

describe('Task 2.6: CLI Autocomplete ARIA', () => {
  it('CLIInput suggestions have role="listbox"', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/CLIInput.tsx'),
      'utf-8',
    )
    expect(content).toContain('listbox')
    expect(content).toContain('aria-label')
  })

  it('CLIInput suggestions have role="option" with aria-selected', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/CLIInput.tsx'),
      'utf-8',
    )
    expect(content).toContain('role="option"')
    expect(content).toContain('aria-selected')
  })

  it('CLI input has aria-autocomplete="list"', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/CLIInput.tsx'),
      'utf-8',
    )
    expect(content).toContain('aria-autocomplete')
  })
})
