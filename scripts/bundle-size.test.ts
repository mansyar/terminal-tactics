import { existsSync, readFileSync, readdirSync  } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

describe('Bundle Size Tracking', () => {
  const distPath = resolve('dist')
  const baselineSize = 522.16 // kB, from perf-baseline.md
  const threshold = baselineSize * 1.1 // baseline + 10% = 574.38 kB

  it('production build output exists in dist/', () => {
    expect(existsSync(distPath)).toBe(true)
    const files = readdirSync(distPath, { recursive: true }) as Array<string>
    const jsFiles = files.filter((f: string) => f.endsWith('.js'))
    expect(jsFiles.length).toBeGreaterThan(0)
  })

  it('JS bundle size does not exceed baseline + 10%', () => {
    const files = readdirSync(distPath, { recursive: true }) as Array<string>
    const jsFiles = files.filter(
      (f: string) => f.startsWith('assets/') && f.endsWith('.js'),
    )

    for (const jsFile of jsFiles) {
      const stats = readFileSync(resolve(distPath, jsFile))
      const sizeKb = stats.byteLength / 1024
      expect(sizeKb).toBeLessThanOrEqual(threshold)
    }
  })

  it('lucide-react is tree-shaken from production bundle', () => {
    // When lucide-react is tree-shaken, its icon names should not appear in the bundle
    const files = readdirSync(distPath, { recursive: true }) as Array<string>
    const jsFiles = files.filter(
      (f: string) => f.startsWith('assets/') && f.endsWith('.js'),
    )

    for (const jsFile of jsFiles) {
      const content = readFileSync(resolve(distPath, jsFile), 'utf-8')
      // lucide-react icons (Home, Menu, X) should not be in the production bundle
      // if they were properly tree-shaken after removing Header.tsx
      expect(content).not.toContain('lucide-react')
    }
  })
})
