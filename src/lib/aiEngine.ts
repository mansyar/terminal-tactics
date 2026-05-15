import { isValidMove } from './movementValidator'
import { calculateDamage, hasLineOfSight, isInRange } from './combatSystem'
import type { Direction, UnitType } from './combatSystem'
import type { MapData } from './mapGenerator'

// ===========================================================================
// Types
// ===========================================================================

export type AIDifficulty = 'easy' | 'medium' | 'hard'

export interface AIUnitState {
  _id: string
  ownerId: string
  type: UnitType
  hp: number
  maxHp: number
  atk: number
  rng: number
  vis: number
  ap: number
  maxAp: number
  x: number
  y: number
  direction: Direction
  isOverwatching?: boolean
  overwatchDirection?: Direction
  isStealthed?: boolean
  engineerWallCount?: number
  sniperMovedThisTurn?: boolean
}

export interface AIGameState {
  mapData: MapData
  currentPlayer: string // "p1" or "p2"
  turnNum: number
  kernelPanicActive?: string
  p1RevealedTiles?: Array<string>
  p2RevealedTiles?: Array<string>
}

export interface AIAction {
  unitId: string
  type: 'move' | 'attack' | 'heal' | 'scan' | 'overwatch' | 'end' | 'wait'
  targetX?: number
  targetY?: number
  targetUnitId?: string
  direction?: Direction
  score: number
  description: string
}

// ===========================================================================
// Helpers
// ===========================================================================

function isEnemy(unit: AIUnitState, ownerId: string): boolean {
  return unit.ownerId !== ownerId
}

function isAlly(unit: AIUnitState, ownerId: string): boolean {
  return unit.ownerId === ownerId
}

function manhattan(
  a: { x: number; y: number },
  b: { x: number; y: number },
): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

function getTile(map: MapData, x: number, y: number): string | undefined {
  return map.tiles[y]?.[x]
}

function isAdjacentToEnemy(
  unit: { x: number; y: number },
  enemies: Array<{ x: number; y: number }>,
): boolean {
  return enemies.some((e) => manhattan(unit, e) <= 1)
}

function isOnHighGround(map: MapData, x: number, y: number): boolean {
  return getTile(map, x, y) === 'highground'
}

// ===========================================================================
// Action Enumeration
// ===========================================================================

function enumerateMoveActions(
  unit: AIUnitState,
  allUnits: Array<AIUnitState>,
  map: MapData,
  difficulty: AIDifficulty,
): Array<AIAction> {
  const actions: Array<AIAction> = []
  const enemies = allUnits.filter((u) => isEnemy(u, unit.ownerId))
  const allies = allUnits.filter((u) => isAlly(u, unit.ownerId))
  const unitPositions = allUnits.map((u) => ({
    _id: u._id,
    x: u.x,
    y: u.y,
    ownerId: u.ownerId,
  }))

  // Try moving to all adjacent tiles within AP range
  // For simplicity, consider tiles at Manhattan distance 1-2 to keep search space manageable
  for (let dx = -unit.ap; dx <= unit.ap; dx++) {
    for (let dy = -unit.ap; dy <= unit.ap; dy++) {
      if (dx === 0 && dy === 0) continue
      const dist = Math.abs(dx) + Math.abs(dy)
      if (dist < 1 || dist > unit.ap) continue

      const tx = unit.x + dx
      const ty = unit.y + dy
      if (tx < 0 || tx >= map.width || ty < 0 || ty >= map.height) continue

      // Check if move is valid
      const validation = isValidMove(
        map,
        unitPositions.map((u) => ({
          _id: u._id,
          ownerId: u.ownerId,
          x: u.x,
          y: u.y,
        })),
        unit._id,
        { x: tx, y: ty },
        unit.ap,
      )

      if (!validation.valid) continue

      // Score the move
      let score = 0

      if (difficulty === 'easy') {
        // Easy: prefer moves away from danger (less adjacent enemies after move)
        const dangerAfterMove = enemies.filter(
          (e) => manhattan({ x: tx, y: ty }, e) <= 1,
        ).length
        score = -dangerAfterMove * 5 + Math.random()
      } else {
        // Medium: score based on tactical value
        const enemiesAfterMove = enemies.filter(
          (e) => manhattan({ x: tx, y: ty }, e) <= unit.rng,
        ).length
        const alliesNearby = allies.filter(
          (a) => a._id !== unit._id && manhattan({ x: tx, y: ty }, a) <= 2,
        ).length

        // High ground bonus
        if (isOnHighGround(map, tx, ty)) score += 20

        // Advancing toward nearest enemy
        let nearestDist = Infinity
        for (const e of enemies) {
          const d = manhattan({ x: tx, y: ty }, e)
          if (d < nearestDist) nearestDist = d
        }
        let currentDist = Infinity
        for (const e of enemies) {
          const d = manhattan(unit, e)
          if (d < currentDist) currentDist = d
        }
        if (nearestDist < currentDist) score += 15 // Moving closer

        // Threatening more enemies
        score += enemiesAfterMove * 10

        // Ally support
        score += alliesNearby * 5

        // Self-preservation: avoid moving adjacent to enemies
        const danger = enemies.filter(
          (e) => manhattan({ x: tx, y: ty }, e) <= 1,
        ).length
        score -= danger * 15
      }

      actions.push({
        unitId: unit._id,
        type: 'move',
        targetX: tx,
        targetY: ty,
        score,
        description: `move to (${tx},${ty})`,
      })
    }
  }

  // Also add a "wait" option (stay in place)
  actions.push({
    unitId: unit._id,
    type: 'wait',
    score: difficulty === 'easy' ? Math.random() : 0,
    description: 'wait',
  })

  return actions
}

