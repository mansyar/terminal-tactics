# Phase 12: AI & Achievements — Implementation Plan

## Phase A: AI Opponent

### Task A.1: Bot Identification & Game Initiation [e726136]
- [x] Write tests: Bot ID constants, `isBot()` helper, lobby button renders, AI game creation creates game with bot as p2
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: Define bot ID constants (`__ai_easy__`, `__ai_medium__`, `__ai_hard__`)
- [x] Implement: Add `isBot(id)` helper — returns true if ID starts with `__ai_`
- [x] Implement: Add "AI OPPONENT" button with difficulty selector to `LobbyScreen.tsx`
- [x] Implement: Create game with bot as p2, bypass SquadBuilder for AI, auto-submit AI squad via `submitDraft`
- [x] Implement: Update `checkDisconnectHandler` in `convex/presence.ts` to skip bot IDs
- [x] Implement: Update `checkDisconnectGracePeriod` in `convex/timers.ts` to skip bot IDs
- [x] Implement: Guard `checkTurnTimeout` against AI turns (redundant but defensive)
- [x] Implement: Display bot handle as `AI_EASY` / `AI_MEDIUM` / `AI_HARD`
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task A.2: AI Squad Builder [544ee32]
- [x] Write tests: AI squad generation at each difficulty fits within 1000cr budget, respects max 5 units
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: Create `convex/aiSquadBuilder.ts` module with difficulty-based compositions
    - Easy: Knight + Archer + Scout (total 650cr)
    - Medium: Knight + Archer + Medic + Scout (total 900cr)
    - Hard: Commander + Sniper + Medic (total 1000cr)
- [x] Implement: Integrate with existing `submitDraft` mutation flow — AI squad auto-submitted via p2Squad field in createAIGame
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task A.3: AI Decision Engine — Easy & Medium [6c3e42d]
- [x] Write tests: Valid action enumeration, scoring functions, Easy picks random valid, Medium uses heuristics, `isBot` detection
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: Pure module at `src/lib/aiEngine.ts` (no Convex deps, mirrors pattern of `combatSystem.ts`)
    - `evaluateMove()`, `evaluateAttack()`, `evaluateHeal()`, `evaluateScan()`, `evaluateOverwatch()`
- [x] Implement: Easy strategy — random valid actions with self-preservation clause (avoid tiles adjacent to visible hostiles)
- [x] Implement: Medium strategy — score-based heuristics (kill low HP > heal > attack > advance > use high ground > random)
- [x] Implement: Unit action ordering — process units in priority order (Medic heals first, then attackers, then movers)
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task A.4: AI Decision Engine — Hard (One-Step Lookahead) [3f4076c]
- [x] Write tests: State simulation produces correct scores, Hard outperforms Medium in controlled scenarios
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: State simulator — clone game/unit state in-memory and apply actions using existing pure combat/move functions
- [x] Implement: Action scoring — for each candidate action, apply to local state copy, evaluate resulting state via Medium heuristics
- [x] Implement: Weighting — +10% score if action eliminates a unit, +5% if claims high ground, +3% if reduces ally exposure
- [x] Implement: Search cap — if candidate actions exceed 200, sample top-N by Medium score, evaluate only those
- [x] Implement: Fallback — if total evaluation time would be excessive, fall back to Medium strategy
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task A.5: AI Turn Mutation [03d408d]
- [x] Write tests: `aiTurn` mutation end-to-end — AI actions execute, turn ends, opponent turn begins
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: Extract `endTurnHandler` from `convex/game.ts` — shared handler that both `endTurn` mutation and AI mutation call
- [x] Implement: `convex/ai.ts` mutation — orchestrates: fetch state → evaluate actions → execute actions via `db.patch` → call `endTurnHandler`
- [x] Implement: Client-side "thinking" delay (1.5s) and `AI_THINKING...` indicator in TurnIndicator area
- [x] Implement: AI actions logged with `[AI]` prefix in ConsoleHistory for human readability
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`
- [x] Task: Conductor - Phase Completion Verification 'AI Opponent' (Protocol in workflow.md) [checkpoint: c15b6e9]

---

## Phase B: Achievements System

### Task B.1: Achievement Schema & Definitions [2e6ef3e]
- [x] Write tests: Schema migration maintains backward compatibility, achievement IDs defined correctly
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: Add `achievements: v.array(v.string())` field to `players` Convex schema
- [x] Implement: Add `sudoUsedThisGame: v.optional(v.boolean())` and `unitsLostP1: v.optional(v.number())`, `unitsLostP2: v.optional(v.number())` to `games` Convex schema
- [x] Implement: Define all 6 achievement IDs and unlock condition functions as pure functions in `src/lib/achievements.ts`
- [x] Implement: Wire `sudoUsedThisGame` — update to true in `convex/sudo.ts` on any sudo command execution
- [x] Implement: Wire `unitsLostP1`/`unitsLostP2` — increment in `convex/combat.ts` and `convex/movement.ts` when unit is destroyed
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task B.2: Achievement Checking on Game End [2e6ef3e]
- [x] Write tests: Each achievement unlocks on correct condition, does not re-unlock, `first_blood` checks gamesPlayed transition
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: `evaluateAchievements()` function called from `recordGameEndHandler` flow
    - Reads `game.turnNum`, `game.sudoUsedThisGame`, `game.unitsLostP1`/`unitsLostP2`, player's pre-game `gamesPlayed`
- [x] Implement: `first_blood` logic — check if player's pre-game `gamesPlayed === 0` AND they won
- [x] Implement: Persist newly unlocked achievements to `players.achievements` array via `ctx.db.patch`
- [x] Implement: Skip achievement evaluation for bot players (AI does not earn achievements)
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task B.3: Post-Game Achievement Display [5e873ba]
- [x] Write tests: Post-game screen renders newly unlocked achievements above existing stats, not shown for bots
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: `ACHIEVEMENT_UNLOCKED: [NAME]` notification on finished game screen, rendered between the result header and stats panel
- [x] Implement: Animated confirmation effect (glow + pulse, consistent with existing CSS animations)
- [x] Implement: Achievements fetched via playerStats query for post-game display
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`

### Task B.4: Lobby Achievement Profile [5e873ba]
- [x] Write tests: Achievement section renders locked/unlocked states correctly, collapsible behavior works
    - [x] Run tests to confirm failures (Red Phase verification)
- [x] Implement: Collapsible "ACHIEVEMENTS" section in lobby screen under handle area, below existing stats
- [x] Implement: Badge rendering — locked: dimmed bracket `[???]` in matrix-primary/30 opacity; unlocked: glowing green text `[FIRST_BLOOD]` with achievement name label
- [x] Implement: Fetch `achievements` field from `players` document and display all 6 badges
    - [x] Run tests to confirm passing
    - [x] Run `bun run type-check; bun run lint; bun test --coverage`
- [ ] Task: Conductor - Phase Completion Verification 'Achievements System' (Protocol in workflow.md)
