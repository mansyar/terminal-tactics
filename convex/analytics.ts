import { v } from 'convex/values'
import { mutation, query } from './_generated/server'

const VALID_EVENT_TYPES = ['PAGE_LOAD', 'GAME_START', 'GAME_COMPLETE'] as const

export type AnalyticsEventType = (typeof VALID_EVENT_TYPES)[number]

export const logAnalyticsEventHandler = async (
  ctx: any,
  args: { eventType: string; timestamp: number; metadata?: any },
) => {
  if (!VALID_EVENT_TYPES.includes(args.eventType as AnalyticsEventType)) {
    throw new Error(`INVALID_EVENT_TYPE: ${args.eventType}`)
  }

  const event = {
    eventType: args.eventType,
    timestamp: args.timestamp,
    metadata: args.metadata,
  }

  return await ctx.db.insert('analytics_events', event)
}

export const logAnalyticsEvent = mutation({
  args: {
    eventType: v.string(),
    timestamp: v.number(),
    metadata: v.optional(v.any()),
  },
  handler: logAnalyticsEventHandler,
})

export const getAnalyticsSummaryHandler = async (
  ctx: any,
  args: { limit: number },
) => {
  const events: Array<{ eventType: string; timestamp: number }> = await ctx.db
    .query('analytics_events')
    .collect()

  const eventCounts: Record<string, number> = {
    PAGE_LOAD: 0,
    GAME_START: 0,
    GAME_COMPLETE: 0,
  }

  for (const event of events) {
    if (event.eventType in eventCounts) {
      eventCounts[event.eventType]++
    }
  }

  // Sort by timestamp ascending and limit
  const sorted = [...events].sort((a, b) => a.timestamp - b.timestamp)
  const recent = sorted.slice(-args.limit)

  return {
    total: events.length,
    events: eventCounts,
    recent,
  }
}

export const getAnalyticsSummary = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await getAnalyticsSummaryHandler(ctx, { limit: args.limit ?? 100 })
  },
})
