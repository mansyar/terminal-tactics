import { describe, expect, it } from 'bun:test'
import {
  ACHIEVEMENT_DEFINITIONS,
  ACHIEVEMENT_IDS,
  evaluateNewAchievements,
} from './achievements'
import type { AchievementCheckInput } from './achievements'

function makeInput(
  overrides: Partial<AchievementCheckInput> = {},
): AchievementCheckInput {
  return {
    playerWon: true,
    playerRole: 'p1',
    unitsLostP1: 0,
    unitsLostP2: 0,
    turnNum: 10,
    sudoUsedThisGame: false,
    preGameGamesPlayed: 5,
    existingAchievements: [],
    ...overrides,
  }
}

describe('Achievement Definitions', () => {
  it('defines all 6 achievements', () => {
    expect(ACHIEVEMENT_IDS).toHaveLength(6)
    expect(ACHIEVEMENT_IDS.sort()).toEqual([
      'comeback_kid',
      'first_blood',
      'patience',
      'speed_demon',
      'sudo_master',
      'tactician',
    ])
  })

  it('each achievement has an id, name, and description', () => {
    for (const id of ACHIEVEMENT_IDS) {
      const def = ACHIEVEMENT_DEFINITIONS[id]
      expect(def.id).toBe(id)
      expect(def.name).toBeTruthy()
      expect(def.description).toBeTruthy()
    }
  })
})

describe('first_blood', () => {
  it('unlocks when gamesPlayed was 0 before this game', () => {
    const result = evaluateNewAchievements(makeInput({ preGameGamesPlayed: 0 }))
    expect(result).toContain('first_blood')
  })

  it('does NOT unlock when player has played before', () => {
    const result = evaluateNewAchievements(makeInput({ preGameGamesPlayed: 1 }))
    expect(result).not.toContain('first_blood')
  })

  it('does NOT unlock on loss even at gamesPlayed=0', () => {
    const result = evaluateNewAchievements(
      makeInput({ preGameGamesPlayed: 0, playerWon: false }),
    )
    expect(result).not.toContain('first_blood')
  })
})

describe('tactician', () => {
  it('unlocks when player lost 0 units', () => {
    const result = evaluateNewAchievements(
      makeInput({ unitsLostP1: 0, playerRole: 'p1' }),
    )
    expect(result).toContain('tactician')
  })

  it('does NOT unlock when player lost units', () => {
    const result = evaluateNewAchievements(
      makeInput({ unitsLostP1: 1, playerRole: 'p1' }),
    )
    expect(result).not.toContain('tactician')
  })
})

describe('comeback_kid', () => {
  it('unlocks when player lost 3+ units', () => {
    const result = evaluateNewAchievements(
      makeInput({ unitsLostP1: 3, playerRole: 'p1' }),
    )
    expect(result).toContain('comeback_kid')
  })

  it('unlocks at 4 units lost', () => {
    const result = evaluateNewAchievements(
      makeInput({ unitsLostP1: 4, playerRole: 'p1' }),
    )
    expect(result).toContain('comeback_kid')
  })

  it('does NOT unlock with 2 units lost', () => {
    const result = evaluateNewAchievements(
      makeInput({ unitsLostP1: 2, playerRole: 'p1' }),
    )
    expect(result).not.toContain('comeback_kid')
  })
})

describe('sudo_master', () => {
  it('unlocks when sudo was used in the game', () => {
    const result = evaluateNewAchievements(
      makeInput({ sudoUsedThisGame: true }),
    )
    expect(result).toContain('sudo_master')
  })

  it('does NOT unlock without sudo usage', () => {
    const result = evaluateNewAchievements(
      makeInput({ sudoUsedThisGame: false }),
    )
    expect(result).not.toContain('sudo_master')
  })
})

describe('patience', () => {
  it('unlocks at 20+ turns', () => {
    const result = evaluateNewAchievements(makeInput({ turnNum: 20 }))
    expect(result).toContain('patience')
  })

  it('unlocks at 25 turns', () => {
    const result = evaluateNewAchievements(makeInput({ turnNum: 25 }))
    expect(result).toContain('patience')
  })

  it('does NOT unlock at 19 turns', () => {
    const result = evaluateNewAchievements(makeInput({ turnNum: 19 }))
    expect(result).not.toContain('patience')
  })
})

describe('speed_demon', () => {
  it('unlocks at 5 turns', () => {
    const result = evaluateNewAchievements(makeInput({ turnNum: 5 }))
    expect(result).toContain('speed_demon')
  })

  it('unlocks at 3 turns', () => {
    const result = evaluateNewAchievements(makeInput({ turnNum: 3 }))
    expect(result).toContain('speed_demon')
  })

  it('does NOT unlock at 6 turns', () => {
    const result = evaluateNewAchievements(makeInput({ turnNum: 6 }))
    expect(result).not.toContain('speed_demon')
  })
})

describe('evaluateNewAchievements — no duplicates', () => {
  it('does not re-unlock already earned achievements', () => {
    const result = evaluateNewAchievements(
      makeInput({
        preGameGamesPlayed: 0,
        existingAchievements: ['first_blood'],
      }),
    )
    expect(result).not.toContain('first_blood')
  })

  it('still unlocks NEW achievements even when some already exist', () => {
    const result = evaluateNewAchievements(
      makeInput({
        sudoUsedThisGame: true,
        existingAchievements: ['first_blood'],
      }),
    )
    expect(result).toContain('sudo_master')
    expect(result).not.toContain('first_blood')
  })
})

describe('evaluateNewAchievements — no achievements on loss', () => {
  it('returns empty on loss regardless of conditions', () => {
    const result = evaluateNewAchievements(
      makeInput({
        playerWon: false,
        preGameGamesPlayed: 0,
        turnNum: 25,
        sudoUsedThisGame: true,
      }),
    )
    expect(result).toHaveLength(0)
  })
})
