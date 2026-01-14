import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const forfeit = mutation({
  args: { gameId: v.id('games'), playerId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') return

    const isP1 = game.p1 === args.playerId
    const isP2 = game.p2 === args.playerId
    if (!isP1 && !isP2) throw new Error('NOT_A_PLAYER')

    await ctx.db.patch(args.gameId, {
      status: 'finished',
      winner: isP1 ? game.p2 : game.p1,
    })
  },
})

export const offerDraw = mutation({
  args: { gameId: v.id('games'), playerId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') return

    const isP1 = game.p1 === args.playerId
    const isP2 = game.p2 === args.playerId
    if (!isP1 && !isP2) throw new Error('NOT_A_PLAYER')

    await ctx.db.patch(args.gameId, {
      drawOffer: isP1 ? 'p1' : 'p2',
    })
  },
})

export const acceptDraw = mutation({
  args: { gameId: v.id('games'), playerId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') return

    const isP1 = game.p1 === args.playerId
    const isP2 = game.p2 === args.playerId
    if (!isP1 && !isP2) throw new Error('NOT_A_PLAYER')

    if (!game.drawOffer) throw new Error('NO_DRAW_OFFER')

    // Cannot accept your own offer
    const myRole = isP1 ? 'p1' : 'p2'
    if (game.drawOffer === myRole) throw new Error('CANNOT_ACCEPT_OWN_OFFER')

    await ctx.db.patch(args.gameId, {
      status: 'finished',
      winner: undefined, // It's a draw
      drawOffer: undefined,
    })
  },
})
