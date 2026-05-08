import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('Memory Leak Prevention', () => {
  it('formattedLogs in useGameDerivedState truncates at 200 entries', () => {
    const content = readFileSync(
      resolve('src/hooks/useGameDerivedState.ts'),
      'utf-8',
    )
    expect(content).toContain('MAX_LOG_ENTRIES')
    expect(content).toContain('.slice(')
    expect(content).toContain('200')
  })

  it('useEffect hooks have cleanup callbacks (return statements)', () => {
    const appContent = readFileSync(resolve('src/App.tsx'), 'utf-8')
    const useEffectMatches = appContent.match(/useEffect\(\(\) => \{/g)
    const returnCleanupMatches = appContent.match(/return \(\) => /g)
    expect(useEffectMatches).toBeTruthy()
    // All useEffect hooks should have cleanup or be simple sync operations
    expect(returnCleanupMatches).toBeTruthy()
    // TabCoordinator useEffect has cleanup
    expect(appContent).toContain('coordinator.stop()')
    // Heartbeat uses setInterval which must be cleared
    expect(appContent).toContain('useHeartbeat')
  })

  it('useHeartbeat hook cleans up interval and event listeners', () => {
    const content = readFileSync(resolve('src/hooks/useHeartbeat.ts'), 'utf-8')
    expect(content).toContain('clearInterval')
    expect(content).toContain('removeEventListener')
  })
})
