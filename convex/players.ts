import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

// ===========================================================================
// getOrCreatePlayer
// ===========================================================================

export const getOrCreatePlayerHandler = async (
  ctx: any,
  args: { userId: string },
) => {
  const existing = await ctx.db
    .query('players')
    .withIndex('by_userId', (q: any) => q.eq('userId', args.userId))
    .unique()

  if (existing) {
    return existing
  }

  const handle = args.userId // Use the user_xxxx pattern as the initial handle
  const newPlayer = {
    userId: args.userId,
    handle,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    draws: 0,
  }

  const id = await ctx.db.insert('players', newPlayer)
  return { _id: id, ...newPlayer }
}

export const getOrCreatePlayer = mutation({
  args: { userId: v.string() },
  handler: getOrCreatePlayerHandler,
})

// ===========================================================================
// setHandle
// ===========================================================================

export const setHandleHandler = async (
  ctx: any,
  args: { userId: string; newHandle: string },
) => {
  const { userId, newHandle } = args

  // Validate length
  if (newHandle.length < 2) {
    throw new Error('HANDLE_TOO_SHORT')
  }
  if (newHandle.length > 20) {
    throw new Error('HANDLE_TOO_LONG')
  }

  // Validate characters: alphanumeric + underscore only
  if (!/^[a-zA-Z0-9_]+$/.test(newHandle)) {
    throw new Error('HANDLE_INVALID_CHARS')
  }

  // Collect all players (index scan for the prefix) to check uniqueness and find current user
  const allPlayers = await ctx.db.query('players').collect()

  const player = allPlayers.find((p: any) => p.userId === userId)
  if (!player) {
    throw new Error('PLAYER_NOT_FOUND')
  }

  // If someone else already has this handle, reject
  const existingWithHandle = allPlayers.find(
    (p: any) => p.handle === newHandle && p._id !== player._id,
  )
  if (existingWithHandle) {
    throw new Error('HANDLE_TAKEN')
  }

  // Update handle (even if same — idempotent)
  await ctx.db.patch(player._id, { handle: newHandle })
  return { ...player, handle: newHandle }
}

export const setHandle = mutation({
  args: { userId: v.string(), newHandle: v.string() },
  handler: setHandleHandler,
})

// ===========================================================================
// getPlayerByUserId
// ===========================================================================

export const getPlayerByUserIdHandler = async (
  ctx: any,
  args: { userId: string },
) => {
  const player = await ctx.db
    .query('players')
    .withIndex('by_userId', (q: any) => q.eq('userId', args.userId))
    .unique()

  return player ?? null
}

export const getPlayerByUserId = query({
  args: { userId: v.string() },
  handler: getPlayerByUserIdHandler,
})

// ===========================================================================
// getPlayersByUserIds
// ===========================================================================

export const getPlayersByUserIdsHandler = async (
  ctx: any,
  args: { userIds: Array<string> },
) => {
  if (args.userIds.length === 0) {
    return {}
  }

  const allPlayers = await ctx.db.query('players').collect()

  const result: Record<string, any> = {}
  const userIdSet = new Set(args.userIds)

  for (const player of allPlayers) {
    if (userIdSet.has(player.userId)) {
      result[player.userId] = player
    }
  }

  return result
}

export const getPlayersByUserIds = query({
  args: { userIds: v.array(v.string()) },
  handler: getPlayersByUserIdsHandler,
})

// ===========================================================================
// getPlayerStats
// ===========================================================================

export const getPlayerStatsHandler = async (
  ctx: any,
  args: { userId: string },
) => {
  const player = await ctx.db
    .query('players')
    .withIndex('by_userId', (q: any) => q.eq('userId', args.userId))
    .unique()

  if (!player) {
    return null
  }

  return {
    handle: player.handle,
    wins: player.wins,
    losses: player.losses,
    draws: player.draws,
    gamesPlayed: player.gamesPlayed,
  }
}

export const getPlayerStats = query({
  args: { userId: v.string() },
  handler: getPlayerStatsHandler,
})

// ===========================================================================
// getMatchHistory
// ===========================================================================

export const getMatchHistoryHandler = async (
  ctx: any,
  args: { userId: string; limit?: number },
) => {
  const limit = args.limit ?? 20

  const asP1 = await ctx.db
    .query('matches')
    .withIndex('by_p1Id', (q: any) => q.eq('p1Id', args.userId))
    .collect()

  const asP2 = await ctx.db
    .query('matches')
    .withIndex('by_p2Id', (q: any) => q.eq('p2Id', args.userId))
    .collect()

  const all = [...asP1, ...asP2]
  all.sort((a: any, b: any) => b.finishedAt - a.finishedAt)

  return all.slice(0, limit)
}

export const getMatchHistory = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: getMatchHistoryHandler,
})

// ===========================================================================
// recordGameEnd
// ===========================================================================

export const recordGameEndHandler = async (
  ctx: any,
  args: {
    gameId: any
    p1Id: string
    p2Id: string
    winner: string | null // "p1" | "p2" | null for draw
    endReason: string
    turns: number
    duration: number
  },
) => {
  const { gameId, p1Id, p2Id, winner, endReason, turns, duration } = args

  // Fetch or auto-create player docs
  const getOrCreate = async (userId: string) => {
    let player = await ctx.db
      .query('players')
      .withIndex('by_userId', (q: any) => q.eq('userId', userId))
      .unique()

    if (!player) {
      const id = await ctx.db.insert('players', {
        userId,
        handle: userId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      })
      player = {
        _id: id,
        userId,
        handle: userId,
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        draws: 0,
      }
    }

    return player
  }

  const p1 = await getOrCreate(p1Id)
  const p2 = await getOrCreate(p2Id)

  const finishedAt = Date.now()

  // Snapshot handles at game-end time
  const p1Handle = p1.handle
  const p2Handle = p2.handle

  // Update counters
  const p1Patch: any = { gamesPlayed: p1.gamesPlayed + 1 }
  const p2Patch: any = { gamesPlayed: p2.gamesPlayed + 1 }

  if (winner === 'p1') {
    p1Patch.wins = p1.wins + 1
    p2Patch.losses = p2.losses + 1
  } else if (winner === 'p2') {
    p1Patch.losses = p1.losses + 1
    p2Patch.wins = p2.wins + 1
  } else {
    // Draw
    p1Patch.draws = p1.draws + 1
    p2Patch.draws = p2.draws + 1
  }

  await ctx.db.patch(p1._id, p1Patch)
  await ctx.db.patch(p2._id, p2Patch)

  // Insert match record with snapshot of handles
  await ctx.db.insert('matches', {
    gameId,
    p1Id,
    p2Id,
    p1Handle,
    p2Handle,
    winner: winner ?? undefined,
    endReason,
    turns,
    duration,
    finishedAt,
  })
}

export const recordGameEnd = mutation({
  args: {
    gameId: v.id('games'),
    p1Id: v.string(),
    p2Id: v.string(),
    winner: v.optional(v.string()),
    endReason: v.string(),
    turns: v.number(),
    duration: v.number(),
  },
  handler: async (ctx, args) => {
    await recordGameEndHandler(ctx, {
      ...args,
      winner: args.winner ?? null,
    })
  },
})
