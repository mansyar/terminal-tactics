import { v } from 'convex/values'
import { PRESET_MAPS } from '../src/lib/mapPresets'
import { mutation } from './_generated/server'

// ===========================================================================
// selectMapPresetHandler — standalone handler for testing
// ===========================================================================
export const selectMapPresetHandler = async (
  ctx: any,
  args: { gameId: any; playerId: string; presetName: string | null },
) => {
  const game = await ctx.db.get(args.gameId)
  if (!game) throw new Error('GAME_NOT_FOUND')
  if (game.p1 !== args.playerId) throw new Error('NOT_LOBBY_HOST')

  // Validate preset name
  if (args.presetName !== null && !(args.presetName in PRESET_MAPS)) {
    throw new Error('INVALID_PRESET')
  }

  await ctx.db.patch(args.gameId, {
    mapPreset: args.presetName ?? undefined,
  })

  return { success: true }
}

// ===========================================================================
// selectMapPreset — Convex mutation wrapper
// ===========================================================================
export const selectMapPreset = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
    presetName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    return selectMapPresetHandler(ctx, {
      gameId: args.gameId,
      playerId: args.playerId,
      presetName: args.presetName ?? null,
    })
  },
})
