import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const checkDraftTimeout = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'drafting' || !game.draftStartTime) return

    const elapsed = Date.now() - game.draftStartTime
    if (elapsed > 95000) {
      // 90s + 5s buffer
      // Auto-forfeit whoever hasn't submitted
      // If both haven't, P1 loses (arbitrary, or just end game)
      const p1Ready = !!game.p1Squad
      const p2Ready = !!game.p2Squad

      if (!p1Ready && !p2Ready) {
        await ctx.db.patch(args.gameId, {
          status: 'finished',
          winner: undefined,
        })
      } else if (!p1Ready) {
        await ctx.db.patch(args.gameId, { status: 'finished', winner: game.p2 })
      } else if (!p2Ready) {
        await ctx.db.patch(args.gameId, { status: 'finished', winner: game.p1 })
      }
    }
  },
})

export const checkTurnTimeout = mutation({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing' || !game.turnStartTime) return

    const elapsed = Date.now() - game.turnStartTime
    if (elapsed > 95000) {
      // 90s + 5s buffer
      // Auto-end turn logic: same as game.endTurn but ignores playerId check
      const nextPlayer = game.currentPlayer === 'p1' ? 'p2' : 'p1'
      const patch: any = {
        currentPlayer: nextPlayer,
        turnNum: game.turnNum + 1,
        lastActionTime: Date.now(),
        turnStartTime: Date.now(),
        kernelPanicActive: undefined,
      }

      await ctx.db.patch(args.gameId, patch)

      // AP restoration logic (partial copy from game.ts endTurn)
      const nextUnits = await ctx.db
        .query('units')
        .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
        .filter((q) => q.eq(q.field('ownerId'), nextPlayer))
        .collect()

      for (const unit of nextUnits) {
        await ctx.db.patch(unit._id, { ap: unit.maxAp })
      }
    }
  },
})
