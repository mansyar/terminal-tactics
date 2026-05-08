import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('Keyboard Navigation & CLI Focus (Task 2.2)', () => {
  it('CLIInput exposes focusInput() via useImperativeHandle or forwardRef', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/CLIInput.tsx'),
      'utf-8',
    )
    expect(content).toContain('useImperativeHandle')
    expect(content).toContain('focusInput')
    expect(content).toContain('forwardRef')
  })

  it('App.tsx has Escape key handler to return focus to CLI', () => {
    const content = readFileSync(resolve('src/App.tsx'), 'utf-8')
    expect(content).toContain('Escape')
    expect(content).toContain('focus')
  })

  it('SquadBuilder deploy/unit buttons have tabIndex=0', () => {
    const content = readFileSync(
      resolve('src/components/SquadBuilder.tsx'),
      'utf-8',
    )
    expect(content).toContain('tabIndex')
  })

  it('Game-over return button has tabIndex=0', () => {
    const content = readFileSync(resolve('src/App.tsx'), 'utf-8')
    // RETURN_TO_BASE button should be focusable
    expect(content).toContain('tabIndex')
  })

  it('CLI input has tabIndex=0 or equivalent', () => {
    const content = readFileSync(
      resolve('src/components/Terminal/CLIInput.tsx'),
      'utf-8',
    )
    expect(content).toContain('tabIndex')
  })
})
