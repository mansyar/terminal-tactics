import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// ===========================================================================
// Heartbeat
// ===========================================================================

const DISCONNECT_THRESHOLD_MS = 30_000 // 30s without heartbeat = disconnected

export const heartbeatHandler = async (
  ctx: any,
  args: { gameId: string; playerId: string },
) => {
  const game = await ctx.db.get(args.gameId)
  if (!game) throw new Error('GAME_NOT_FOUND')
  if (game.status !== 'playing') return // No heartbeat tracking during lobby/drafting

  const isP1 = game.p1 === args.playerId
  const isP2 = game.p2 === args.playerId
  if (!isP1 && !isP2) throw new Error('NOT_A_PLAYER')

  const now = Date.now()
  const patch: Record<string, any> = {}

  if (isP1) {
    patch.p1LastHeartbeat = now
    patch.p1Status = 'connected'
  } else {
    patch.p2LastHeartbeat = now
    patch.p2Status = 'connected'
  }

  // If the player was previously disconnected, clear the global disconnect timer
  // (only clear if there's no other player still disconnected — the other player's
  //  disconnect timer is handled independently by the grace period system)
  const wasDisconnected = isP1
    ? game.p1Status === 'disconnected'
    : game.p2Status === 'disconnected'

  if (wasDisconnected) {
    const otherStillDisconnected = isP1
      ? game.p2Status === 'disconnected'
      : game.p1Status === 'disconnected'

    // Only clear disconnectStartTime when nobody is disconnected anymore
    if (!otherStillDisconnected) {
      patch.disconnectStartTime = undefined
    }
  }

  await ctx.db.patch(args.gameId, patch)
}

export const heartbeat = mutation({
  args: {
    gameId: v.id('games'),
    playerId: v.string(),
  },
  handler: heartbeatHandler,
})

// ===========================================================================
// Disconnect Detection
// ===========================================================================

export const checkDisconnectHandler = async (
  ctx: any,
  args: { gameId: string; now: number },
) => {
  const game = await ctx.db.get(args.gameId)
  if (!game || game.status !== 'playing') return

  const patch: Record<string, any> = {}
  let needsPatch = false

  // Check P1
  if (
    game.p1 &&
    game.p1LastHeartbeat !== undefined &&
    game.p1Status !== 'disconnected'
  ) {
    const p1Elapsed = args.now - game.p1LastHeartbeat
    if (p1Elapsed > DISCONNECT_THRESHOLD_MS) {
      patch.p1Status = 'disconnected'
      if (game.disconnectStartTime === undefined) {
        patch.disconnectStartTime = args.now
      }
      needsPatch = true
    }
  }

  // Check P2
  if (
    game.p2 &&
    game.p2LastHeartbeat !== undefined &&
    game.p2Status !== 'disconnected'
  ) {
    const p2Elapsed = args.now - game.p2LastHeartbeat
    if (p2Elapsed > DISCONNECT_THRESHOLD_MS) {
      patch.p2Status = 'disconnected'
      if (
        game.disconnectStartTime === undefined &&
        patch.disconnectStartTime === undefined
      ) {
        patch.disconnectStartTime = args.now
      }
      needsPatch = true
    }
  }

  if (needsPatch) {
    await ctx.db.patch(args.gameId, patch)
  }
}

export const checkDisconnect = mutation({
  args: {
    gameId: v.id('games'),
    now: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await checkDisconnectHandler(ctx, {
      gameId: args.gameId,
      now: args.now ?? Date.now(),
    })
  },
})

// ===========================================================================
// Connection Status Query
// ===========================================================================

export const getConnectionStatus = query({
  args: { gameId: v.id('games') },
  handler: async (ctx, args) => {
    const game = await ctx.db.get(args.gameId)
    if (!game) return null

    return {
      p1Status: game.p1Status ?? 'connected',
      p2Status: game.p2Status ?? 'connected',
      p1LastHeartbeat: game.p1LastHeartbeat ?? null,
      p2LastHeartbeat: game.p2LastHeartbeat ?? null,
      disconnectStartTime: game.disconnectStartTime ?? null,
    }
  },
})
