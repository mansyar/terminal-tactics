import { v } from 'convex/values'
import { isValidMove } from '../src/lib/movementValidator'
import {
  calculateDamage,
  hasLineOfSight,
  isInRange,
} from '../src/lib/combatSystem'
import { mutation } from './_generated/server'

export const moveUnit = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    unitId: v.id('units'),
    targetX: v.number(),
    targetY: v.number(),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') {
      throw new Error('INVALID_GAME_STATE')
    }

    // 1. Validate turn
    const expectedPlayer = game.currentPlayer === 'p1' ? game.p1 : game.p2
    if (args.playerId !== expectedPlayer) {
      throw new Error('NOT_YOUR_TURN')
    }

    // 2. Fetch all units for collision and overwatch checks
    const allUnits = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q) => q.eq('gameId', args.gameId))
      .collect()

    const unit = allUnits.find((u) => u._id === args.unitId)
    if (!unit) {
      throw new Error('UNIT_NOT_FOUND')
    }

    if (unit.ownerId !== game.currentPlayer) {
      throw new Error('NOT_YOUR_UNIT')
    }

    // 3. Validate move using shared logic
    const validation = isValidMove(
      game.mapData,
      allUnits.map((u) => ({ _id: u._id, ownerId: u.ownerId, x: u.x, y: u.y })),
      unit._id,
      { x: args.targetX, y: args.targetY },
      unit.ap,
    )

    if (!validation.valid) {
      throw new Error(validation.reason)
    }

    // 4. Calculate distance/cost
    const dx = Math.abs(unit.x - args.targetX)
    const dy = Math.abs(unit.y - args.targetY)
    const cost = dx + dy

    // 5. Calculate new direction
    let direction = unit.direction
    if (args.targetX > unit.x) direction = 'E'
    else if (args.targetX < unit.x) direction = 'W'
    else if (args.targetY > unit.y)
      direction = 'S' // SVG Y-axis: higher is down
    else if (args.targetY < unit.y) direction = 'N'

    // 6. Check for Overwatch Triggers
    const enemyUnits = allUnits.filter((u) => u.ownerId !== game.currentPlayer)
    let totalOvDamage = 0
    let overwatchTriggered = false

    for (const enemy of enemyUnits) {
      if (enemy.isOverwatching && enemy.overwatchDirection) {
        const attackerOnHighGround =
          game.mapData.tiles[enemy.y]?.[enemy.x] === 'highground'

        // Is target in range and LoS?
        const inRange = isInRange(
          { x: enemy.x, y: enemy.y },
          { x: args.targetX, y: args.targetY },
          enemy.rng ?? 1,
          attackerOnHighGround,
        )

        // Check direction (simplified: target must be in the general direction watched)
        let inDirection = false
        const dxO = args.targetX - enemy.x
        const dyO = args.targetY - enemy.y
        if (enemy.overwatchDirection === 'N' && dyO < 0) inDirection = true
        else if (enemy.overwatchDirection === 'S' && dyO > 0) inDirection = true
        else if (enemy.overwatchDirection === 'E' && dxO > 0) inDirection = true
        else if (enemy.overwatchDirection === 'W' && dxO < 0) inDirection = true

        if (inRange && inDirection) {
          const los = hasLineOfSight(
            { x: enemy.x, y: enemy.y },
            { x: args.targetX, y: args.targetY },
            game.mapData,
          )

          if (los) {
            // Trigger Overwatch Attack!
            const { damage } = calculateDamage(
              {
                type: enemy.type as any,
                atk: enemy.atk ?? 0,
                x: enemy.x,
                y: enemy.y,
              },
              {
                type: unit.type as any,
                x: args.targetX,
                y: args.targetY,
                direction: direction as any,
              },
              attackerOnHighGround,
            )

            totalOvDamage += damage
            overwatchTriggered = true
            // Clear this unit's overwatch
            await ctx.db.patch(enemy._id, {
              isOverwatching: false,
              overwatchDirection: undefined,
            })
          }
        }
      }
    }

    // 7. Apply Change
    const newHp = Math.max(0, unit.hp - totalOvDamage)

    if (newHp === 0) {
      await ctx.db.delete(unit._id)
      // Check win condition
      const remainingAllyUnits = allUnits.filter(
        (u) => u.ownerId === game.currentPlayer && u._id !== unit._id,
      )
      if (remainingAllyUnits.length === 0) {
        await ctx.db.patch(game._id, {
          status: 'finished',
          winner: enemyUnits[0].ownerId,
        })
      }
    } else {
      // Check Scout reveal if adjacent to any enemy
      let isVisible = true
      if (unit.type === 'S') {
        const adjacentToEnemy = enemyUnits.some((e) => {
          const dist =
            Math.abs(e.x - args.targetX) + Math.abs(e.y - args.targetY)
          return dist <= 1
        })
        isVisible = adjacentToEnemy
      }

      await ctx.db.patch(unit._id, {
        x: args.targetX,
        y: args.targetY,
        hp: newHp,
        ap: unit.ap - cost,
        direction,
        isStealthed: unit.type === 'S' ? !isVisible : undefined,
      })
    }

    // 8. Update Fog of War
    const newRevealed = []
    const vis = unit.vis ?? 3
    for (let dyV = -vis; dyV <= vis; dyV++) {
      for (let dxV = -vis; dxV <= vis; dxV++) {
        if (Math.max(Math.abs(dxV), Math.abs(dyV)) <= vis) {
          const tx = args.targetX + dxV
          const ty = args.targetY + dyV
          if (tx >= 0 && tx < 12 && ty >= 0 && ty < 12) {
            // Only reveal if LoS is clear
            if (
              hasLineOfSight(
                { x: args.targetX, y: args.targetY },
                { x: tx, y: ty },
                game.mapData,
              )
            ) {
              newRevealed.push(`${tx},${ty}`)
            }
          }
        }
      }
    }

    const playerKey =
      game.currentPlayer === 'p1' ? 'p1RevealedTiles' : 'p2RevealedTiles'
    const existingRevealed = game[playerKey] || []
    const updatedRevealed = Array.from(
      new Set([...existingRevealed, ...newRevealed]),
    )
    await ctx.db.patch(game._id, { [playerKey]: updatedRevealed })

    return {
      success: true,
      overwatchTriggered,
      damageTaken: totalOvDamage,
    }
  },
})
