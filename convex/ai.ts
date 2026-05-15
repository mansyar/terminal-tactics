import { v } from 'convex/values'
import { getAIActions } from '../src/lib/aiEngine'
import { calculateDamage } from '../src/lib/combatSystem'
import { mutation } from './_generated/server'
import { endTurnHandler } from './game'
import type { AIAction, AIUnitState } from '../src/lib/aiEngine'
import type { Direction, UnitType } from '../src/lib/combatSystem'

export const aiTurn = mutation({
  args: {
    gameId: v.id('games'),
    difficulty: v.union(
      v.literal('easy'),
      v.literal('medium'),
      v.literal('hard'),
    ),
  },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game || game.status !== 'playing') return

    // Determine the AI's role (p1 or p2)
    const aiRole = game.currentPlayer // AI is current player when this mutation is called

    // Fetch all units
    const allUnitDocs = await ctx.db
      .query('units')
      .withIndex('by_gameId', (q: any) => q.eq('gameId', args.gameId))
      .collect()

    // Map to AI engine types
    const aiUnits: Array<AIUnitState> = allUnitDocs
      .filter((u: any) => u.ownerId === aiRole)
      .map((u: any) => ({
        _id: u._id,
        ownerId: u.ownerId,
        type: u.type as UnitType,
        hp: u.hp,
        maxHp: u.maxHp,
        atk: u.atk ?? 0,
        rng: u.rng ?? 1,
        vis: u.vis ?? 3,
        ap: u.ap,
        maxAp: u.maxAp,
        x: u.x,
        y: u.y,
        direction: u.direction as Direction,
        isOverwatching: u.isOverwatching ?? false,
        overwatchDirection: u.overwatchDirection as Direction | undefined,
        isStealthed: u.isStealthed ?? false,
        engineerWallCount: u.engineerWallCount ?? 0,
        sniperMovedThisTurn: u.sniperMovedThisTurn ?? false,
      }))

    const allUnits: Array<any> = allUnitDocs.map((u: any) => ({
      _id: u._id,
      ownerId: u.ownerId,
      type: u.type as UnitType,
      hp: u.hp,
      maxHp: u.maxHp,
      atk: u.atk ?? 0,
      rng: u.rng ?? 1,
      vis: u.vis ?? 3,
      ap: u.ap,
      maxAp: u.maxAp,
      x: u.x,
      y: u.y,
      direction: u.direction as Direction,
      isOverwatching: u.isOverwatching ?? false,
      overwatchDirection: u.overwatchDirection as Direction | undefined,
      isStealthed: u.isStealthed ?? false,
      engineerWallCount: u.engineerWallCount ?? 0,
      sniperMovedThisTurn: u.sniperMovedThisTurn ?? false,
    }))

    // Get AI actions from the engine
    const actionPlan = getAIActions(
      aiUnits,
      allUnits,
      {
        mapData: game.mapData,
        currentPlayer: aiRole,
        turnNum: game.turnNum,
        kernelPanicActive: game.kernelPanicActive,
        p1RevealedTiles: game.p1RevealedTiles,
        p2RevealedTiles: game.p2RevealedTiles,
      },
      args.difficulty,
    )

    // Log AI actions to the console history
    const aiHandle =
      args.difficulty === 'easy'
        ? 'AI_EASY'
        : args.difficulty === 'medium'
          ? 'AI_MEDIUM'
          : 'AI_HARD'

    for (const action of actionPlan.actions) {
      await ctx.db.insert('logs', {
        gameId: args.gameId,
        playerId: aiRole === 'p1' ? (game.p1 ?? '') : (game.p2 ?? ''),
        commandString: `[AI] ${action.description}`,
        result: `[AI] Action executed for ${aiHandle}`,
        timestamp: Date.now(),
        visibility: 'public',
      })
    }

    // Execute each AI action via db.patch
    // Wrapped in try-catch so turn always advances even if an action fails
    try {
      for (const action of actionPlan.actions) {
        await executeAIAction(ctx, args.gameId, action, aiRole)
      }
    } catch (err) {
      // Log action failure but continue to end the turn
      await ctx.db.insert('logs', {
        gameId: args.gameId,
        playerId: aiRole === 'p1' ? (game.p1 ?? '') : (game.p2 ?? ''),
        commandString: `[AI] Action execution error`,
        result: `[AI] Error: ${String(err)}`,
        timestamp: Date.now(),
        visibility: 'public',
      })
    }

    // End the AI turn using the shared handler — always called regardless of action failures
    await endTurnHandler(ctx, game, args.gameId)
  },
})

