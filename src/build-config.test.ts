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
})
