import { v } from 'convex/values'
import {
  calculateDamage,
  getScannedHostiles,
  hasLineOfSight,
  isInRange,
} from '../src/lib/combatSystem'
import { mutation } from './_generated/server'

export const attackUnit = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    attackerId: v.id('units'),
    targetId: v.id('units'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    // 1. Ownership & Turn Check
    const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
    if (args.playerId !== expectedPlayer) throw new Error('NOT_YOUR_TURN')

    const attacker = await ctx.db.get(args.attackerId)
    const target = await ctx.db.get(args.targetId)

    if (!attacker || !target) throw new Error('UNIT_NOT_FOUND')
    if (attacker.ownerId !== game.currentPlayer)
      throw new Error('NOT_YOUR_UNIT')
    if (target.ownerId === game.currentPlayer)
      throw new Error('CANNOT_ATTACK_ALLY')

    // 2. AP Check
    if (attacker.ap < 1) throw new Error('INSUFFICIENT_AP')

    // 3. Range & LoS Check
    const attackerOnHighGround =
      game.mapData.tiles[attacker.y]?.[attacker.x] === 'highground'
    const inRange = isInRange(
      { x: attacker.x, y: attacker.y },
      { x: target.x, y: target.y },
      attacker.rng ?? 1,
      attackerOnHighGround,
    )
    if (!inRange) throw new Error('OUT_OF_RANGE')

    const los = hasLineOfSight(
      { x: attacker.x, y: attacker.y },
      { x: target.x, y: target.y },
      game.mapData,
    )
    if (!los) throw new Error('BLOCKED_BY_WALL')

    // 4. Calculate Damage
    const { damage, zone, shieldApplied } = calculateDamage(
      {
        type: attacker.type as any,
        atk: attacker.atk ?? 0,
        x: attacker.x,
        y: attacker.y,
      },
      {
        type: target.type as any,
        x: target.x,
        y: target.y,
        direction: target.direction as any,
      },
      attackerOnHighGround,
    )

    // 5. Apply Damage
    const newHp = Math.max(0, target.hp - damage)
    await ctx.db.patch(target._id, { hp: newHp })

    // 6. Update Attacker
    let newDirection = attacker.direction
    if (target.x > attacker.x) newDirection = 'E'
    else if (target.x < attacker.x) newDirection = 'W'
    else if (target.y > attacker.y) newDirection = 'S'
    else if (target.y < attacker.y) newDirection = 'N'

    await ctx.db.patch(attacker._id, {
      ap: attacker.ap - 1,
      direction: newDirection,
      isStealthed: false, // Breaking stealth on attack
    })

    // 7. Check if target destroyed
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

    // 8. Interrupt defender overwatch if hit (GDD says "Interrupted by damage")
    if (target.isOverwatching && newHp > 0) {
      await ctx.db.patch(target._id, {
        isOverwatching: false,
        overwatchDirection: undefined,
      })
    }

    return {
      damage,
      zone,
      shieldApplied,
      destroyed: newHp === 0,
    }
  },
})

export const healUnit = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    healerId: v.id('units'),
    targetId: v.id('units'),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    const attackerId = game.currentPlayer === 'p1' ? game.p1 : game.p2
    if (args.playerId !== attackerId) throw new Error('NOT_YOUR_TURN')

    const healer = await ctx.db.get(args.healerId)
    const target = await ctx.db.get(args.targetId)

    if (!healer || !target) throw new Error('UNIT_NOT_FOUND')
    if (healer.type !== 'M') throw new Error('NOT_A_MEDIC')
    if (target.ownerId !== game.currentPlayer)
      throw new Error('CANNOT_HEAL_ENEMY')
    if (healer._id === target._id) throw new Error('CANNOT_SELF_HEAL')

    const dist = Math.abs(healer.x - target.x) + Math.abs(healer.y - target.y)
    if (dist !== 1) throw new Error('NOT_ADJACENT')

    if (target.hp >= target.maxHp) throw new Error('ALREADY_FULL_HP')
    if (healer.ap < 1) throw new Error('INSUFFICIENT_AP')

    const newHp = Math.min(target.maxHp, target.hp + 15)
    await ctx.db.patch(target._id, { hp: newHp })
    await ctx.db.patch(healer._id, { ap: healer.ap - 1 })

    return { success: true, healed: newHp - target.hp }
  },
})

export const scanArea = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    x: v.number(),
    y: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
    if (args.playerId !== expectedPlayer) throw new Error('NOT_YOUR_TURN')

    // Find any unit of current player to deduct AP (Scan costs 1 AP from any unit)
    const myUnits = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .filter((q) => q.eq(q.field('ownerId'), game.currentPlayer))
      .collect()

    const unitWithAp = myUnits.find((u) => u.ap >= 1)
    if (!unitWithAp) throw new Error('INSUFFICIENT_AP')

    // Reveal 3x3 area
    const newTiles = []
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = args.x + dx
        const ty = args.y + dy
        if (tx >= 0 && tx < 12 && ty >= 0 && ty < 12) {
          newTiles.push(`${tx},${ty}`)
        }
      }
    }

    const playerKey =
      game.currentPlayer === 'p1' ? 'p1RevealedTiles' : 'p2RevealedTiles'
    const existingTiles = game[playerKey] || []
    const updatedTiles = Array.from(new Set([...existingTiles, ...newTiles]))

    await ctx.db.patch(game._id, { [playerKey]: updatedTiles })
    await ctx.db.patch(unitWithAp._id, { ap: unitWithAp.ap - 1 })

    // Find hostiles in area for the result message (excluding Scouts)
    const areaUnits = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .filter((q) =>
        q.and(
          q.gte(q.field('x'), args.x - 1),
          q.lte(q.field('x'), args.x + 1),
          q.gte(q.field('y'), args.y - 1),
          q.lte(q.field('y'), args.y + 1),
        ),
      )
      .collect()

    const hostiles = getScannedHostiles(areaUnits as Array<any>, game.currentPlayer)

    return {
      success: true,
      hostilesCount: hostiles.length,
    }
  },
})

export const setOverwatch = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    unitId: v.id('units'),
    direction: v.string(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing')
      throw new Error('INVALID_GAME_STATE')

    const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
    if (args.playerId !== expectedPlayer) throw new Error('NOT_YOUR_TURN')

    const unit = await ctx.db.get(args.unitId)
    if (!unit) throw new Error('UNIT_NOT_FOUND')
    if (unit.ownerId !== game.currentPlayer) throw new Error('NOT_YOUR_UNIT')
    if (unit.type === 'M') throw new Error('CANNOT_OVERWATCH')
    if (unit.ap < 1) throw new Error('INSUFFICIENT_AP')

    await ctx.db.patch(unit._id, {
      isOverwatching: true,
      overwatchDirection: args.direction,
      direction: args.direction,
      ap: unit.ap - 1,
    })

    return { success: true }
  },
})
