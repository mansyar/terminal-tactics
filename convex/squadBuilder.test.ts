import { describe, expect, it } from 'bun:test'
import { UNIT_TEMPLATES } from './squadBuilder'

describe('squadBuilding logic', () => {
  it('has valid template costs', () => {
    expect(UNIT_TEMPLATES['K'].cost).toBe(300)
    expect(UNIT_TEMPLATES['A'].cost).toBe(200)
    expect(UNIT_TEMPLATES['S'].cost).toBe(150)
    expect(UNIT_TEMPLATES['M'].cost).toBe(250)
  })

  it('calculates squad budget correctly for a full squad', () => {
    const squad = ['K', 'K', 'A', 'S', 'S']
    const total = squad.reduce(
      (sum, type) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // 300+300+200+150+150 = 1100
    expect(total).toBe(1100)
    expect(total > 1000).toBe(true) // Should be rejected
  })

  it('allows a valid 1000cr budget squad', () => {
    const squad = ['K', 'K', 'A', 'A']
    const total = squad.reduce(
      (sum, type) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // 300+300+200+200 = 1000
    expect(total).toBe(1000)
    expect(total <= 1000).toBe(true)
  })
})
