import { v } from 'convex/values'
import { mutation } from './_generated/server'

export const sudoMove = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    unitId: v.id('units'),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    const isP1 = game.p1 === args.playerId
    const role = isP1 ? 'p1' : 'p2'
    if (game.currentPlayer !== role) throw new Error('NOT_YOUR_TURN')

    const rapField = isP1 ? 'p1Rap' : 'p2Rap'
    const rap = game[rapField] || 0
    if (rap < 1) throw new Error('INSUFFICIENT_RAP')

    const unit = await ctx.db.get(args.unitId)
    if (!unit || unit.ownerId !== role) throw new Error('NOT_YOUR_UNIT')

    // Sudo Move ignores walls, collision, and AP
    await ctx.db.patch(unit._id, {
      x: args.targetX,
      y: args.targetY,
      isStealthed: false,
    })

    await ctx.db.patch(game._id, {
      [rapField]: rap - 1,
    })

    return { success: true }
  },
})

export const sudoScan = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    const isP1 = game.p1 === args.playerId
    const role = isP1 ? 'p1' : 'p2'
    if (game.currentPlayer !== role) throw new Error('NOT_YOUR_TURN')

    const rapField = isP1 ? 'p1Rap' : 'p2Rap'
    const rap = game[rapField] || 0
    if (rap < 1) throw new Error('INSUFFICIENT_RAP')

    // Reveal entire map (12x12)
    const allTiles = []
    for (let y = 0; y < 12; y++) {
      for (let x = 0; x < 12; x++) {
        allTiles.push(`${x},${y}`)
      }
    }

    const revealedField = isP1 ? 'p1RevealedTiles' : 'p2RevealedTiles'
    await ctx.db.patch(game._id, {
      [revealedField]: allTiles,
      [rapField]: rap - 1,
    })

    return { success: true }
  },
})

export const sudoAttack = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    attackerId: v.id('units'),
    targetId: v.id('units'),
    damage: v.number(), // Pre-calculated on client or we recalculate here?
    // Plan says "Attack ignores LoS, deals 200% damage".
    // Recalculating here is safer.
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    const isP1 = game.p1 === args.playerId
    const role = isP1 ? 'p1' : 'p2'
    if (game.currentPlayer !== role) throw new Error('NOT_YOUR_TURN')

    const rapField = isP1 ? 'p1Rap' : 'p2Rap'
    const rap = game[rapField] || 0
    if (rap < 1) throw new Error('INSUFFICIENT_RAP')

    const attacker = await ctx.db.get(args.attackerId)
    const target = await ctx.db.get(args.targetId)

    if (!attacker || !target) throw new Error('UNIT_NOT_FOUND')
    if (attacker.ownerId !== role) throw new Error('NOT_YOUR_UNIT')
    if (target.ownerId === role) throw new Error('CANNOT_ATTACK_ALLY')

    // Sudo Attack deals 200% base damage, ignoring LoS and shield
    const baseDamage = attacker.atk || 0
    const damage = baseDamage * 2
    const newHp = Math.max(0, target.hp - damage)

    await ctx.db.patch(target._id, { hp: newHp })

    if (newHp === 0) {
      await ctx.db.delete(target._id)

      // Check Win Condition
      const remainingEnemyUnits = await ctx.db
        .query('units')
        .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
        .filter((q) => q.eq(q.field('ownerId'), target.ownerId))
        .collect()

      if (remainingEnemyUnits.length === 0) {
        await ctx.db.patch(args.gameId, {
          status: 'finished',
          winner: attacker.ownerId,
        })
      }
    }

    await ctx.db.patch(game._id, {
      [rapField]: rap - 1,
    })

    return { success: true, damage, destroyed: newHp === 0 }
  },
})
