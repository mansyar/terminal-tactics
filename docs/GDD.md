# 📑 PROJECT: TERMINAL TACTICS (GDD v1.7.0)

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
| Game Modes     | Elimination ✅, King of the Hill _(Phase 11)_ |

### B. Map System

- **Grid Sizes:** 8×8 (Quick), 12×12 (Standard) ✅, 16×16 (Large) _(Phase 11)_
- **Generation:** Procedural via Cellular Automata, or Preset Maps _(Phase 11)_
- **Coordinates:** Chess notation (A-L columns, 1-12 rows)
- **Terrain:**
  - Floor (`.`) — traversable
  - Wall (`#`) — blocks movement and LoS
  - High Ground (`^`) — grants combat bonuses
  - Control Point (`◉`) — objective tile _(Phase 11, King of the Hill)_

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

### Expansion Units _(Phase 11)_

| Symbol | Class     | Cost |  HP |  AP | ATK | RNG | VIS | Ability                    |
| ------ | --------- | ---: | --: | --: | --: | --: | --: | -------------------------- |
| `[E]`  | Engineer  |  200 |  60 |   3 |  10 |   1 |   3 | Build/Demolish walls       |
| `[N]`  | Sniper    |  350 |  40 |   2 |  40 |   8 |   6 | Stationary attack only     |
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
| Build     | `build [c]`    |      1 | Phase 11 |
| Demolish  | `demolish [c]` |      1 | Phase 11 |
| Rally     | `rally [c]`    |      1 | Phase 11 |

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

### Alternative Win Conditions _(Phase 11)_

| Mode             | Condition                            |
| ---------------- | ------------------------------------ |
| Elimination      | Destroy all enemy units (default) ✅ |
| King of the Hill | Control center point for 5 turns     |

---

## 7. INFRASTRUCTURE

### Matchmaking ✅

- **Private Lobby:** 4-digit code (e.g., `X7Z2`)
- **Quick Play:** Auto-join or create public lobby
- **Ranked Queue:** ELO-based matchmaking _(Phase 10)_

### Persistence ✅

- `userId` — Anonymous UUID in LocalStorage
- `terminal_tactics_game_id` — Active session (rejoin on refresh)
- `handle` — Custom player name _(Phase 10)_

### Real-time Features ✅

- Typing indicator ("Player is typing...")
- Instant state sync via Convex subscriptions
- Disconnect detection & grace period _(Phase 8)_

### Competitive Infrastructure _(Phase 10)_

- **ELO Rating:** K=32 formula, starting at 1200
- **Rank Tiers:** Bronze, Silver, Gold, Platinum, Diamond
- **Leaderboard:** Top 100 global rankings
- **Match History:** Last 50 games with stats

### Advanced Features _(Phase 12)_

- **Spectator Mode:** Watch live games with shareable link
- **Game Replay:** Step-through replay of completed matches
- **AI Opponent:** Practice against rule-based AI (Easy/Medium/Hard)
- **Achievements:** Unlockable badges for milestones

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

### Current Schema ✅

```typescript
// games
{
  ;(turnNum,
    currentPlayer,
    status,
    mapData,
    code,
    p1,
    p2,
    p1Squad,
    p2Squad,
    p1Typing,
    p2Typing,
    winner,
    draftDeadline,
    turnDeadline,
    kernelPanicActive,
    rap)
}

// units (indexed by gameId)
{
  ;(gameId,
    ownerId,
    type,
    hp,
    maxHp,
    ap,
    maxAp,
    atk,
    rng,
    vis,
    x,
    y,
    direction,
    isStealthed,
    overwatchDir)
}

// logs (indexed by gameId)
{
  ;(gameId, timestamp, commandString, result, playerId, visibility)
}

// chat (indexed by gameId)
{
  ;(gameId, playerId, handle, message, timestamp)
}
```

### Planned Schema Additions

```typescript
// players _(Phase 10)_
{
  ;(userId, handle, gamesPlayed, wins, losses, elo, achievements)
}

// replays _(Phase 12)_
{
  ;(gameId, commands, states, createdAt)
}

// spectators _(Phase 12)_
{
  ;(gameId, sessionIds, count)
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
