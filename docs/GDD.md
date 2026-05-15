# 📑 PROJECT: TERMINAL TACTICS (GDD v1.9.0)

## 1. VISION STATEMENT

**Terminal Tactics** is a minimalist, high-fidelity tactical strategy engine. By removing visual assets, it highlights the technical power of a real-time backend (Convex) and the strategic depth of deterministic, command-driven gameplay.

---

## 2. CORE TECH STACK

| Layer     | Technology                    |
| --------- | ----------------------------- |
| Framework | Vite + React                  |
| Backend   | Convex (real-time sync)       |
| Rendering | SVG                           |
| Styling   | Tailwind CSS + JetBrains Mono |
| Animation | Framer Motion                 |

---

## 3. GAMEPLAY MECHANICS

### A. Game Loop

| Aspect         | Rule                                          |
| -------------- | --------------------------------------------- |
| Win Condition  | Elimination — destroy all enemy units         |
| Turn Structure | Strict alternating (P1 → P2 → P1...)          |
| Squad Budget   | 1000 Credits                                  |
| Squad Size     | 2–5 units                                     |
| Game Modes     | Elimination ✅ |

### B. Map System

- **Grid Sizes:** 8×8 (Quick), 12×12 (Standard) ✅, 16×16 (Large) _(Planned)_
- **Generation:** Procedural via Cellular Automata, or Preset Maps ✅
- **Coordinates:** Chess notation (A-L columns, 1-12 rows)
- **Terrain:**
  - Floor (`.`) — traversable
  - Wall (`#`) — blocks movement and LoS
  - High Ground (`^`) — grants combat bonuses

### C. Combat ✅

Combat is **deterministic** — no RNG. Damage depends on position, elevation, and abilities.

| Factor         | Effect                     |
| -------------- | -------------------------- |
| Frontal Attack | 100% damage                |
| Flank Attack   | 125% damage                |
| Backstab       | 150% damage                |
| High Ground    | +1 range, +10 damage       |
| Knight Shield  | -20% damage (frontal only) |

📖 **Full details:** [COMBAT.md](./COMBAT.md)

### D. Fog of War ✅

- Each unit has a **Vision (VIS)** range
- Terrain is permanently remembered once seen
- Enemy units vanish when outside vision
- Scouts are invisible unless adjacent

