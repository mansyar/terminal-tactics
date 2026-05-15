# Phase 12: AI & Achievements — Implementation Plan

## Phase A: AI Opponent

### Task A.1: Bot Identification & Game Initiation
- [ ] Write tests: Bot ID constants, lobby button renders, AI game creation creates game with bot as p2
- [ ] Implement: Define bot ID constants (`__ai_easy__`, `__ai_medium__`, `__ai_hard__`)
- [ ] Implement: Add `isBot` helper to detect AI players
- [ ] Implement: Add "AI OPPONENT" button with difficulty selector to `LobbyScreen.tsx`
- [ ] Implement: Create game with bot as p2, bypass SquadBuilder for AI, auto-submit AI squad
- [ ] Implement: Bypass heartbeat/presence/disconnect logic for bot players
- [ ] Implement: Display bot handle as `AI_EASY` / `AI_MEDIUM` / `AI_HARD`
- [ ] Task: Conductor - Phase Completion Verification 'AI Opponent' (Protocol in workflow.md)

### Task A.2: AI Squad Builder
- [ ] Write tests: AI squad generation at each difficulty fits within 1000cr budget
- [ ] Implement: Create `aiSquadBuilder` module with difficulty-based compositions
- [ ] Implement: Integrate with existing `submitDraft` mutation flow

### Task A.3: AI Decision Engine — Easy & Medium
- [ ] Write tests: Valid action enumeration, scoring functions, Easy picks random valid, Medium uses heuristics
- [ ] Implement: Pure scoring module — `evaluateMove()`, `evaluateAttack()`, `evaluateHeal()`
- [ ] Implement: Easy strategy — random valid actions with self-preservation clause
- [ ] Implement: Medium strategy — score-based heuristics (kill low HP, heal, advance, use high ground)
- [ ] Implement: Unit action ordering — process units in priority order (Medic heals first, then attackers)

### Task A.4: AI Decision Engine — Hard (MCTS)
- [ ] Write tests: State simulation, MCTS lookahead produces better outcomes than Medium
- [ ] Implement: Light game state simulator using existing pure combat/move functions
- [ ] Implement: MCTS with ~50 simulations per decision
- [ ] Implement: Difficulty fallback — if MCTS times out, fall back to Medium strategy

### Task A.5: AI Turn Mutation
- [ ] Write tests: `aiTurn` mutation end-to-end — verifies AI actions execute and turn ends
- [ ] Implement: `convex/ai.ts` mutation — orchestrates AI turn from action selection through execution
- [ ] Implement: Client-side "thinking" delay (1.5s) and `AI_THINKING...` indicator in TurnIndicator
- [ ] Implement: AI actions get logged with `[AI]` prefix in ConsoleHistory
- [ ] Task: Conductor - Phase Completion Verification 'AI Opponent' (Protocol in workflow.md)

---

## Phase B: Achievements System

### Task B.1: Achievement Schema & Definitions
- [ ] Write tests: Schema migration maintains backward compatibility
- [ ] Implement: Add `achievements: v.array(v.string())` field to `players` Convex schema
- [ ] Implement: Define all 6 achievement IDs and unlock condition functions

### Task B.2: Achievement Checking on Game End
- [ ] Write tests: Each achievement unlocks on correct condition, does not re-unlock
- [ ] Implement: `evaluateAchievements()` function called from `recordGameEnd` flow
- [ ] Implement: Track per-game stats needed for checks (units lost, turns played, sudo used, etc.)
- [ ] Implement: Persist newly unlocked achievements to `players` document

### Task B.3: Post-Game Achievement Display
- [ ] Write tests: Post-game screen renders unlocked achievements
- [ ] Implement: `ACHIEVEMENT_UNLOCKED: [name]` notification on finished game screen
- [ ] Implement: Animated confirmation effect (glow + pulse)

### Task B.4: Lobby Achievement Profile
- [ ] Write tests: Achievement section renders locked/unlocked states correctly
- [ ] Implement: Collapsible "ACHIEVEMENTS" section in lobby screen under handle area
- [ ] Implement: Show all 6 badges with locked (dimmed) / unlocked (glowing) states
- [ ] Task: Conductor - Phase Completion Verification 'Achievements System' (Protocol in workflow.md)

---

## Acceptance Criteria Verification

### Task C.1: Final Integration & Quality Gates
- [ ] Run full test suite — all existing tests pass
- [ ] Run coverage report — >80% coverage on new code
- [ ] Run typecheck — zero errors
- [ ] Run lint — zero errors
- [ ] Manual verification: AI game at all 3 difficulty levels playable from lobby
- [ ] Manual verification: All 6 achievements unlock correctly
