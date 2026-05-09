import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { recordGameEndHandler } from './players'

const GRACE_PERIOD_MS = 120_000 // 2 minutes

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
        // Guard: Both failed to submit — game never reached "playing" status
        // Do NOT record stats (not a real match per spec)
        await ctx.db.patch(args.gameId, {
          status: 'finished',
          winner: undefined,
        })
      } else if (!p1Ready) {
        await ctx.db.patch(args.gameId, { status: 'finished', winner: game.p2 })
        await recordGameEndHandler(ctx, {
          gameId: args.gameId,
          p1Id: game.p1 ?? '',
          p2Id: game.p2 ?? '',
          winner: 'p2',
          endReason: 'timeout',
          turns: 0,
          duration: Date.now() - (game.draftStartTime ?? Date.now()),
        })
      } else if (!p2Ready) {
        await ctx.db.patch(args.gameId, { status: 'finished', winner: game.p1 })
        await recordGameEndHandler(ctx, {
          gameId: args.gameId,
          p1Id: game.p1 ?? '',
          p2Id: game.p2 ?? '',
          winner: 'p1',
          endReason: 'timeout',
          turns: 0,
          duration: Date.now() - (game.draftStartTime ?? Date.now()),
        })
      }
    }
  },
})

export const checkTurnTimeout = mutation({
  args: { gameId: v.id('games'), now: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing' || !game.turnStartTime) return

    const now = args.now ?? Date.now()
    const elapsed = now - game.turnStartTime

    // Timer pause: If the current player is disconnected, don't advance the turn
    const isCurrentPlayerDisconnected =
      game.currentPlayer === 'p1'
        ? game.p1Status === 'disconnected'
        : game.p2Status === 'disconnected'

    if (isCurrentPlayerDisconnected) return

    if (elapsed > 95000) {
      // 90s + 5s buffer
      // Auto-end turn logic: same as game.endTurn but ignores playerId check
      const nextPlayer = game.currentPlayer === 'p1' ? 'p2' : 'p1'
      const patch: any = {
        currentPlayer: nextPlayer,
        turnNum: game.turnNum + 1,
        lastActionTime: now,
        turnStartTime: now,
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

// ===========================================================================
// Grace Period
// ===========================================================================

export const checkDisconnectGracePeriod = mutation({
  args: { gameId: v.id('games'), now: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') return

    const now = args.now ?? Date.now()

    // Grace period only applies when someone is actually disconnected
    if (game.disconnectStartTime === undefined) return
    if (game.p1Status !== 'disconnected' && game.p2Status !== 'disconnected')
      return

    const elapsed = now - game.disconnectStartTime
    if (elapsed < GRACE_PERIOD_MS) return

    // Grace period expired — determine outcome
    const bothDisconnected =
      game.p1Status === 'disconnected' && game.p2Status === 'disconnected'

    if (bothDisconnected) {
      // Draw — no winner
      await ctx.db.patch(args.gameId, {
        status: 'finished',
        winner: undefined,
      })
      await recordGameEndHandler(ctx, {
        gameId: args.gameId,
        p1Id: game.p1 ?? '',
        p2Id: game.p2 ?? '',
        winner: null,
        endReason: 'disconnect',
        turns: game.turnNum,
        duration:
          Date.now() -
          (game.gameStartTime ?? game.draftStartTime ?? Date.now()),
      })
      return
    }

    // Single player disconnect: the disconnected player forfeits
    if (game.p1Status === 'disconnected') {
      await ctx.db.patch(args.gameId, {
        status: 'finished',
        winner: game.p2,
      })
      await recordGameEndHandler(ctx, {
        gameId: args.gameId,
        p1Id: game.p1 ?? '',
        p2Id: game.p2 ?? '',
        winner: 'p2',
        endReason: 'disconnect',
        turns: game.turnNum,
        duration:
          Date.now() -
          (game.gameStartTime ?? game.draftStartTime ?? Date.now()),
      })
    } else {
      await ctx.db.patch(args.gameId, {
        status: 'finished',
        winner: game.p1,
      })
      await recordGameEndHandler(ctx, {
        gameId: args.gameId,
        p1Id: game.p1 ?? '',
        p2Id: game.p2 ?? '',
        winner: 'p1',
        endReason: 'disconnect',
        turns: game.turnNum,
        duration:
          Date.now() -
          (game.gameStartTime ?? game.draftStartTime ?? Date.now()),
      })
    }
  },
})

export const getRemainingGraceTime = query({
  args: { gameId: v.id('games'), now: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.disconnectStartTime === undefined) return null

    const now = args.now ?? Date.now()
    const elapsed = now - game.disconnectStartTime
    const remaining = GRACE_PERIOD_MS - elapsed

    return Math.max(0, remaining)
  },
})
