import type { MapData } from './mapGenerator'

export interface Coord {
  x: number
  y: number
}

export interface Unit {
  _id: string
  ownerId: string
  x: number
  y: number
}

export function calculateManhattanDistance(a: Coord, b: Coord): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
}

export function isValidMove(
  map: MapData,
  units: Array<Unit>,
  unitId: string,
  target: Coord,
  maxAp: number,
): { valid: boolean; reason?: string } {
  // 1. Boundary check
  if (
    target.x < 0 ||
    target.x >= map.width ||
    target.y < 0 ||
    target.y >= map.height
  ) {
    return { valid: false, reason: 'OUT_OF_BOUNDS' }
  }

  // 2. Tile type check (cannot move into walls)
  if (map.tiles[target.y][target.x] === 'wall') {
    return { valid: false, reason: 'OBSTRUCTED_BY_WALL' }
  }

  // 3. Find moving unit
  const unit = units.find((u) => u._id === unitId)
  if (!unit) {
    return { valid: false, reason: 'UNIT_NOT_FOUND' }
  }

  // 4. Distance check (AP cost)
  const distance = calculateManhattanDistance({ x: unit.x, y: unit.y }, target)
  if (distance === 0) {
    return { valid: false, reason: 'STATIONARY_MOVE' }
  }
  if (distance > maxAp) {
    return { valid: false, reason: 'INSUFFICIENT_AP' }
  }

  // 5. Unit collision check (cannot overlap with other units)
  const isOccupied = units.some(
    (u) => u._id !== unitId && u.x === target.x && u.y === target.y,
  )
  if (isOccupied) {
    return { valid: false, reason: 'OBSTRUCTED_BY_UNIT' }
  }

  // Note: For MVP, we allow moving through other units (as long as target is free)
  // but pathfinding might be needed for Phase 5 if we want strict LoS/collision.
  // For now, simplicity is tactical.

  return { valid: true }
}
