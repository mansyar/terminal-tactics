import { v } from 'convex/values'
import { mutation } from './_generated/server'

// ===========================================================================
// useRallyHandler — standalone handler for testing
// ===========================================================================
export const useRallyHandler = async (
  ctx: any,
  args: {
    gameId: any
    playerId: string
    commanderId: any
    targetX: number
    targetY: number
  },
) => {
  const game = await ctx.db.get(args.gameId)
  if (!game || game.status !== 'playing') throw new Error('INVALID_GAME_STATE')

  const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
  if (args.playerId !== expectedPlayer) throw new Error('NOT_YOUR_TURN')

  const commander = await ctx.db.get(args.commanderId)
  if (!commander) throw new Error('UNIT_NOT_FOUND')
  if (commander.ownerId !== game.currentPlayer) throw new Error('NOT_YOUR_UNIT')
  if (commander.type !== 'C') throw new Error('NOT_A_COMMANDER')

  // AP Check
  if (commander.ap < 1) throw new Error('INSUFFICIENT_AP')

  // Check bounds
  if (
    args.targetX < 0 ||
    args.targetX >= 12 ||
    args.targetY < 0 ||
    args.targetY >= 12
  ) {
    throw new Error('OUT_OF_BOUNDS')
  }

  // Collect all units in the game
  const allUnits = await ctx.db
    .query('units')
    .withIndex('by_gameId', (q: any) => q.eq('gameId', args.gameId))
    .collect()

  // Find the target unit at the specified coordinate
  const targetUnit = allUnits.find(
    (u: any) => u.x === args.targetX && u.y === args.targetY,
  )
  if (!targetUnit) throw new Error('NO_UNIT_AT_TARGET')

  // Target must be a friendly unit (same owner)
  if (targetUnit.ownerId !== game.currentPlayer)
    throw new Error('NOT_YOUR_UNIT')

  // Adjacency check (Manhattan distance ≤ 1 — orthogonal or same tile for self-target)
  const dist =
    Math.abs(commander.x - args.targetX) + Math.abs(commander.y - args.targetY)
  if (dist > 1) throw new Error('NOT_ADJACENT')

  // Apply rally: directly increment target's AP by 1 (auto-cleaned at turn end by AP reset)
  const newAp = targetUnit.ap + 1
  await ctx.db.patch(targetUnit._id, { ap: newAp })

  // Deduct Commander's AP
  await ctx.db.patch(commander._id, { ap: commander.ap - 1 })

  return { success: true }
}

// ===========================================================================
// useRally — Convex mutation wrapper
// ===========================================================================
export const useRally = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    commanderId: v.id('units'),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, args) => {
    return useRallyHandler(ctx, args)
  },
})
