import { v } from 'convex/values'
import { isValidMove } from '../src/lib/movementValidator'
import { mutation } from './_generated/server'

export const moveUnit = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    unitId: v.id('units'),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') {
      throw new Error('INVALID_GAME_STATE')
    }

    // 1. Validate turn
    const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
    if (args.playerId !== expectedPlayer) {
      throw new Error('NOT_YOUR_TURN')
    }

    // 2. Fetch all units for collision check
    const allUnits = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .collect()

    const unit = allUnits.find((u) => u._id === args.unitId)
    if (!unit) {
      throw new Error('UNIT_NOT_FOUND')
    }

    if (unit.ownerId !== game.currentPlayer) {
      throw new Error('NOT_YOUR_UNIT')
    }

    // 3. Validate move using shared logic
    const validation = isValidMove(
      game.mapData,
      allUnits.map((u) => ({ _id: u._id, ownerId: u.ownerId, x: u.x, y: u.y })),
      unit._id,
      { x: args.targetX, y: args.targetY },
      unit.ap,
    )

    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    // 4. Calculate distance/cost
    const dx = Math.abs(unit.x - args.targetX)
    const dy = Math.abs(unit.y - args.targetY)
    const cost = dx + dy

    // 5. Calculate new direction
    let direction = unit.direction
    if (args.targetX > unit.x) direction = 'E'
    else if (args.targetX < unit.x) direction = 'W'
    else if (args.targetY > unit.y)
      direction = 'S' // SVG Y-axis: higher is down
    else if (args.targetY < unit.y) direction = 'N'

    // 6. Apply change
    await ctx.db.patch(unit._id, {
      x: args.targetX,
      y: args.targetY,
      ap: unit.ap - cost,
      direction,
    })

    return { success: true }
  },
})
