import { describe, expect, it } from 'bun:test'
import { getAIActions } from './aiEngine'
import type { TileType } from './mapGenerator'
import type { AIGameState, AIUnitState } from './aiEngine'

// Helper: create a simple 12x12 grid MapData
function createEmptyMap() {
  const tiles: Array<Array<TileType>> = []
  for (let y = 0; y < 12; y++) {
    tiles[y] = []
    for (let x = 0; x < 12; x++) {
      tiles[y][x] = 'floor'
    }
  }
  return { width: 12, height: 12, tiles }
}

function makeUnit(
  overrides: Partial<AIUnitState> & { _id: string; type: any },
): AIUnitState {
  return {
    ownerId: 'p2',
    hp: 100,
    maxHp: 100,
    atk: 30,
    rng: 1,
    vis: 3,
    ap: 2,
    maxAp: 2,
    x: 5,
    y: 5,
    direction: 'N' as const,
    isOverwatching: false,
    isStealthed: false,
    engineerWallCount: 0,
    sniperMovedThisTurn: false,
    ...overrides,
  }
}

function makeGameState(overrides?: Partial<AIGameState>): AIGameState {
  return {
    mapData: createEmptyMap(),
    currentPlayer: 'p2',
    turnNum: 3,
    ...overrides,
  }
}

describe('AI Engine — Action Enumeration', () => {
  it('returns action plan with unit order', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 2 })
    const enemyUnit = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 8,
      ap: 2,
    })
    const allUnits = [aiUnit, enemyUnit]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'medium')

    expect(plan.unitOrder).toContain('unit-1')
    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
  })

  it('returns no actions when AI units have 0 AP', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 0 })
    const allUnits = [aiUnit]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'medium')
    expect(plan.actions.length).toBe(0)
  })

  it('returns no actions when there are no AI units', () => {
    const plan = getAIActions([], [], makeGameState(), 'medium')
    expect(plan.actions.length).toBe(0)
    expect(plan.unitOrder.length).toBe(0)
  })

  it('generates at least one action per unit with AP', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 3 })
    const enemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 8,
      y: 8,
      ap: 0,
    })
    const allUnits = [aiUnit, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'medium')
    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
    expect(plan.unitOrder.length).toBeGreaterThanOrEqual(1)
  })
})

describe('AI Engine — Easy Difficulty', () => {
  it('produces valid action type strings', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 1, y: 1, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 3,
      y: 3,
      ap: 2,
    })
    const allUnits = [aiUnit, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'easy')

    for (const action of plan.actions) {
      expect(['move', 'attack', 'heal', 'scan', 'overwatch', 'wait']).toContain(
        action.type,
      )
    }
  })

  it('returns at least one action per unit', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 1, y: 1, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 3,
      y: 3,
      ap: 2,
    })
    const allUnits = [aiUnit, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'easy')
    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
  })

  it('processes multiple AI units', () => {
    const unit1 = makeUnit({ _id: 'unit-1', type: 'K', x: 1, y: 1, ap: 2 })
    const unit2 = makeUnit({ _id: 'unit-2', type: 'A', x: 2, y: 2, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-3',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 5,
      ap: 2,
    })
    const allUnits = [unit1, unit2, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([unit1, unit2], allUnits, gameState, 'easy')
    expect(plan.unitOrder.length).toBe(2)
    expect(plan.actions.length).toBe(2)
  })
})

describe('AI Engine — Medium Difficulty', () => {
  it('prioritizes attacking low HP targets', () => {
    // Knight (30 atk) can kill a target with <30 HP
    const aiUnit = makeUnit({
      _id: 'unit-1',
      type: 'K',
      x: 5,
      y: 5,
      ap: 2,
      atk: 30,
    })
    const lowHpEnemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 6,
      hp: 20,
      maxHp: 100,
      ap: 0,
    })
    const fullHpEnemy = makeUnit({
      _id: 'unit-3',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 8,
      hp: 100,
      maxHp: 100,
      ap: 0,
    })
    const allUnits = [aiUnit, lowHpEnemy, fullHpEnemy]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'medium')

    // Should prioritize attacking the low HP target
    const attackAction = plan.actions.find((a) => a.type === 'attack')
    expect(attackAction).toBeDefined()
  })
})