function enumerateAttackActions(
  unit: AIUnitState,
  allUnits: Array<AIUnitState>,
  map: MapData,
  difficulty: AIDifficulty,
): Array<AIAction> {
  const actions: Array<AIAction> = []
  // Can't attack after moving as a Sniper
  if (unit.type === 'R' && unit.sniperMovedThisTurn) return actions

  const isOnHigh = isOnHighGround(map, unit.x, unit.y)
  const enemies = allUnits.filter((u) => isEnemy(u, unit.ownerId))

  for (const target of enemies) {
    if (
      !isInRange(
        { x: unit.x, y: unit.y },
        { x: target.x, y: target.y },
        unit.rng,
        isOnHigh,
      )
    )
      continue
    if (
      !hasLineOfSight(
        { x: unit.x, y: unit.y },
        { x: target.x, y: target.y },
        map,
      )
    )
      continue

    const { damage } = calculateDamage(
      { type: unit.type, atk: unit.atk, x: unit.x, y: unit.y },
      {
        type: target.type,
        x: target.x,
        y: target.y,
        direction: target.direction,
      },
      isOnHigh,
    )

    if (damage <= 0) continue

    let score = 0

    if (difficulty === 'easy') {
      score = Math.random()
    } else {
      // Medium: prioritize killing low HP targets
      // Base score ensures attacking is always preferred over doing nothing
      score += 20 // Base attack value
      if (damage >= target.hp) {
        score += 100 // Killing blow
      } else if (target.hp < 30) {
        score += 50 // Low HP target
      }
      score += damage // Higher damage is better
      // Don't penalize for full HP — healthy enemies are still threats
    }

    actions.push({
      unitId: unit._id,
      type: 'attack',
      targetUnitId: target._id,
      targetX: target.x,
      targetY: target.y,
      score,
      description: `attack [${target.type}] at (${target.x},${target.y}) for ${damage} dmg (${target.hp} HP)`,
    })
  }

  return actions
}

