import { describe, expect, it } from 'bun:test'
import { UNIT_TEMPLATES } from './unitTemplates'
import type { UnitType } from './combatSystem'

describe('UNIT_TEMPLATES', () => {
  describe('existing unit types', () => {
    it('still includes Knight with correct stats', () => {
      const k = UNIT_TEMPLATES['K']
      expect(k).toBeDefined()
      expect(k.cost).toBe(300)
      expect(k.hp).toBe(100)
      expect(k.label).toBe('Knight')
    })

    it('still includes Archer with correct stats', () => {
      const a = UNIT_TEMPLATES['A']
      expect(a).toBeDefined()
      expect(a.cost).toBe(200)
      expect(a.hp).toBe(60)
      expect(a.label).toBe('Archer')
    })

    it('still includes Scout with correct stats', () => {
      const s = UNIT_TEMPLATES['S']
      expect(s).toBeDefined()
      expect(s.cost).toBe(150)
      expect(s.hp).toBe(50)
      expect(s.label).toBe('Scout')
    })

    it('still includes Medic with correct stats', () => {
      const m = UNIT_TEMPLATES['M']
      expect(m).toBeDefined()
      expect(m.cost).toBe(250)
      expect(m.hp).toBe(70)
      expect(m.label).toBe('Medic')
    })
  })

  describe('new unit types (Phase 11)', () => {
    it('includes Engineer (E) with correct stats', () => {
      const e = UNIT_TEMPLATES['E']
      expect(e).toBeDefined()
      expect(e.cost).toBe(200)
      expect(e.hp).toBe(60)
      expect(e.ap).toBe(3)
      expect(e.atk).toBe(10)
      expect(e.rng).toBe(1)
      expect(e.vis).toBe(3)
      expect(e.label).toBe('Engineer')
    })

    it('includes Sniper (R) with correct stats', () => {
      const r = UNIT_TEMPLATES['R']
      expect(r).toBeDefined()
      expect(r.cost).toBe(350)
      expect(r.hp).toBe(40)
      expect(r.ap).toBe(2)
      expect(r.atk).toBe(40)
      expect(r.rng).toBe(8)
      expect(r.vis).toBe(6)
      expect(r.label).toBe('Sniper')
    })

    it('includes Commander (C) with correct stats', () => {
      const c = UNIT_TEMPLATES['C']
      expect(c).toBeDefined()
      expect(c.cost).toBe(400)
      expect(c.hp).toBe(80)
      expect(c.ap).toBe(2)
      expect(c.atk).toBe(20)
      expect(c.rng).toBe(2)
      expect(c.vis).toBe(4)
      expect(c.label).toBe('Commander')
    })
  })

  describe('UnitType type union', () => {
    it('allows new unit types in type annotations', () => {
      // Compile-time check: these should be valid UnitType values once union is updated
      const validTypes: Array<UnitType> = ['K', 'A', 'S', 'M', 'E', 'R', 'C']
      expect(validTypes).toContain('E')
      expect(validTypes).toContain('R')
      expect(validTypes).toContain('C')
    })
  })
})