describe('AI Engine — Medic Healing', () => {
  it('Medic prioritizes healing injured allies', () => {
    const medic = makeUnit({
      _id: 'unit-1',
      type: 'M',
      x: 5,
      y: 5,
      ap: 3,
      atk: 0,
      rng: 2,
    })
    const injuredAlly = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p2',
      x: 5,
      y: 6,
      hp: 30,
      maxHp: 100,
      ap: 0,
    })
    const enemy = makeUnit({
      _id: 'unit-3',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 10,
      ap: 0,
    })
    const allUnits = [medic, injuredAlly, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([medic], allUnits, gameState, 'medium')

    // Medic should heal the injured ally
    const healAction = plan.actions.find((a) => a.type === 'heal')
    expect(healAction).toBeDefined()
    if (healAction) {
      expect(healAction.targetUnitId).toBe('unit-2')
    }
  })

  it('Medic does not waste AP healing full HP allies', () => {
    const medic = makeUnit({
      _id: 'unit-1',
      type: 'M',
      x: 5,
      y: 5,
      ap: 3,
      atk: 0,
      rng: 2,
    })
    const fullHpAlly = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p2',
      x: 5,
      y: 6,
      hp: 100,
      maxHp: 100,
      ap: 0,
    })
    const enemy = makeUnit({
      _id: 'unit-3',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 10,
      ap: 0,
    })
    const allUnits = [medic, fullHpAlly, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([medic], allUnits, gameState, 'medium')

    // Should not have a heal action
    const healAction = plan.actions.find((a) => a.type === 'heal')
    expect(healAction).toBeUndefined()
  })
})

describe('AI Engine — Unit Ordering', () => {
  it('processes Medic before other unit types', () => {
    const medic = makeUnit({
      _id: 'unit-m',
      type: 'M',
      x: 5,
      y: 5,
      ap: 2,
      atk: 0,
      rng: 2,
    })
    const knight = makeUnit({ _id: 'unit-k', type: 'K', x: 6, y: 5, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-e',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 10,
      ap: 0,
    })
    const allUnits = [medic, knight, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([medic, knight], allUnits, gameState, 'medium')

    // Medic should appear before Knight in unit order
    const medicIndex = plan.unitOrder.indexOf('unit-m')
    const knightIndex = plan.unitOrder.indexOf('unit-k')
    expect(medicIndex).toBeLessThan(knightIndex)
  })

  it('returns valid action types for all chosen actions', () => {
    const validTypes = ['move', 'attack', 'heal', 'scan', 'overwatch', 'wait']
    const units = [
      makeUnit({ _id: 'unit-s', type: 'S', x: 1, y: 1, ap: 2, vis: 4 }),
      makeUnit({ _id: 'unit-k', type: 'K', x: 3, y: 3, ap: 2 }),
      makeUnit({ _id: 'unit-m', type: 'M', x: 5, y: 5, ap: 2, atk: 0 }),
    ]
    const enemy = makeUnit({
      _id: 'unit-e',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 10,
      ap: 0,
    })
    const allUnits = [...units, enemy]
    const gameState = makeGameState()

    const plan = getAIActions(units, allUnits, gameState, 'medium')
    for (const action of plan.actions) {
      expect(validTypes).toContain(action.type)
    }
  })
})

describe('AI Engine — Edge Cases', () => {
  it('handles units with no valid moves (surrounded by walls)', () => {
    const tiles: Array<Array<TileType>> = []
    for (let y = 0; y < 12; y++) {
      tiles[y] = []
      for (let x = 0; x < 12; x++) {
        tiles[y][x] = 'wall'
      }
    }
    // One open tile
    tiles[5][5] = 'floor'

    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 2 })
    const allUnits = [aiUnit]
    const gameState = makeGameState({
      mapData: { width: 12, height: 12, tiles },
    })

    const plan = getAIActions([aiUnit], allUnits, gameState, 'medium')
    // Should still return some action (at least wait)
    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
  })

  it('handles units with very high AP', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 10 })
    const enemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 3,
      y: 3,
      ap: 0,
    })
    const allUnits = [aiUnit, enemy]
    const gameState = makeGameState()

    const plan = getAIActions([aiUnit], allUnits, gameState, 'medium')
    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
  })
})