function enumerateHealActions(
  unit: AIUnitState,
  allUnits: Array<AIUnitState>,
  _map: MapData,
  difficulty: AIDifficulty,
): Array<AIAction> {
  const actions: Array<AIAction> = []
  if (unit.type !== 'M') return actions // Only Medic can heal

  const allies = allUnits.filter(
    (u) => isAlly(u, unit.ownerId) && u._id !== unit._id,
  )

  for (const ally of allies) {
    const dist = manhattan(unit, ally)
    if (dist !== 1) continue // Must be adjacent
    if (ally.hp >= ally.maxHp) continue // Already full health

    let score = 0

    if (difficulty === 'easy') {
      score = Math.random()
    } else {
      // Medium: prioritize healing low HP allies
      const hpMissing = ally.maxHp - ally.hp
      score = hpMissing * 2
      // Prioritize healing tanks (Knights)
      if (ally.type === 'K') score += 10
      // Prioritize Commander
      if (ally.type === 'C') score += 15
    }

    actions.push({
      unitId: unit._id,
      type: 'heal',
      targetUnitId: ally._id,
      targetX: ally.x,
      targetY: ally.y,
      score,
      description: `heal [${ally.type}] at (${ally.x},${ally.y}) (+15 HP, currently ${ally.hp}/${ally.maxHp})`,
    })
  }

  return actions
}

// ===========================================================================
// State Simulation (for Hard difficulty lookahead)
// ===========================================================================

const MAX_CANDIDATE_ACTIONS = 200
const LOOKAHEAD_SAMPLE_SIZE = 10

interface SimulatedState {
  units: Array<AIUnitState>
}

function cloneUnits(units: Array<AIUnitState>): Array<AIUnitState> {
  return units.map((u) => ({ ...u }))
}

function simulateAction(
  state: SimulatedState,
  action: AIAction,
  _ownerId: string,
  map: MapData,
): SimulatedState {
  const newUnits = cloneUnits(state.units)
  const unit = newUnits.find((u) => u._id === action.unitId)
  if (!unit) return state

  switch (action.type) {
    case 'move': {
      if (action.targetX !== undefined && action.targetY !== undefined) {
        // Update direction based on movement
        if (action.targetX > unit.x) unit.direction = 'E'
        else if (action.targetX < unit.x) unit.direction = 'W'
        else if (action.targetY > unit.y) unit.direction = 'S'
        else if (action.targetY < unit.y) unit.direction = 'N'

        const cost = manhattan(unit, { x: action.targetX, y: action.targetY })
        unit.ap -= cost
        unit.x = action.targetX
        unit.y = action.targetY
        if (unit.type === 'R') unit.sniperMovedThisTurn = true
      }
      break
    }
    case 'attack': {
      const target = newUnits.find((u) => u._id === action.targetUnitId)
      if (target) {
        const isOnHigh = isOnHighGround(map, unit.x, unit.y)
        const { damage } = calculateDamage(
          { type: unit.type, atk: unit.atk, x: unit.x, y: unit.y },
          {
            type: target.type,
            x: target.x,
            y: target.y,
            direction: target.direction,
          },
          isOnHigh,
        )
        target.hp = Math.max(0, target.hp - damage)
        unit.ap -= 1
        unit.isStealthed = false
        if (target.hp <= 0) {
          // Unit eliminated — remove from array
          const idx = newUnits.indexOf(target)
          if (idx >= 0) newUnits.splice(idx, 1)
        }
      }
      break
    }
    case 'heal': {
      const target = newUnits.find((u) => u._id === action.targetUnitId)
      if (target) {
        target.hp = Math.min(target.maxHp, target.hp + 15)
        unit.ap -= 1
      }
      break
    }
    case 'scan': {
      unit.ap -= 1
      break
    }
    case 'overwatch': {
      unit.isOverwatching = true
      unit.overwatchDirection = action.direction
      unit.ap -= 1
      break
    }
    case 'wait':
      // No state change
      break
  }

  return { units: newUnits }
}

function evaluateState(
  state: SimulatedState,
  ownerId: string,
  map: MapData,
): number {
  let totalScore = 0
  const myUnits = state.units.filter((u) => u.ownerId === ownerId)
  const enemies = state.units.filter((u) => isEnemy(u, ownerId))

  // Score: own units' health (higher is better)
  for (const u of myUnits) {
    totalScore += (u.hp / u.maxHp) * 10
  }

  // Score: enemy units' health (lower is better)
  for (const e of enemies) {
    totalScore -= (e.hp / e.maxHp) * 10
  }

  // Score: high ground control
  for (const u of myUnits) {
    if (isOnHighGround(map, u.x, u.y)) totalScore += 5
  }

  return totalScore
}

// ===========================================================================
// Hard difficulty: one-step lookahead
// ===========================================================================

