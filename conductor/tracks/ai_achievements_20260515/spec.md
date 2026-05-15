# Phase 12: AI & Achievements

## Overview

Enable single-player mode against a rule-based AI opponent and add achievement-based meta-progression. This phase adds the final gameplay layer before public deployment.

## AI Opponent (Single Player)

### 12.1 AI Game Initiation

- A new **"AI OPPONENT"** button is added to the `LobbyScreen` below the existing Quick Play / Private Session options.
- Clicking the button presents a difficulty selector: **Easy**, **Medium**, **Hard**.
- Upon selection, a game is created where `p2` is a bot ID (`__ai_easy__`, `__ai_medium__`, or `__ai_hard__`).
- The bot joins the "lobby" immediately, transitions to `drafting` phase, and auto-submits a valid AI squad via the existing `submitDraft` mutation.
- Once both squads are ready, the game proceeds to `playing` status as normal.

### 12.2 AI Turn Execution

- **Trigger:** When the human player ends their turn (`end` command), the client-side `useGameCommands` hook detects the opponent is an AI.
- **"Thinking" feel:** A 1.5-second client-side delay with a visual status: `AI_THINKING...` displayed in the TurnIndicator area.
- After the delay, a single Convex mutation (`aiTurn`) is called.
- **Within the mutation:**
  1. Fetches all AI units, game state, and map data
  2. Evaluates best actions using the AI scoring engine
  3. Executes all AI actions sequentially (each as individual `db.patch`/`db.delete` calls — these stream to the client in real-time)
  4. Ends the AI turn via the same `endTurn` mutation used by human players
- The mutation **must not exceed Convex's execution limits**. Action count is bounded by max AP across AI units (conservative upper bound: ~10-15 operations per turn).

### 12.3 AI Decision Engine (`convex/ai.ts`)

A separate, testable module containing pure scoring functions:

- **Easy:** Random valid actions with basic self-preservation (avoid walking into danger — defined as squares adjacent to visible hostiles).
- **Medium:** Score-based heuristics — prioritize:
  1. Killing low-HP targets (HP < 30)
  2. Healing injured allies (Medic only)
  3. Attacking vs. moving (damage output per AP)
  4. Advancing toward nearest enemy
  5. Using high ground tiles
- **Hard:** One-turn lookahead (light MCTS ~50 simulations per decision):
  1. Generate all valid actions for all AI units
  2. For each action, simulate resulting game state using pure combat/move functions
  3. Run randomized playouts with Medium-level responses
  4. Pick highest win-rate action sequence

### 12.4 AI Squad Builder

The bot generates a valid squad within 1000 credit budget using the point-buy system. Difficulty-based squad compositions:
- **Easy:** Random units (any mix)
- **Medium:** Balanced composition (Knight + Archer + Scout)
- **Hard:** Optimized composition (Commander + Sniper + Medic + Knight)

### 12.5 Engineering: Bot Identification

- Bot IDs (`__ai_easy__`, `__ai_medium__`, `__ai_hard__`) are recognized throughout the game pipeline.
- Connection status, heartbeat, and disconnect logic are bypassed for AI players (AI is always "connected").
- Bot squads bypass the SquadBuilder UI (auto-submitted).
- Bot handle displayed as `AI_EASY`, `AI_MEDIUM`, `AI_HARD` respectively.

---

## Achievements System

### 12.6 Schema

- Add `achievements: v.array(v.string())` field to the `players` Convex table.
- Each string is an achievement ID (e.g., `"first_blood"`, `"tactician"`).

### 12.7 Achievement Definitions (6 total)

| ID | Name | Unlock Condition |
|----|------|-----------------|
| `first_blood` | "First Blood" | Win your first game |
| `tactician` | "Tactician" | Win without losing any units |
| `comeback_kid` | "Comeback Kid" | Win after losing 3+ of your own units |
| `sudo_master` | "Sudo Master" | Win while having used at least one sudo command |
| `patience` | "Patience" | Win a game lasting 20+ turns |
| `speed_demon` | "Speed Demon" | Win a game in under 6 turns |

### 12.8 Achievement Checking

- After every finished game (any win path: elimination, forfeit, timeout, disconnect, draw), evaluate all 6 achievements for the human player.
- Newly unlocked achievements are written to the `players` document.
- Achievements against AI opponents count (same as PvP).

### 12.9 Achievement Display

- **Post-game screen:** Newly unlocked achievements appear as an animated confirmation: `ACHIEVEMENT_UNLOCKED: [NAME]` with a brief description.
- **Lobby/Profile:** A collapsible "ACHIEVEMENTS" section in the lobby screen under the handle area, showing all 6 badges with locked/unlocked states.

---

## Out of Scope

- No competitive AI rankings or leaderboard
- No PvE campaign or story mode
- No Steam achievement integration
- No achievement sound effects (existing audio system is sufficient)
- No animations for AI unit movements (existing framer-motion sliding animations handle this automatically)

## Acceptance Criteria

1. Single-player AI game can be started from the lobby at 3 difficulty levels
2. AI generates valid squads within budget
3. AI makes legal moves only (validated by existing game logic)
4. Easy AI plays recognizably "dumb" (random, self-preservation only)
5. Medium AI plays competently (heuristic-based tactics)
6. Hard AI shows strategic preference (target prioritization, MCTS lookahead)
7. All 6 achievements unlock on correct conditions
8. Achievements persist and display on post-game screen and lobby profile
9. All existing tests pass; new tests achieve >80% coverage on new code
