import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { createLobbyHandler } from './lobby'

// Standalone handlers for testing
export const initiateRematchHandler = async (ctx: any, args: any) => {
  const game = await ctx.db.get(args.gameId)

  if (!game) {
    throw new Error('GAME_NOT_FOUND')
  }

  if (game.status !== 'finished') {
    throw new Error('GAME_NOT_FINISHED')
  }

  if (game.p1 !== args.playerId && game.p2 !== args.playerId) {
    throw new Error('NOT_YOUR_GAME')
  }

  // Create a new private lobby for the rematch
  const lobby = await createLobbyHandler(ctx, {
    isPublic: false,
    p1: game.p1,
  })

  // Patch the finished game with rematch info
  await ctx.db.patch(args.gameId, {
    rematchCode: lobby.code,
    rematchLobbyId: lobby.gameId,
  })

  return { gameId: lobby.gameId, code: lobby.code }
}

export const getRematchInfoHandler = async (ctx: any, args: any) => {
  const game = await ctx.db.get(args.gameId)

  if (!game || game.status !== 'finished') {
    return null
  }

  if (game.rematchCode && game.rematchLobbyId) {
    return {
      rematchCode: game.rematchCode,
      rematchLobbyId: game.rematchLobbyId,
    }
  }

  return null
}

export const clearRematchHandler = async (ctx: any, args: any) => {
  await ctx.db.patch(args.gameId, {
    rematchCode: undefined,
    rematchLobbyId: undefined,
  })
}

// Convex mutation/query wrappers
export const initiateRematch = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
  },
  handler: initiateRematchHandler,
})

export const getRematchInfo = query({
  args: {
    gameId: v.id('games'),
  },
  handler: getRematchInfoHandler,
})

export const clearRematch = mutation({
  args: {
    gameId: v.id('games'),
  },
  handler: clearRematchHandler,
})