function getHardActions(
  aiUnits: Array<AIUnitState>,
  allUnits: Array<AIUnitState>,
  gameState: AIGameState,
): AIActionPlan {
  const actionPlan: Array<AIAction> = []
  const unitOrder: Array<string> = []
  const ownerId = aiUnits[0]?.ownerId
  if (!ownerId) return { actions: [], unitOrder: [] }

  const orderedUnits = prioritizeUnits(aiUnits, allUnits)

  for (const unit of orderedUnits) {
    if (unit.ap <= 0) {
      unitOrder.push(unit._id)
      continue
    }

    // Step 1: Enumerate all candidate actions using Medium scoring
    const candidates: Array<AIAction> = []
    candidates.push(
      ...enumerateMoveActions(unit, allUnits, gameState.mapData, 'medium'),
    )
    candidates.push(
      ...enumerateAttackActions(unit, allUnits, gameState.mapData, 'medium'),
    )
    candidates.push(
      ...enumerateHealActions(unit, allUnits, gameState.mapData, 'medium'),
    )
    candidates.push({
      unitId: unit._id,
      type: 'scan',
      targetX: unit.x,
      targetY: unit.y,
      score: 5,
      description: 'scan',
    })
    for (const dir of ['N', 'E', 'S', 'W'] as Array<Direction>) {
      candidates.push({
        unitId: unit._id,
        type: 'overwatch',
        direction: dir,
        score: 3,
        description: `overwatch ${dir}`,
      })
    }

    if (candidates.length === 0) {
      unitOrder.push(unit._id)
      actionPlan.push({
        unitId: unit._id,
        type: 'wait',
        score: 0,
        description: 'wait',
      })
      continue
    }

    // Step 2: Check search cap — if too many candidates, sample top-N
    let candidatesToEvaluate: Array<AIAction>
    if (candidates.length > MAX_CANDIDATE_ACTIONS) {
      // Sort by Medium score and take top LOOKAHEAD_SAMPLE_SIZE
      candidates.sort((a, b) => b.score - a.score)
      candidatesToEvaluate = candidates.slice(0, LOOKAHEAD_SAMPLE_SIZE)
    } else if (candidates.length > LOOKAHEAD_SAMPLE_SIZE) {
      // Moderate number: evaluate all with lookahead (up to 200)
      candidatesToEvaluate = candidates
    } else {
      // Few candidates: skip lookahead, just use Medium scoring
      const best = evaluateActions(candidates)
      if (best) {
        unitOrder.push(unit._id)
        actionPlan.push(best)
      }
      continue
    }

    // Step 3: For each candidate, simulate the action and evaluate the resulting state
    let bestAction: AIAction | null = null
    let bestScore = -Infinity

    for (const candidate of candidatesToEvaluate) {
      const simState = simulateAction(
        { units: allUnits },
        candidate,
        ownerId,
        gameState.mapData,
      )
      const stateScore = evaluateState(simState, ownerId, gameState.mapData)

      // Step 4: Apply weighting bonuses
      let weightedScore = stateScore

      // +10% if action eliminates a unit (for attacks)
      if (candidate.type === 'attack') {
        const target = allUnits.find((u) => u._id === candidate.targetUnitId)
        if (target && candidate.score >= target.hp) {
          weightedScore += 10
        }
      }

      // +5% if claims high ground (for moves)
      if (
        candidate.type === 'move' &&
        candidate.targetX !== undefined &&
        candidate.targetY !== undefined
      ) {
        if (
          isOnHighGround(
            gameState.mapData,
            candidate.targetX,
            candidate.targetY,
          )
        ) {
          weightedScore += 5
        }
      }

      // +3% if reduces ally exposure (fewer enemies adjacent to allies after action)
      if (candidate.type === 'attack' || candidate.type === 'move') {
        const alliesAfter = simState.units.filter((u) => isAlly(u, ownerId))
        const enemiesAfter = simState.units.filter((u) => isEnemy(u, ownerId))
        const exposedAllies = alliesAfter.filter((a) =>
          isAdjacentToEnemy(a, enemiesAfter),
        ).length
        // Higher score for fewer exposed allies
        weightedScore += (alliesAfter.length - exposedAllies) * 3
      }

      weightedScore += candidate.score * 0.1 // Add Medium score as minor factor

      if (weightedScore > bestScore) {
        bestScore = weightedScore
        bestAction = { ...candidate, score: weightedScore }
      }
    }

    // Step 5: Fallback — if no action found, Medium evaluate
    if (!bestAction) {
      const best = evaluateActions(candidates)
      if (best) {
        bestAction = best
      } else {
        bestAction = {
          unitId: unit._id,
          type: 'wait',
          score: 0,
          description: 'wait',
        }
      }
    }

    unitOrder.push(unit._id)
    actionPlan.push(bestAction)
  }

  return { actions: actionPlan, unitOrder }
}

