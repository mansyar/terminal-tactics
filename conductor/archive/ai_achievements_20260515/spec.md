# Phase 12: AI & Achievements

## Overview

Enable single-player mode against a rule-based AI opponent and add achievement-based meta-progression. This phase adds the final gameplay layer before public deployment.

## AI Opponent (Single Player)

### 12.1 AI Game Initiation

- A new **"AI OPPONENT"** button is added to the `LobbyScreen` below the existing Quick Play / Private Session options.
- Clicking the button presents a difficulty selector: **Easy**, **Medium**, **Hard**.
- Upon selection, a lobby is created where `p1` is the human player. The bot immediately joins as `p2` (using bot ID `__ai_easy__`, `__ai_medium__`, or `__ai_hard__`), transitioning the game to `drafting` phase.
- On join, the bot auto-submits a valid AI squad via the existing `submitDraft` mutation.
- Once the human submits their squad, `startGame` detects both squads are ready and transitions to `playing` status as normal.

### 12.2 AI Turn Execution

- **Trigger:** When the human player ends their turn (via `end` command), the client-side `useGameCommands` hook detects the opponent is an AI (via `isBot()` helper).
- **"Thinking" feel:** A 1.5-second client-side delay with a visual status: `AI_THINKING...` displayed in the TurnIndicator area.
- After the delay, a single Convex mutation (`aiTurn`) is called.
- **Within the mutation:**
  1. Fetches all AI units, game state, and map data
  2. Evaluates best actions using the AI scoring engine (see 12.3)
  3. Executes all AI actions sequentially (each action as individual `db.patch`/`db.delete` calls — these stream to the client in real-time via Convex's reactive queries)
  4. Ends the AI turn by calling the **extracted `endTurnHandler`** — not the `endTurn` mutation directly. Convex does not allow calling one mutation from within another, so the turn-ending logic (AP restore, RAP gain, kernel panic, turn counter) is extracted into a shared handler that both `endTurn` (human) and `aiTurn` (AI) can call.
- The mutation **must not exceed Convex's execution limits**. Action count is bounded by max AP across AI units (~10-15 operations per turn, well within limits).

### 12.3 AI Decision Engine (`src/lib/aiEngine.ts`)

A separate, testable **pure module** (no Convex dependencies) in `src/lib/`, following the existing pattern of `combatSystem.ts` in `src/lib/` and `combat.ts` in `convex/`. Pure functions are tested directly with Bun Test without Convex mocking.

- **Easy:** Random valid actions with basic self-preservation (avoid walking into danger — defined as squares adjacent to visible hostiles).
- **Medium:** Score-based heuristics — prioritize:
  1. Killing low-HP targets (HP < 30)
  2. Healing injured allies (Medic only)
  3. Attacking vs. moving (damage output per AP)
  4. Advancing toward nearest enemy
  5. Using high ground tiles
- **Hard:** One-step lookahead with MCTS-style action scoring (NOT full multi-step MCTS — Convex mutation timeouts make multi-step simulation unreliable):
  1. Enumerate all valid actions for all AI units
  2. For each action, apply it to a **local in-memory state copy** using the existing pure combat/move functions
  3. Score the resulting state using Medium-level heuristics (how many enemies threatenable, how much damage dealt, ally HP improved)
  4. Weight scores by a simple lookahead bonus (+10% if action eliminates a unit, +5% if action claims high ground)
  5. Pick the action sequence with the highest weighted score
  6. **Fallback:** If the evaluation takes too many iterations (>200 candidate actions), cap the search and fall back to Medium strategy

### 12.4 AI Squad Builder (`convex/aiSquadBuilder.ts`)

The bot generates a valid squad within 1000 credit budget using the point-buy system. Difficulty-based squad compositions (max 5 units, enforced by `startGame` spawn positions):
- **Easy:** Random valid units (any mix, within budget)
- **Medium:** Balanced composition (Knight + Archer + Scout)
- **Hard:** Optimized composition (Commander + Sniper + Medic + Knight)

### 12.5 Engineering: Bot Identification

- Bot IDs (`__ai_easy__`, `__ai_medium__`, `__ai_hard__`) are recognized throughout the game pipeline via a shared `isBot(id)` helper.
- **Heartbeat & Disconnect bypass:** `checkDisconnectHandler` in `convex/presence.ts` is updated to skip players whose ID starts with `__ai_`. This prevents the AI from being flagged as "disconnected" after 30s of no heartbeat.
- **Timer bypass:** `checkTurnTimeout` in `convex/timers.ts` already guards against advancing the turn for disconnected players. Since AI bypasses disconnect detection, this is safe — but a direct `isBot` guard is added for robustness.
- **Grace period bypass:** `checkDisconnectGracePeriod` in `convex/timers.ts` skips bot players.
- Bot squads bypass the SquadBuilder UI (auto-submitted on lobby join).
- Bot handle displayed as `AI_EASY`, `AI_MEDIUM`, `AI_HARD` respectively in all UI locations (TurnIndicator, post-game screen, lobby).

---

## Achievements System

### 12.6 Schema

- Add `achievements: v.array(v.string())` field to the `players` Convex table.
- Each string is an achievement ID (e.g., `"first_blood"`, `"tactician"`).
- Add `sudoUsedThisGame: v.optional(v.boolean())` and `unitsLostP1: v.optional(v.number())`, `unitsLostP2: v.optional(v.number())` fields to the `games` table. These track per-game data needed for achievement evaluation:
  - `sudoUsedThisGame` — set to `true` when any `sudo mv`/`sudo scan`/`sudo atk` mutation executes
  - `unitsLostP1`/`unitsLostP2` — incremented when a unit is destroyed (in `combat.ts:attackUnit` and `movement.ts:moveUnit`)

### 12.7 Achievement Definitions (6 total)

| ID | Name | Unlock Condition |
|----|------|-----------------|
| `first_blood` | "First Blood" | Win your first-ever game (gamesPlayed goes from 0→1 with a win) |
| `tactician` | "Tactician" | Win without losing any of your units |
| `comeback_kid` | "Comeback Kid" | Win after losing 3+ of your own units |
| `sudo_master` | "Sudo Master" | Win in a game where `sudoUsedThisGame` is true |
| `patience` | "Patience" | Win a game lasting 20+ turns |
| `speed_demon` | "Speed Demon" | Win a game in under 5 turns |

### 12.8 Achievement Checking

- After every finished game (any win path: elimination, forfeit, timeout, disconnect, draw), evaluate all 6 achievements for the human player.
- **Data flow:** The game-finishing mutation (combat, movement, forfeit, timer, disconnect) calls `recordGameEndHandler` with the game doc still available. Achievement evaluation reads:
  - `game.turnNum` for `patience` and `speed_demon`
  - `game.sudoUsedThisGame` for `sudo_master`
  - `game.unitsLostP1` / `game.unitsLostP2` for `tactician` and `comeback_kid`
  - Player's pre-game `gamesPlayed` counter for `first_blood` (compare pre and post)
- Achievements against AI opponents count (same as PvP).
- Newly unlocked achievements are written to the `players` document via `ctx.db.patch` in the same mutation transaction.

### 12.9 Achievement Display

- **Post-game screen:** Newly unlocked achievements appear as an animated confirmation: `ACHIEVEMENT_UNLOCKED: [NAME]` with a brief description. Rendered inline below the existing stats panel with a glow pulse animation.
- **Lobby/Profile:** A collapsible "ACHIEVEMENTS" section in the lobby screen under the handle area, showing all 6 badges with locked (dimmed bracket `[???]`) / unlocked (glowing green text with achievement name `[FIRST_BLOOD]`) states.

---

## Out of Scope

- No competitive AI rankings or leaderboard
- No PvE campaign or story mode
- No Steam achievement integration
- No achievement sound effects (existing audio system is sufficient)
- No animations for AI unit movements (existing framer-motion sliding animations handle this automatically)
- No achievements for bot players (human only)

## Acceptance Criteria

1. Single-player AI game can be started from the lobby at 3 difficulty levels
2. AI generates valid squads within budget (max 5 units)
3. AI makes legal moves only (validated by existing game logic)
4. Easy AI plays recognizably "dumb" (random, self-preservation only)
5. Medium AI plays competently (heuristic-based tactics)
6. Hard AI shows strategic preference (target prioritization, one-step lookahead scoring)
7. All 6 achievements unlock on correct conditions per the definitions in 12.7
8. Achievements persist and display on post-game screen and lobby profile
9. `endTurn` handler extracted and shared between human `endTurn` mutation and AI `aiTurn` mutation
10. Bot ID check prevents AI from being flagged as disconnected or auto-forfeited
11. All existing tests pass; new tests achieve >80% coverage on new code
