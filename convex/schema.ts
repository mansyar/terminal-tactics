import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  games: defineTable({
    turnNum: v.number(),
    currentPlayer: v.string(), // "p1" or "p2"
    status: v.string(), // "lobby", "drafting", "playing", "finished"
    environmentFlags: v.array(v.string()),
    mapData: v.any(), // Procedural map data
    isPublic: v.boolean(),
    p1: v.optional(v.string()), // userId or handle
    p2: v.optional(v.string()),
    winner: v.optional(v.string()),
  }).index('by_status', ['status']),

  units: defineTable({
    gameId: v.id('games'),
    ownerId: v.string(), // "p1" or "p2"
    type: v.string(), // "K", "A", "S", "M"
    hp: v.number(),
    maxHp: v.number(),
    ap: v.number(),
    maxAp: v.number(),
    x: v.number(),
    y: v.number(),
    direction: v.string(), // "N", "E", "S", "W"
  }).index('by_gameId', ['gameId']),

  logs: defineTable({
    gameId: v.id('games'),
    timestamp: v.number(),
    commandString: v.string(),
    result: v.string(),
    playerId: v.string(),
  }).index('by_gameId', ['gameId']),
})