// ===========================================================================
// AI Decision
// ===========================================================================

function evaluateActions(actions: Array<AIAction>): AIAction | null {
  if (actions.length === 0) return null
  return actions.reduce((best, current) =>
    current.score > best.score ? current : best,
  )
}

function prioritizeUnits(
  units: Array<AIUnitState>,
  allUnits: Array<AIUnitState>,
): Array<AIUnitState> {
  // Process Medic first (heal), then attackers, then movers
  const ownerId = units[0]?.ownerId
  const enemies = allUnits.filter((u) => isEnemy(u, ownerId))

  return [...units].sort((a, b) => {
    // Medics go first
    if (a.type === 'M' && b.type !== 'M') return -1
    if (b.type === 'M' && a.type !== 'M') return 1

    // Then units that are in danger (adjacent to enemy)
    const aDanger = isAdjacentToEnemy(a, enemies) ? 1 : 0
    const bDanger = isAdjacentToEnemy(b, enemies) ? 1 : 0
    if (aDanger !== bDanger) return bDanger - aDanger

    // Then by unit type priority: C > K > R > E > A > S > M
    const priority: Record<string, number> = {
      C: 7,
      K: 6,
      R: 5,
      E: 4,
      A: 3,
      S: 2,
      M: 1,
    }
    return (priority[b.type] ?? 0) - (priority[a.type] ?? 0)
  })
}

export interface AIActionPlan {
  actions: Array<AIAction>
  unitOrder: Array<string> // Unit IDs in order of processing
}

export function getAIActions(
  aiUnits: Array<AIUnitState>,
  allUnits: Array<AIUnitState>,
  gameState: AIGameState,
  difficulty: AIDifficulty,
): AIActionPlan {
  // Hard difficulty uses one-step lookahead
  if (difficulty === 'hard') {
    return getHardActions(aiUnits, allUnits, gameState)
  }

  // Easy and Medium use direct scoring
  const actionPlan: Array<AIAction> = []
  const unitOrder: Array<string> = []

  const orderedUnits = prioritizeUnits(aiUnits, allUnits)

  for (const unit of orderedUnits) {
    if (unit.ap <= 0) continue

    const allActions: Array<AIAction> = []

    // Enumerate all possible actions for this unit
    allActions.push(
      ...enumerateMoveActions(unit, allUnits, gameState.mapData, difficulty),
    )
    allActions.push(
      ...enumerateAttackActions(unit, allUnits, gameState.mapData, difficulty),
    )
    allActions.push(
      ...enumerateHealActions(unit, allUnits, gameState.mapData, difficulty),
    )

    // Scan is always available
    allActions.push({
      unitId: unit._id,
      type: 'scan',
      targetX: unit.x,
      targetY: unit.y,
      score: difficulty === 'easy' ? Math.random() : 5,
      description: `scan at (${unit.x},${unit.y})`,
    })

    // Overwatch is available for non-Medic units
    if (unit.type !== 'M') {
      for (const dir of ['N', 'E', 'S', 'W'] as Array<Direction>) {
        allActions.push({
          unitId: unit._id,
          type: 'overwatch',
          direction: dir,
          score: difficulty === 'easy' ? Math.random() : 3,
          description: `overwatch facing ${dir}`,
        })
      }
    }

    const best = evaluateActions(allActions)
    if (best) {
      unitOrder.push(unit._id)
      actionPlan.push(best)
    }
  }

  return { actions: actionPlan, unitOrder }
}
