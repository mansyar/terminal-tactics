import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const sendMessage = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) throw new Error('GAME_NOT_FOUND')

    await ctx.db.insert('logs', {
      gameId: args.gameId,
      playerId: args.playerId,
      commandString: `SAY: ${args.message}`,
      result: `CHAT: [${args.playerId}] ${args.message}`,
      timestamp: Date.now(),
    })
  },
})
