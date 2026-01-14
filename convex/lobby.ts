import { v } from 'convex/values'
import { mutation } from './_generated/server'

// Helper to generate a 4-character alphanumeric code
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Removed ambiguous O, 0, I, 1
  let result = ''
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export const createLobbyHandler = async (ctx: any, args: any) => {
  let code = generateCode()

  // Check for collision (rare for 4-char but possible)
  let existing = await ctx.db
    .query('games')
    .withIndex('by_code', (q: any) => q.eq('code', code))
    .unique()

  while (existing) {
    code = generateCode()
    existing = await ctx.db
      .query('games')
      .withIndex('by_code', (q: any) => q.eq('code', code))
      .unique()
  }

  const gameId = await ctx.db.insert('games', {
    turnNum: 1,
    currentPlayer: 'p1',
    status: 'lobby',
    environmentFlags: [],
    mapData: {},
    isPublic: args.isPublic,
    code: code,
    p1: args.p1,
    lastActionTime: Date.now(),
  })

  return { gameId, code }
}

export const createLobby = mutation({
  args: {
    isPublic: v.boolean(),
    p1: v.string(), // player handle or ID
  },
  handler: createLobbyHandler,
})

export const joinLobby = mutation({
  args: {
    code: v.string(),
    p2: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db
      .query('games')
      .withIndex('by_code', (q) => q.eq('code', args.code.toUpperCase()))
      .unique()

    if (!game) {
      throw new Error('LOBBY_NOT_FOUND')
    }

    if (game.status !== 'lobby') {
      throw new Error('GAME_ALREADY_STARTED')
    }

    if (game.p2) {
      throw new Error('LOBBY_FULL')
    }

    await ctx.db.patch(game._id, {
      p2: args.p2,
      status: 'drafting',
      lastActionTime: Date.now(),
      draftStartTime: Date.now(),
    })

    return game._id
  },
})

export const joinQuickPlay = mutation({
  args: {
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    // Look for an open public lobby
    const openLobby = await ctx.db
      .query('games')
      .withIndex('by_status', (q) => q.eq('status', 'lobby'))
      .filter((q) => q.eq(q.field('isPublic'), true))
      .first()

    if (openLobby) {
      await ctx.db.patch(openLobby._id, {
        p2: args.playerId,
        status: 'drafting',
        lastActionTime: Date.now(),
        draftStartTime: Date.now(),
      })

      return openLobby._id
    }

    // Create new public lobby if none found
    const code = generateCode()
    return await ctx.db.insert('games', {
      turnNum: 1,
      currentPlayer: 'p1',
      status: 'lobby',
      environmentFlags: [],
      mapData: {},
      isPublic: true,
      code: code,
      p1: args.playerId,
      lastActionTime: Date.now(),
    })
  },
})

export const setTyping = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    isTyping: v.boolean(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) return

    if (game.p1 === args.playerId) {
      await ctx.db.patch(args.gameId, { p1Typing: args.isTyping })
    } else if (game.p2 === args.playerId) {
      await ctx.db.patch(args.gameId, { p2Typing: args.isTyping })
    }
  },
})
