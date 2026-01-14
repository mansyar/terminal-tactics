import { v } from 'convex/values'
import { generateMap } from '../src/lib/mapGenerator'
import { mutation } from './_generated/server'

export const UNIT_TEMPLATES: Record<string, any> = {
  K: { cost: 300, hp: 100, ap: 2, atk: 30, rng: 1, vis: 3, label: 'Knight' },
  A: { cost: 200, hp: 60, ap: 2, atk: 20, rng: 5, vis: 5, label: 'Archer' },
  S: { cost: 150, hp: 50, ap: 4, atk: 15, rng: 2, vis: 4, label: 'Scout' },
  M: { cost: 250, hp: 70, ap: 3, atk: 0, rng: 2, vis: 3, label: 'Medic' },
}

export const submitDraft = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    squad: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'drafting') {
      throw new Error('INVALID_GAME_STATE')
    }

    // Validate budget
    let totalCost = 0
    for (const type of args.squad) {
      const template = UNIT_TEMPLATES[type]
      if (!template) throw new Error('INVALID_UNIT_TYPE')
      totalCost += template.cost
    }

    if (totalCost > 1000) {
      throw new Error('BUDGET_EXCEEDED')
    }

    // Update player squad
    const isP1 = game.p1 === args.playerId
    const isP2 = game.p2 === args.playerId

    if (!isP1 && !isP2) throw new Error('NOT_A_PLAYER')

    if (isP1) {
      await ctx.db.patch(args.gameId, { p1Squad: args.squad })
    } else {
      await ctx.db.patch(args.gameId, { p2Squad: args.squad })
    }

    // Check if both ready
    const updatedGame = await ctx.db.get(args.gameId)
    if (updatedGame && updatedGame.p1Squad && updatedGame.p2Squad) {
      await startGame(ctx, args.gameId)
    }
  },
})

async function startGame(ctx: any, gameId: any) {
  const game = await ctx.db.get(gameId)
  if (!game) return

  // Generate Map
  const mapData = generateMap(12, 12)

  // Spawn Units
  // P1 spawn: bottom rows (y=10, 11)
  if (game.p1Squad) {
    for (let i = 0; i < game.p1Squad.length; i++) {
      const type = game.p1Squad[i]
      const t = UNIT_TEMPLATES[type]
      await ctx.db.insert('units', {
        gameId,
        ownerId: 'p1',
        type,
        hp: t.hp,
        maxHp: t.hp,
        atk: t.atk,
        rng: t.rng,
        vis: t.vis,
        ap: t.ap,
        maxAp: t.ap,
        x: 2 + i, // Spread out a bit
        y: 10,
        direction: 'N',
        isStealthed: type === 'S',
      })
    }
  }

  // P2 spawn: top rows (y=0, 1)
  if (game.p2Squad) {
    for (let i = 0; i < game.p2Squad.length; i++) {
      const type = game.p2Squad[i]
      const t = UNIT_TEMPLATES[type]
      await ctx.db.insert('units', {
        gameId,
        ownerId: 'p2',
        type,
        hp: t.hp,
        maxHp: t.hp,
        atk: t.atk,
        rng: t.rng,
        vis: t.vis,
        ap: t.ap,
        maxAp: t.ap,
        x: 2 + i,
        y: 1,
        direction: 'S',
        isStealthed: type === 'S',
      })
    }
  }

  await ctx.db.patch(gameId, {
    status: 'playing',
    mapData,
    lastActionTime: Date.now(),
    turnStartTime: Date.now(),
    p1Rap: 0,
    p2Rap: 0,
    p1RevealedTiles: [], // Initial vision calculated on first fetch/move or here
    p2RevealedTiles: [],
  })
}