📖 **Full details:** [COMBAT.md](./COMBAT.md#vision-system)

---

## 4. UNIT CLASSES

### Core Units ✅

| Symbol | Class  | Cost |  HP |  AP | ATK | RNG | VIS | Ability                 |
| ------ | ------ | ---: | --: | --: | --: | --: | --: | ----------------------- |
| `[K]`  | Knight |  300 | 100 |   2 |  30 |   1 |   3 | Frontal Shield          |
| `[A]`  | Archer |  200 |  60 |   2 |  20 |   5 |   5 | High Ground Mastery     |
| `[S]`  | Scout  |  150 |  50 |   4 |  15 |   2 |   4 | Stealth + Scan Immunity |
| `[M]`  | Medic  |  250 |  70 |   3 |   0 |   2 |   3 | Heal (15 HP)            |

### Expansion Units ✅

| Symbol | Class     | Cost |  HP |  AP | ATK | RNG | VIS | Ability                    |
| ------ | --------- | ---: | --: | --: | --: | --: | --: | -------------------------- |
| `[E]`  | Engineer  |  200 |  60 |   3 |  10 |   1 |   3 | Build/Demolish walls       |
| `[R]`  | Sniper    |  350 |  40 |   2 |  40 |   8 |   6 | Stationary attack only     |
| `[C]`  | Commander |  400 |  80 |   2 |  20 |   2 |   4 | Rally (+1 AP to adjacents) |

📖 **Ability details:** [COMBAT.md](./COMBAT.md#knight-shield)

---

## 5. COMMANDS

The game is controlled via Command Line Interface (CLI).

### Quick Reference

| Command   | Syntax         |     AP | Status   |
| --------- | -------------- | -----: | -------- |
| Move      | `mv C2 C5`     | 1/tile | ✅       |
| Attack    | `atk C4 E4`    |      1 | ✅       |
| Heal      | `heal D5 C5`   |      1 | ✅       |
| Scan      | `scan D5`      |      1 | ✅       |
| Overwatch | `ovw C4 N`     |      1 | ✅       |
| Inspect   | `inspect C4`   |      0 | ✅       |
| End Turn  | `end`          |      — | ✅       |
| Forfeit   | `forfeit`      |      — | ✅       |
| Chat      | `say [msg]`    |      0 | ✅       |
| Ultimate  | `sudo mv...`   |  1 RAP | ✅       |
| Build     | `build [c]`    |      1 | ✅       |
| Demolish  | `demolish [c]` |      1 | ✅       |
| Rally     | `rally [c]`    |      1 | ✅       |
| Map       | `map`          |      0 | ✅       |

📖 **Full specifications:** [COMMANDS.md](./COMMANDS.md)

---

## 6. GAME FLOW

```
┌─────────┐   ┌──────────┐   ┌─────────┐   ┌──────────┐
│  LOBBY  │ → │ DRAFTING │ → │ PLAYING │ → │ FINISHED │
└─────────┘   └──────────┘   └─────────┘   └──────────┘
   Create       Pick squad     Turn-based    Elimination
   or Join      (1000 cr)      combat        or forfeit
```

### Drafting Rules

| Rule       | Value         |
| ---------- | ------------- |
| Budget     | 1000 Credits  |
| Min Squad  | 2 units       |
| Max Squad  | 5 units       |
| Duplicates | Allowed       |
| Time Limit | 90 seconds ✅ |

### Turn Timer ✅

- 90 seconds per turn
- Warning at 15 seconds
- Auto-end on timeout

### Win Conditions

---

## 7. INFRASTRUCTURE

### Matchmaking ✅

- **Private Lobby:** 4-digit code (e.g., `X7Z2`)
- **Quick Play:** Auto-join or create public lobby

### Persistence ✅

- `userId` — Anonymous UUID in LocalStorage
- `terminal_tactics_game_id` — Active session (rejoin on refresh)
- `handle` — Custom player name ✅

### Real-time Features ✅

- Typing indicator ("Player is typing...")
- Instant state sync via Convex subscriptions
- Disconnect detection & grace period _(Phase 8)_
- Rematch protocol _(Phase 10)_

### Player Profiles _(Phase 10)_ ✅

- **Handle System:** Custom alphanumeric names (2-20 chars), editable via lobby UI or `/handle` CLI
- **Stats Tracking:** Win/Loss/Draw counters recorded after every game (all 5 end paths)
- **Match History:** Last 20 games displayed as ASCII table via `history` CLI command
- **Rematch:** One-click rematch button creates new private lobby with same opponent

### AI Opponent _(Phase 12)_ ✅

- **AI Game Initiation:** Start single-player games from lobby at 3 difficulty levels
- **AI Squad Builder:** Auto-generates valid squads within budget per difficulty
- **Decision Engine:** 3-tier engine (Easy: random, Medium: heuristic, Hard: one-step lookahead)
- **AI Turn Execution:** Server-side mutation with "thinking" delay, calls shared `endTurnHandler`

### Achievements _(Phase 12)_ ✅

- **6 Achievements:** First Blood, Tactician, Comeback Kid, Sudo Master, Patience, Speed Demon
- **Schema Tracking:** `achievements` field on `players` table; `sudoUsedThisGame`, `unitsLostP1/P2` on `games`
- **Post-Game Display:** Unlocked achievements shown on win screen with glow effect
- **Lobby Profile:** Collapsible achievements section with locked/unlocked badges

### Advanced Features _(Planned)_

- **Spectator Mode:** Watch live games with shareable link
- **Game Replay:** Step-through replay of completed matches
- **Ranked Queue:** ELO-based matchmaking with tiers and leaderboard

---

## 8. ART DIRECTION

| Element    | Specification                |
| ---------- | ---------------------------- |
| Theme      | Matrix / Retro-Cyberpunk     |
| Primary    | `#00FF00` (Green)            |
| Secondary  | `#00CC00` (Dark Green)       |
| Background | `#0A0A0A` (Deep Black)       |
| Font       | JetBrains Mono               |
| Effects    | CRT scanlines, glow, flicker |

---

## 9. KERNEL PANIC EVENTS ✅

20% chance after turn 3 to trigger a global "glitch":

| Event     | Effect                              |
| --------- | ----------------------------------- |
| SEGFAULT  | All units lose 1 maxAP next turn    |
| OVERCLOCK | Free movement, but 2 HP damage/tile |
| REBOOT    | All units shift 1 tile randomly     |

---

## 10. DATABASE SCHEMA

All tables are defined in `convex/schema.ts`. Five tables total.

### `games` (indexed by `status`, `code`)

```typescript
{
  turnNum: number,           // Current turn number
  currentPlayer: string,     // "p1" or "p2"
  status: string,            // "lobby" | "drafting" | "playing" | "finished"
  environmentFlags: string[], // Environmental effects
  mapData: any,              // Procedural or preset map data
  isPublic: boolean,         // Public queue or private lobby
  code: string?,             // 4-character lobby code (private lobbies)
  p1: string?,               // Player 1 userId
  p2: string?,               // Player 2 userId
  p1Squad: string[]?,        // P1 squad unit types ["K", "A", "S", ...]
  p2Squad: string[]?,        // P2 squad unit types
  p1Typing: boolean?,        // P1 is typing indicator
  p2Typing: boolean?,        // P2 is typing indicator
  p1RevealedTiles: string[]?,// "x,y" tiles revealed to P1
  p2RevealedTiles: string[]?,// "x,y" tiles revealed to P2
  lastActionTime: number?,   // Timestamp of last action
  winner: string?,           // "p1" or "p2" (undefined for draw)
  draftStartTime: number?,   // Timestamp drafting began
  turnStartTime: number?,    // Timestamp current turn began
  p1Rap: number?,            // P1 Root Access Points (max 3)
  p2Rap: number?,            // P2 Root Access Points (max 3)
  kernelPanicActive: string?,// "SEGFAULT" | "OVERCLOCK" | "REBOOT"
  drawOffer: string?,        // "p1" | "p2" — who offered a draw
  p1LastHeartbeat: number?,  // P1 last heartbeat timestamp
  p2LastHeartbeat: number?,  // P2 last heartbeat timestamp
  p1Status: string?,         // "connected" | "disconnected" | "reconnecting"
  p2Status: string?,         // "connected" | "disconnected" | "reconnecting"
  disconnectStartTime: number?, // When disconnect was first detected
  gameStartTime: number?,    // When game transitioned drafting → playing
  rematchCode: string?,      // 4-char lobby code for rematch
  rematchLobbyId: id?,       // ID of the rematch lobby game
  mapPreset: string?,        // "grid" | "maze" | "ridge" | undefined
  sudoUsedThisGame: boolean?,// Track if sudo was used (for achievements)
  unitsLostP1: number?,      // Units P1 lost this game
  unitsLostP2: number?,      // Units P2 lost this game
}
```

### `units` (indexed by `gameId`)

```typescript
{
  gameId: id,                // Parent game
  ownerId: string,           // "p1" or "p2"
  type: string,              // "K" | "A" | "S" | "M" | "E" | "R" | "C"
  hp: number,                // Current HP
  maxHp: number,             // Maximum HP
  atk: number?,              // Attack stat
  rng: number?,              // Range stat
  vis: number?,              // Vision stat
  ap: number,                // Current Action Points
  maxAp: number,             // Maximum Action Points
  x: number,                 // Grid X position (0-11)
  y: number,                 // Grid Y position (0-11)
  direction: string,         // "N" | "E" | "S" | "W"
  isOverwatching: boolean?,  // Currently in overwatch mode
  overwatchDirection: string?, // Overwatch facing direction
  isStealthed: boolean?,     // Scout stealth state
  engineerWallCount: number?,// Remaining build uses (Engineer)
  sniperMovedThisTurn: boolean?, // Sniper movement flag
}
```

### `logs` (indexed by `gameId`)

```typescript
{
  gameId: id,                // Parent game
  timestamp: number,         // When the command was issued
  commandString: string,     // Raw command text
  result: string,            // Command result message
  playerId: string,          // Who issued the command
  visibility: "public" | "private"?, // Log visibility filter
}
```

Note: Chat messages via the `say` command are stored in the `logs` table with `commandString: "SAY: <message>"` — there is no separate `chat` table.

### `players` (indexed by `userId`, `handle`) — _Phase 10_

```typescript
{
  userId: string,            // Anonymous user_xxxx ID from localStorage
  handle: string,            // Display name (unique, 2-20 chars)
  gamesPlayed: number,       // Total completed games
  wins: number,              // Total wins
  losses: number,            // Total losses
  draws: number,             // Total draws
  achievements: string[]?,   // Unlocked achievement IDs (Phase 12)
}
```

### `matches` (indexed by `p1Id`, `p2Id`) — _Phase 10_

```typescript
{
  gameId: id,                // Reference to the finished game
  p1Id: string,              // P1 userId
  p2Id: string,              // P2 userId
  p1Handle: string,          // P1 handle at game end (snapshot)
  p2Handle: string,          // P2 handle at game end (snapshot)
  winner: string?,           // "p1" | "p2" | undefined for draw
  endReason: string,         // "elimination" | "forfeit" | "disconnect" | "timeout" | "draw"
  turns: number,             // Total turns played
  duration: number,          // Duration in milliseconds
  finishedAt: number,        // Game end timestamp
}
```

---

## 11. RELATED DOCUMENTS

| Document                     | Description                                   |
| ---------------------------- | --------------------------------------------- |
| [COMMANDS.md](./COMMANDS.md) | Full command reference with validation rules  |
| [COMBAT.md](./COMBAT.md)     | Combat system, LoS algorithm, damage formulas |
| [ROADMAP.md](./ROADMAP.md)   | Development phases and task tracking          |

---

## 12. CHANGELOG

| Version | Date       | Changes                                                                |
| ------- | ---------- | ---------------------------------------------------------------------- |
| v1.0.0  | 2026-01-13 | Initial GDD draft                                                      |
| v1.2.0  | 2026-01-13 | Added unit classes, command syntax, Kernel Panic events                |
| v1.3.0  | 2026-01-14 | Synced with Phase 4 implementation                                     |
| v1.4.0  | 2026-01-14 | Expanded command reference, added heal, ovw direction syntax           |
| v1.5.0  | 2026-01-14 | Added LoS algorithm, damage formulas, vision system, drafting rules    |
| v1.6.0  | 2026-01-14 | Refactored: Extracted detailed specs to COMMANDS.md and COMBAT.md      |
| v1.7.0  | 2026-01-15 | Added planned features: new units, game modes, competitive, AI/replays |
| v1.8.0  | 2026-05-15 | Phase 10: Player profiles, match history, rematch. Phase 11: Engineer/Sniper/Commander units, preset maps, ASCII preview, map CLI command |
| v1.9.0  | 2026-05-16 | Phase 12: AI opponent (3 difficulties), achievements (6 badges). Schema docs synced with implementation. |
