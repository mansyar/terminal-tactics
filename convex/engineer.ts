import { v } from 'convex/values'
import { mutation } from './_generated/server'

// ===========================================================================
// buildWallHandler — standalone handler for testing
// ===========================================================================
export const buildWallHandler = async (
  ctx: any,
  args: {
    gameId: any
    playerId: string
    unitId: any
    targetX: number
    targetY: number
  },
) => {
  const game = await ctx.db.get(args.gameId)
  if (!game || game.status !== 'playing') throw new Error('INVALID_GAME_STATE')

  const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
  if (args.playerId !== expectedPlayer) throw new Error('NOT_YOUR_TURN')

  const unit = await ctx.db.get(args.unitId)
  if (!unit) throw new Error('UNIT_NOT_FOUND')
  if (unit.ownerId !== game.currentPlayer) throw new Error('NOT_YOUR_UNIT')
  if (unit.type !== 'E') throw new Error('NOT_AN_ENGINEER')

  // AP Check
  if (unit.ap < 1) throw new Error('INSUFFICIENT_AP')

  // Adjacency Check (Manhattan distance must be 1 — orthogonal adjacent)
  const dist = Math.abs(unit.x - args.targetX) + Math.abs(unit.y - args.targetY)
  if (dist !== 1) throw new Error('NOT_ADJACENT')

  // Bounds Check
  if (
    args.targetX < 0 ||
    args.targetX >= 12 ||
    args.targetY < 0 ||
    args.targetY >= 12
  ) {
    throw new Error('OUT_OF_BOUNDS')
  }

  // Terrain Check — must be floor
  const targetTile = game.mapData.tiles[args.targetY]?.[args.targetX]
  if (targetTile !== 'floor') throw new Error('INVALID_TARGET_TILE')

  // Occupancy Check — no other unit on target tile
  const allUnits = await ctx.db
    .query('units')
    .withIndex('by_gameId', (q: any) => q.eq('gameId', args.gameId))
    .collect()
  const hasUnitAtTarget = allUnits.some(
    (u: any) => u.x === args.targetX && u.y === args.targetY,
  )
  if (hasUnitAtTarget) throw new Error('TILE_OCCUPIED')

  // EngineerWallCount Check — must have remaining build uses
  if (unit.engineerWallCount !== undefined && unit.engineerWallCount <= 0) {
    throw new Error('NO_BUILDS_REMAINING')
  }

  // Update mapData — set target tile to wall
  const newTiles = game.mapData.tiles.map((row: Array<string>) => [...row])
  newTiles[args.targetY][args.targetX] = 'wall'

  await ctx.db.patch(game._id, {
    mapData: { ...game.mapData, tiles: newTiles },
  })

  // Deduct AP and decrement build count
  const newWallCount =
    unit.engineerWallCount !== undefined
      ? unit.engineerWallCount - 1
      : undefined
  const patchFields: Record<string, any> = { ap: unit.ap - 1 }
  if (newWallCount !== undefined) {
    patchFields.engineerWallCount = newWallCount
  }
  await ctx.db.patch(unit._id, patchFields)

  return { success: true }
}

// ===========================================================================
// buildWall — Convex mutation wrapper
// ===========================================================================
export const buildWall = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    unitId: v.id('units'),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, args) => {
    return buildWallHandler(ctx, args)
  },
})

// ===========================================================================
// demolishWallHandler — standalone handler for testing
// ===========================================================================
export const demolishWallHandler = async (
  ctx: any,
  args: {
    gameId: any
    playerId: string
    unitId: any
    targetX: number
    targetY: number
  },
) => {
  const game = await ctx.db.get(args.gameId)
  if (!game || game.status !== 'playing') throw new Error('INVALID_GAME_STATE')

  const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
  if (args.playerId !== expectedPlayer) throw new Error('NOT_YOUR_TURN')

  const unit = await ctx.db.get(args.unitId)
  if (!unit) throw new Error('UNIT_NOT_FOUND')
  if (unit.ownerId !== game.currentPlayer) throw new Error('NOT_YOUR_UNIT')
  if (unit.type !== 'E') throw new Error('NOT_AN_ENGINEER')

  // AP Check
  if (unit.ap < 1) throw new Error('INSUFFICIENT_AP')

  // Adjacency Check
  const dist = Math.abs(unit.x - args.targetX) + Math.abs(unit.y - args.targetY)
  if (dist !== 1) throw new Error('NOT_ADJACENT')

  // Bounds Check
  if (
    args.targetX < 0 ||
    args.targetX >= 12 ||
    args.targetY < 0 ||
    args.targetY >= 12
  ) {
    throw new Error('OUT_OF_BOUNDS')
  }

  // Terrain Check — must be wall
  const targetTile = game.mapData.tiles[args.targetY]?.[args.targetX]
  if (targetTile !== 'wall') throw new Error('NOT_A_WALL')

  // Update mapData — set target tile back to floor
  const newTiles = game.mapData.tiles.map((row: Array<string>) => [...row])
  newTiles[args.targetY][args.targetX] = 'floor'

  await ctx.db.patch(game._id, {
    mapData: { ...game.mapData, tiles: newTiles },
  })

  // Deduct AP and restore build count
  const newWallCount =
    unit.engineerWallCount !== undefined
      ? unit.engineerWallCount + 1
      : undefined
  const patchFields: Record<string, any> = { ap: unit.ap - 1 }
  if (newWallCount !== undefined) {
    patchFields.engineerWallCount = newWallCount
  }
  await ctx.db.patch(unit._id, patchFields)

  return { success: true }
}

// ===========================================================================
// demolishWall — Convex mutation wrapper
// ===========================================================================
export const demolishWall = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    unitId: v.id('units'),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, args) => {
    return demolishWallHandler(ctx, args)
  },
})