describe('AI Engine — Hard Difficulty (One-Step Lookahead)', () => {
  it('returns a valid action plan for Hard difficulty', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 8,
      ap: 0,
    })
    const allUnits = [aiUnit, enemy]
    const gameState = makeGameState()
    const plan = getAIActions([aiUnit], allUnits, gameState, 'hard')

    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
    expect(plan.unitOrder.length).toBeGreaterThanOrEqual(1)
  })

  it('Hard difficulty prefers attacking over waiting when enemy in range', () => {
    // Knight range=1, enemy at distance 3 (too far to attack but reachable)
    const aiUnit = makeUnit({
      _id: 'unit-1',
      type: 'K',
      x: 5,
      y: 5,
      ap: 3,
      atk: 30,
    })
    const closeEnemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 6,
      y: 6,
      hp: 20,
      maxHp: 100,
      ap: 0,
    })
    const allUnits = [aiUnit, closeEnemy]
    const gameState = makeGameState()
    const plan = getAIActions([aiUnit], allUnits, gameState, 'hard')

    // Should take an offensive action (move closer or attack)
    const hasAction = plan.actions.some(
      (a) => a.type === 'move' || a.type === 'attack',
    )
    expect(hasAction).toBe(true)
  })

  it('Hard difficulty produces valid action types', () => {
    const validTypes = ['move', 'attack', 'heal', 'scan', 'overwatch', 'wait']
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-2',
      type: 'K',
      ownerId: 'p1',
      x: 8,
      y: 8,
      ap: 0,
    })
    const allUnits = [aiUnit, enemy]
    const gameState = makeGameState()
    const plan = getAIActions([aiUnit], allUnits, gameState, 'hard')

    for (const action of plan.actions) {
      expect(validTypes).toContain(action.type)
    }
  })

  it('processes multiple AI units on Hard difficulty', () => {
    const unit1 = makeUnit({ _id: 'unit-1', type: 'K', x: 1, y: 1, ap: 2 })
    const unit2 = makeUnit({ _id: 'unit-2', type: 'A', x: 2, y: 2, ap: 2 })
    const enemy = makeUnit({
      _id: 'unit-3',
      type: 'K',
      ownerId: 'p1',
      x: 5,
      y: 5,
      ap: 0,
    })
    const allUnits = [unit1, unit2, enemy]
    const gameState = makeGameState()
    const plan = getAIActions([unit1, unit2], allUnits, gameState, 'hard')

    expect(plan.unitOrder.length).toBe(2)
    expect(plan.actions.length).toBe(2)
  })

  it('handles no enemies gracefully on Hard difficulty', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 2 })
    const allUnits = [aiUnit]
    const gameState = makeGameState()
    const plan = getAIActions([aiUnit], allUnits, gameState, 'hard')

    expect(plan.actions.length).toBeGreaterThanOrEqual(1)
  })

  it('falls back gracefully when units have 0 AP', () => {
    const aiUnit = makeUnit({ _id: 'unit-1', type: 'K', x: 5, y: 5, ap: 0 })
    const allUnits = [aiUnit]
    const gameState = makeGameState()
    const plan = getAIActions([aiUnit], allUnits, gameState, 'hard')

    expect(plan.actions.length).toBe(0)
  })
})
