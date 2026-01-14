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
      p1RevealedTiles: [],
      p2RevealedTiles: [],
    })

    await ctx.db.insert('units', {
      gameId,
      ownerId: 'p1',
      type: 'K',
      hp: 100,
      maxHp: 100,
      atk: 30,
      rng: 1,
      vis: 3,
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
      atk: 20,
      rng: 5,
      vis: 5,
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
      atk: 15,
      rng: 2,
      vis: 4,
      ap: 4,
      maxAp: 4,
      x: 8,
      y: 2,
      direction: 'S',
      isStealthed: true,
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
    const patch: any = {
      currentPlayer: nextPlayer,
      turnNum: game.turnNum + 1,
      lastActionTime: Date.now(),
      turnStartTime: Date.now(),
      kernelPanicActive: undefined, // Clear any previous panic
    }

    // Passive RAP gain: +1 every 3 turns for both players
    if ((game.turnNum + 1) % 3 === 0) {
      patch.p1Rap = Math.min((game.p1Rap || 0) + 1, 3)
      patch.p2Rap = Math.min((game.p2Rap || 0) + 1, 3)
    }

    // Random Kernel Panic: 20% chance each turn after turn 3
    if (game.turnNum >= 3 && Math.random() < 0.2) {
      const panics = ['SEGFAULT', 'OVERCLOCK', 'REBOOT']
      const event = panics[Math.floor(Math.random() * panics.length)]
      patch.kernelPanicActive = event

      if (event === 'REBOOT') {
        const units = await ctx.db
          .query('units')
          .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
          .collect()
        await applyReboot(ctx, units)
      }
    }

    await ctx.db.patch(args.gameId, patch)

    // Restore AP for next player's units
    const nextUnits = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('ownerId'), nextPlayer))
      .collect()

    for (const unit of nextUnits) {
      const unitPatch: any = { ap: unit.maxAp }

      // SEGFAULT effect: Lose 1 AP starting turn
      if (patch.kernelPanicActive === 'SEGFAULT') {
        unitPatch.ap = Math.max(0, unit.maxAp - 1)
      }

      // Clear overwatch when starting turn
      if (unit.isOverwatching) {
        unitPatch.isOverwatching = false
        unitPatch.overwatchDirection = undefined
      }
      // Re-cloak Scouts if not adjacent to enemies
      if (unit.type === 'S' && !unit.isStealthed) {
        unitPatch.isStealthed = true
      }
      await ctx.db.patch(unit._id, unitPatch)
    }
  },
})

async function applyReboot(ctx: any, units: Array<any>) {
  const directions = [
    { dx: 0, dy: -1 }, // N
    { dx: 1, dy: 0 }, // E
    { dx: 0, dy: 1 }, // S
    { dx: -1, dy: 0 }, // W
  ]

  for (const unit of units) {
    const dir = directions[Math.floor(Math.random() * directions.length)]
    const newX = Math.max(0, Math.min(11, unit.x + dir.dx))
    const newY = Math.max(0, Math.min(11, unit.y + dir.dy))

    // Note: In REBOOT units can collide or stack, which adds to the chaos
    // but the design says "shuffle", so we just move them.
    await ctx.db.patch(unit._id, { x: newX, y: newY })
  }
}
