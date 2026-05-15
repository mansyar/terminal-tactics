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
    code: v.optional(v.string()), // 4-character lobby code
    p1: v.optional(v.string()), // userId or handle
    p2: v.optional(v.string()),
    p1Squad: v.optional(v.array(v.string())), // Array of unit types ["K", "A", "S", "M"]
    p2Squad: v.optional(v.array(v.string())),
    p1Typing: v.optional(v.boolean()),
    p2Typing: v.optional(v.boolean()),
    p1RevealedTiles: v.optional(v.array(v.string())), // "x,y"
    p2RevealedTiles: v.optional(v.array(v.string())),
    lastActionTime: v.optional(v.number()),
    winner: v.optional(v.string()),
    draftStartTime: v.optional(v.number()), // Timestamp when drafting started
    turnStartTime: v.optional(v.number()), // Timestamp when current turn started
    p1Rap: v.optional(v.number()), // Root Access Points for P1
    p2Rap: v.optional(v.number()), // Root Access Points for P2
    kernelPanicActive: v.optional(v.string()), // "SEGFAULT" | "OVERCLOCK" | "REBOOT" | null
    drawOffer: v.optional(v.string()), // "p1" | "p2" | null (who offered)
    p1LastHeartbeat: v.optional(v.number()), // Timestamp of P1's last heartbeat
    p2LastHeartbeat: v.optional(v.number()), // Timestamp of P2's last heartbeat
    p1Status: v.optional(v.string()), // "connected" | "disconnected" | "reconnecting"
    p2Status: v.optional(v.string()), // "connected" | "disconnected" | "reconnecting"
    disconnectStartTime: v.optional(v.number()), // Timestamp when disconnect was first detected
    gameStartTime: v.optional(v.number()), // Timestamp when game transitioned from drafting → playing
    rematchCode: v.optional(v.string()), // 4-char lobby code for rematch
    rematchLobbyId: v.optional(v.id('games')), // ID of the rematch lobby game
    mapPreset: v.optional(v.string()), // "grid" | "maze" | "ridge" | undefined for random/procedural
    sudoUsedThisGame: v.optional(v.boolean()), // Track if sudo was used in this game (for achievements)
    unitsLostP1: v.optional(v.number()), // Units lost by P1 in this game
    unitsLostP2: v.optional(v.number()), // Units lost by P2 in this game
  })
    .index('by_status', ['status'])
    .index('by_code', ['code']),

  units: defineTable({
    gameId: v.id('games'),
    ownerId: v.string(), // "p1" or "p2"
    type: v.string(), // "K", "A", "S", "M"
    hp: v.number(),
    maxHp: v.number(),
    atk: v.optional(v.number()),
    rng: v.optional(v.number()),
    vis: v.optional(v.number()),
    ap: v.number(),
    maxAp: v.number(),
    x: v.number(),
    y: v.number(),
    direction: v.string(), // "N", "E", "S", "W"
    isOverwatching: v.optional(v.boolean()),
    overwatchDirection: v.optional(v.optional(v.string())),
    isStealthed: v.optional(v.boolean()),
    engineerWallCount: v.optional(v.number()), // Remaining build uses for Engineer units
    sniperMovedThisTurn: v.optional(v.boolean()), // Tracks if Sniper has moved this turn
  }).index('by_gameId', ['gameId']),

  players: defineTable({
    userId: v.string(), // The existing user_xxxx ID from localStorage
    handle: v.string(), // Display name, unique across all players
    gamesPlayed: v.number(), // Total games played that reached "playing" status
    wins: v.number(),
    losses: v.number(),
    draws: v.number(),
    achievements: v.optional(v.array(v.string())), // Unlocked achievement IDs
  })
    .index('by_userId', ['userId'])
    .index('by_handle', ['handle']),

  matches: defineTable({
    gameId: v.id('games'),
    p1Id: v.string(),
    p2Id: v.string(),
    p1Handle: v.string(), // Snapshot of handle at game end
    p2Handle: v.string(), // Snapshot of handle at game end
    winner: v.optional(v.string()), // "p1" | "p2" | undefined for draw
    endReason: v.string(), // "elimination" | "forfeit" | "disconnect" | "timeout" | "draw"
    turns: v.number(),
    duration: v.number(), // In milliseconds
    finishedAt: v.number(), // Timestamp
  })
    .index('by_p1Id', ['p1Id'])
    .index('by_p2Id', ['p2Id']),

  logs: defineTable({
    gameId: v.id('games'),
    timestamp: v.number(),
    commandString: v.string(),
    result: v.string(),
    playerId: v.string(),
    visibility: v.optional(v.union(v.literal('public'), v.literal('private'))),
  }).index('by_gameId', ['gameId']),
})