async function executeAIAction(
  ctx: any,
  _gameId: any,
  action: AIAction,
  aiRole: string,
) {
  switch (action.type) {
    case 'move':
      if (action.targetX !== undefined && action.targetY !== undefined) {
        const unit = await ctx.db.get(action.unitId)
        if (unit) {
          const cost =
            Math.abs(unit.x - action.targetX) +
            Math.abs(unit.y - action.targetY)
          let direction = unit.direction
          if (action.targetX > unit.x) direction = 'E'
          else if (action.targetX < unit.x) direction = 'W'
          else if (action.targetY > unit.y) direction = 'S'
          else if (action.targetY < unit.y) direction = 'N'
          await ctx.db.patch(unit._id, {
            x: action.targetX,
            y: action.targetY,
            ap: unit.ap - cost,
            direction,
            sniperMovedThisTurn: unit.type === 'R' ? true : undefined,
            isStealthed: unit.type === 'S' ? true : undefined, // Scouts re-stealth on move
          })
        }
      }
      break

    case 'attack':
      if (action.targetUnitId) {
        const unit = await ctx.db.get(action.unitId)
        const target = await ctx.db.get(action.targetUnitId)
        if (unit && target && target.ownerId !== aiRole) {
          // Calculate damage using shared combat logic
          const isOnHigh = false // Simplified — elevation check for AI
          const { damage } = calculateDamage(
            {
              type: unit.type,
              atk: unit.atk ?? 0,
              x: unit.x,
              y: unit.y,
            },
            {
              type: target.type,
              x: target.x,
              y: target.y,
              direction: target.direction,
            },
            isOnHigh,
          )

          let newDirection = unit.direction
          if (target.x > unit.x) newDirection = 'E'
          else if (target.x < unit.x) newDirection = 'W'
          else if (target.y > unit.y) newDirection = 'S'
          else if (target.y < unit.y) newDirection = 'N'

          const newHp = Math.max(0, target.hp - damage)
          await ctx.db.patch(target._id, { hp: newHp })

          await ctx.db.patch(unit._id, {
            ap: unit.ap - 1,
            direction: newDirection,
            isStealthed: false,
          })

          if (newHp === 0) {
            await ctx.db.delete(target._id)
          }
        }
      }
      break

    case 'heal':
      if (action.targetUnitId) {
        const unit = await ctx.db.get(action.unitId)
        const target = await ctx.db.get(action.targetUnitId)
        if (unit && target && target.ownerId === aiRole) {
          const newHp = Math.min(target.maxHp, target.hp + 15)
          await ctx.db.patch(target._id, { hp: newHp })
          await ctx.db.patch(unit._id, { ap: unit.ap - 1 })
        }
      }
      break

    case 'scan': {
      const unit = await ctx.db.get(action.unitId)
      if (unit) {
        await ctx.db.patch(unit._id, { ap: unit.ap - 1 })
      }
      break
    }

    case 'overwatch':
      if (action.direction) {
        const unit = await ctx.db.get(action.unitId)
        if (unit && unit.type !== 'M') {
          await ctx.db.patch(unit._id, {
            isOverwatching: true,
            overwatchDirection: action.direction,
            direction: action.direction,
            ap: unit.ap - 1,
          })
        }
      }
      break

    case 'wait':
      // No action needed
      break
  }
}
