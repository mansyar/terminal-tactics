import { describe, expect, it } from 'bun:test'
import { UNIT_TEMPLATES } from '../src/lib/unitTemplates'
import { getAISquad } from './aiSquadBuilder'

describe('AI Squad Builder', () => {
  it('easy difficulty returns a valid squad within budget', () => {
    const squad = getAISquad('easy')
    expect(squad.length).toBeGreaterThanOrEqual(2)
    expect(squad.length).toBeLessThanOrEqual(5)

    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    expect(total).toBeLessThanOrEqual(1000)
  })

  it('medium difficulty returns a valid squad within budget', () => {
    const squad = getAISquad('medium')
    expect(squad.length).toBeGreaterThanOrEqual(2)
    expect(squad.length).toBeLessThanOrEqual(5)

    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    expect(total).toBeLessThanOrEqual(1000)
  })

  it('hard difficulty returns a valid squad within budget', () => {
    const squad = getAISquad('hard')
    expect(squad.length).toBeGreaterThanOrEqual(2)
    expect(squad.length).toBeLessThanOrEqual(5)

    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    expect(total).toBeLessThanOrEqual(1000)
  })

  it('returns squad with valid unit types only', () => {
    const difficulties = ['easy', 'medium', 'hard']
    const validTypes = Object.keys(UNIT_TEMPLATES)

    for (const difficulty of difficulties) {
      const squad = getAISquad(difficulty)
      for (const type of squad) {
        expect(validTypes).toContain(type)
      }
    }
  })

  it('returns a deterministic squad for known difficulties', () => {
    // Known difficulties should return the same squad each time
    const mediumSquad1 = getAISquad('medium')
    const mediumSquad2 = getAISquad('medium')

    expect(mediumSquad1).toEqual(mediumSquad2)
  })

  it('easy squad uses Knight + Archer + Scout (650cr)', () => {
    const squad = getAISquad('easy')
    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // Should be exactly 650cr (K 300 + A 200 + S 150)
    expect(total).toBe(650)
    expect(squad).toContain('K')
    expect(squad).toContain('A')
    expect(squad).toContain('S')
  })

  it('medium squad uses Knight + Archer + Medic + Scout (900cr)', () => {
    const squad = getAISquad('medium')
    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // Should be exactly 900cr (K 300 + A 200 + M 250 + S 150)
    expect(total).toBe(900)
    expect(squad).toContain('K')
    expect(squad).toContain('A')
    expect(squad).toContain('M')
    expect(squad).toContain('S')
  })

  it('hard squad uses Commander + Sniper + Medic (1000cr)', () => {
    const squad = getAISquad('hard')
    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    // Should be exactly 1000cr (C 400 + R 350 + M 250)
    expect(total).toBe(1000)
    expect(squad).toContain('C')
    expect(squad).toContain('R')
    expect(squad).toContain('M')
  })

  it('every unit type has a valid cost defined in UNIT_TEMPLATES', () => {
    const squad = getAISquad('hard')
    for (const type of squad) {
      expect(UNIT_TEMPLATES[type]).toBeDefined()
      expect(UNIT_TEMPLATES[type].cost).toBeGreaterThan(0)
    }
  })

  it('falls back to random squad for unknown difficulty', () => {
    const squad = getAISquad('unknown_difficulty')
    expect(squad.length).toBeGreaterThanOrEqual(2)
    expect(squad.length).toBeLessThanOrEqual(5)

    const total = squad.reduce(
      (sum: number, type: string) => sum + UNIT_TEMPLATES[type].cost,
      0,
    )
    expect(total).toBeLessThanOrEqual(1000)
  })
})
