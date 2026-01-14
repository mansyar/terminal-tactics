import type { MapData } from './mapGenerator'
import type { Coord } from './movementValidator'

export type Direction = 'N' | 'E' | 'S' | 'W'
export type UnitType = 'K' | 'A' | 'S' | 'M'

export interface CombatUnit {
  type: UnitType
  x: number
  y: number
  direction: Direction
  hp: number
  maxHp: number
}

/**
 * Bresenham's Line Algorithm to check Line of Sight between two coordinates.
 * Walls (#) block LoS. Units do not block LoS.
 */
export function hasLineOfSight(from: Coord, to: Coord, map: MapData): boolean {
  let x0 = from.x
  let y0 = from.y
  const x1 = to.x
  const y1 = to.y

  const dx = Math.abs(x1 - x0)
  const dy = Math.abs(y1 - y0)
  const sx = x0 < x1 ? 1 : -1
  const sy = y0 < y1 ? 1 : -1
  let err = dx - dy

  // Initial tile is always clear (where the attacker is)
  // We check tiles between from and to
  while (x0 !== x1 || y0 !== y1) {
    if ((x0 !== from.x || y0 !== from.y) && (x0 !== to.x || y0 !== to.y)) {
      if (map.tiles[y0][x0] === 'wall') return false
    }

    const e2 = 2 * err
    if (e2 > -dy) {
      err -= dy
      x0 += sx
    }
    if (e2 < dx) {
      err += dx
      y0 += sy
    }
  }

  // Edge case: check the target tile itself if it's a wall (though combat usually targets units on floor)
  // But for scan/moving, we might want to know if the target is visible.
  // In combat, if target is a wall, LoS is technically "to the wall".
  // But here we return true if we reached the end without hitting a wall.
  return true
}

/**
 * Calculates the damage multiplier based on attacker position relative to defender facing.
 * Front: 1.0, Flank: 1.25, Rear: 1.5
 */
export function getPositionMultiplier(
  attackerPos: Coord,
  defenderPos: Coord,
  defenderDir: Direction,
): { multiplier: number; zone: 'front' | 'flank' | 'rear' } {
  const dx = attackerPos.x - defenderPos.x
  const dy = attackerPos.y - defenderPos.y

  let zone: 'front' | 'flank' | 'rear' = 'front'

  switch (defenderDir) {
    case 'N':
      if (dy < 0) zone = 'front'
      else if (dy > 0) zone = 'rear'
      else zone = 'flank'
      break
    case 'S':
      if (dy > 0) zone = 'front'
      else if (dy < 0) zone = 'rear'
      else zone = 'flank'
      break
    case 'E':
      if (dx > 0) zone = 'front'
      else if (dx < 0) zone = 'rear'
      else zone = 'flank'
      break
    case 'W':
      if (dx < 0) zone = 'front'
      else if (dx > 0) zone = 'rear'
      else zone = 'flank'
      break
  }

  const multipliers = {
    front: 1.0,
    flank: 1.25,
    rear: 1.5,
  }

  return { multiplier: multipliers[zone], zone }
}

/**
 * Validates if target is within attack range.
 * Elevation bonus: +1 range if attacker is on high ground.
 */
export function isInRange(
  attackerPos: Coord,
  targetPos: Coord,
  baseRange: number,
  attackerOnHighGround: boolean,
): boolean {
  const actualRange = attackerOnHighGround ? baseRange + 1 : baseRange
  const dist =
    Math.abs(attackerPos.x - targetPos.x) +
    Math.abs(attackerPos.y - targetPos.y)
  return dist <= actualRange
}

/**
 * Master damage formula.
 * Final Damage = floor((ATK × PositionMultiplier × ShieldMultiplier) + ElevationBonus)
 */
export function calculateDamage(
  attacker: { type: UnitType; atk: number; x: number; y: number },
  defender: { type: UnitType; x: number; y: number; direction: Direction },
  attackerOnHighGround: boolean,
): {
  damage: number
  zone: 'front' | 'flank' | 'rear'
  shieldApplied: boolean
} {
  const { multiplier, zone } = getPositionMultiplier(
    attacker,
    defender,
    defenderDirFix(defender.direction),
  )

  let shieldMultiplier = 1.0
  let shieldApplied = false
  if (defender.type === 'K' && zone === 'front') {
    shieldMultiplier = 0.8
    shieldApplied = true
  }

  const elevationBonus = attackerOnHighGround ? 10 : 0

  const finalDamage = Math.floor(
    attacker.atk * multiplier * shieldMultiplier + elevationBonus,
  )

  return { damage: finalDamage, zone, shieldApplied }
}

// Helper to ensure direction type alignment if needed, though they match now
function defenderDirFix(dir: string): Direction {
  return dir as Direction
}

/**
 * Filter hostiles that should be revealed by a scan.
 * Scouts are immune to scan detection (stealth technology).
 */
export function getScannedHostiles(
  units: Array<{ type: string; ownerId: string }>,
  scannerOwnerId: string,
): Array<{ type: string }> {
  return units.filter(
    (u) => u.ownerId !== scannerOwnerId && u.type !== 'S',
  ) as Array<{ type: string }>
}
