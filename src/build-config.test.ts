import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'bun:test'

const projectRoot = resolve(import.meta.dir, '..')

describe('Production Build Configuration (Phase A)', () => {
  describe('package.json scripts', () => {
    it('has a build:prod script for production deployment', () => {
      const pkg = JSON.parse(
        readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'),
      )
      expect(pkg.scripts).toHaveProperty('build:prod')
      expect(pkg.scripts['build:prod']).toMatch(/build/)
      expect(pkg.scripts['build:prod']).toMatch(/zip/)
    })

    it('has a zip script for dist bundling', () => {
      const pkg = JSON.parse(
        readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'),
      )
      expect(pkg.scripts).toHaveProperty('zip')
      expect(pkg.scripts['zip']).toContain('zip')
    })
  })

  describe('Vite configuration', () => {
    it('uses base: "./" for itch.io HTML5 compatibility', () => {
      const viteConfig = readFileSync(
        resolve(projectRoot, 'vite.config.ts'),
        'utf-8',
      )
      expect(viteConfig).toContain("base: './'")
    })

    it('removes unused web-vitals dependency', () => {
      const pkg = JSON.parse(
        readFileSync(resolve(projectRoot, 'package.json'), 'utf-8'),
      )
      if (pkg.dependencies) {
        expect(pkg.dependencies).not.toHaveProperty('web-vitals')
      }
      if (pkg.devDependencies) {
        expect(pkg.devDependencies).not.toHaveProperty('web-vitals')
      }
    })
  })

  describe('.gitignore configuration', () => {
    it('ignores dist.zip in .gitignore', () => {
      const gitignore = readFileSync(
        resolve(projectRoot, '.gitignore'),
        'utf-8',
      )
      expect(gitignore).toContain('dist.zip')
    })
  })

  describe('Environment variables (Task A2)', () => {
    it('has a .env.production file with VITE_CONVEX_URL placeholder', () => {
      const envProd = readFileSync(
        resolve(projectRoot, '.env.production'),
        'utf-8',
      )
      expect(envProd).toContain('VITE_CONVEX_URL')
    })

    it('uses import.meta.env.VITE_CONVEX_URL in Convex client initialization', () => {
      const mainTsx = readFileSync(
        resolve(projectRoot, 'src/main.tsx'),
        'utf-8',
      )
      expect(mainTsx).toContain('import.meta.env.VITE_CONVEX_URL')
    })
  })

  describe('Production environment detection (Phase C)', () => {
    it('main.tsx uses VITE_CONVEX_URL via import.meta.env for production compatibility', () => {
      const mainTsx = readFileSync(
        resolve(projectRoot, 'src/main.tsx'),
        'utf-8',
      )
      // Vite replaces import.meta.env.VITE_* at build time.
      // In production build, it reads from .env.production (or CI env vars).
      // This means one code path works for both dev and prod — no branching needed.
      expect(mainTsx).toContain('import.meta.env.VITE_CONVEX_URL')
      // No hardcoded dev fallback — must be set via .env file or CI
      expect(mainTsx).not.toContain('localhost:6001')
    })

    it('.env.production is tracked in git (not gitignored)', () => {
      const gitignore = readFileSync(
        resolve(projectRoot, '.gitignore'),
        'utf-8',
      )
      // .env.production should NOT be in gitignore (only .env, .env.local, .env.*.local)
      // This ensures the placeholder template is committed.
      // Check that ".env.production" as its own line/pattern is NOT in gitignore,
      // while ".env.production.local" (a different pattern) may be present.
      const lines = gitignore.split('\n').map((l) => l.trim())
      const hasEnvProduction = lines.some((l) => l === '.env.production')
      expect(hasEnvProduction).toBe(false)
    })

    it('.env.local (dev) is gitignored to prevent secrets leak', () => {
      const gitignore = readFileSync(
        resolve(projectRoot, '.gitignore'),
        'utf-8',
      )
      expect(gitignore).toContain('.env.local')
    })
  })
})
