import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

export const seedGame = mutation({
  args: {},
  handler: async (ctx) => {
    const gameId = await ctx.db.insert('games', {
      turnNum: 1,
      currentPlayer: 'p1',
      status: 'playing',
      environmentFlags: [],
      mapData: {},
      isPublic: true,
    })

    await ctx.db.insert('units', {
      gameId,
      ownerId: 'p1',
      type: 'K',
      hp: 100,
      maxHp: 100,
      ap: 2,
      maxAp: 2,
      x: 2,
      y: 9,
      direction: 'N',
    })

    await ctx.db.insert('units', {
      gameId,
      ownerId: 'p1',
      type: 'A',
      hp: 60,
      maxHp: 60,
      ap: 2,
      maxAp: 2,
      x: 2,
      y: 10,
      direction: 'N',
    })

    await ctx.db.insert('units', {
      gameId,
      ownerId: 'p2',
      type: 'S',
      hp: 50,
      maxHp: 50,
      ap: 4,
      maxAp: 4,
      x: 8,
      y: 2,
      direction: 'S',
    })

    return gameId
  },
})

export const getGameState = query({
  args: { gameId: v.optional(v.id('games')) },
  handler: async (ctx, args) => {
    if (!args.gameId) {
      return null
    }

    const game = await ctx.db.get(args.gameId)
    if (!game) return null

    const units = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', game._id))
      .collect()

    return { ...game, units }
  },
})

export const logCommand = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    command: v.string(),
    result: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('logs', {
      gameId: args.gameId,
      playerId: args.playerId,
      commandString: args.command,
      result: args.result,
      timestamp: Date.now(),
    })
  },
})

export const getLogs = query({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('logs')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .order('asc')
      .collect()
  },
})
export const endTurn = mutation({
  args: { gameId: v.id('games'), playerId: v.string() },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') return

    const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2

    if (args.playerId !== expectedPlayer) {
      throw new Error('NOT_YOUR_TURN')
    }

    const nextPlayer = game.currentPlayer === 'p1' ? 'p2' : 'p1'
    await ctx.db.patch(args.gameId, {
      currentPlayer: nextPlayer,
      turnNum: game.turnNum + 1,
      lastActionTime: Date.now(),
    })

    // Restore AP for next player's units
    const nextUnits = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('ownerId'), nextPlayer))
      .collect()

    for (const unit of nextUnits) {
      await ctx.db.patch(unit._id, { ap: unit.maxAp })
    }
  },
})
