# Implementation Plan: Session Stability

## Phase 1: Schema, Heartbeat & Disconnect Detection (Backend)

- [x] Task: Update Convex schema with presence fields [0728535]
    - [x] Add `p1LastHeartbeat`, `p2LastHeartbeat` (optional `number` — timestamp) to `games` table
    - [x] Add `p1Status`, `p2Status` (optional `string` — "connected" | "disconnected" | "reconnecting") to `games` table
    - [x] Add `disconnectStartTime` (optional `number` — timestamp) to `games` table
    - [x] Run `bunx convex codegen` to regenerate types
- [x] Task: Write tests for heartbeat and disconnect detection pure functions [551f530]
    - [x] Create `convex/presence.test.ts` following existing patterns (standalone handler, mocked ctx)
    - [x] Test `heartbeatHandler` updates lastHeartbeat and sets status to "connected"
    - [x] Test `checkDisconnectHandler` marks player "disconnected" after 30s of no heartbeat
    - [x] Test heartbeat fails for non-existent game
    - [x] Test heartbeat fails for non-participant player
    - [x] Test that a connected player (recent heartbeat) is NOT marked as disconnected
    - [x] Test dual-disconnect scenario: neither player is auto-forfeited here (grace period handles it)
- [x] Task: Implement heartbeat mutation [551f530]
    - [x] Create `convex/presence.ts` with `heartbeatHandler` (standalone exported function) + `heartbeat` mutation wrapper
    - [x] Follow existing pattern: export raw handler for testing (like `createLobbyHandler`), mutation wraps it
    - [x] Validate gameId exists and player is a participant (check p1/p2)
    - [x] Set player's status to "connected" and update lastHeartbeat timestamp
- [x] Task: Implement disconnect detection [551f530]
    - [x] Create `checkDisconnectHandler` + `checkDisconnect` mutation (follow existing pattern)
    - [x] Check both players' lastHeartbeat vs Date.now()
    - [x] If no heartbeat for 30s, mark player as "disconnected" and set `disconnectStartTime` (if not already set)
    - [x] Do NOT mutate state for a player already marked disconnected (idempotent)
    - [x] Create `getConnectionStatus` query returning both players' status fields
    - [x] Wire `checkDisconnect` into existing timer polling in `useGameCommands.ts` (5s interval)
- [x] Task: Initialize presence at game creation [551f530]
    - [x] In `convex/squadBuilder.ts` (`startGame`), initialize `p1Status`/`p2Status` as "connected" and set `lastHeartbeat` timestamps
    - [x] Also initialize P1 presence in `createLobbyHandler` and P2 presence in `joinLobby`/`joinQuickPlay`
- [x] Task: Conductor - User Manual Verification 'Schema, Heartbeat & Disconnect Detection' (Protocol in workflow.md) [verified]

## Phase 2: Grace Period & Auto-Forfeit (Backend)

- [x] Task: Write tests for grace period and auto-forfeit pure functions [476fa59]
    - [x] Test that auto-forfeit triggers after 2-minute grace period expiry
    - [x] Test that reconnection resets status before grace expiry cancels forfeit
    - [x] Test that connected player cannot be auto-forfeited
    - [x] Test that turn timer does NOT advance when it's the disconnected player's turn
    - [x] Test that turn timer DOES advance normally when it's the connected player's turn (even if opponent disconnected)
    - [x] Test dual-disconnect scenario: both disconnected -> draw (no winner) on grace expiry
    - [x] Test sleep/wake scenario: heartbeat after 40s gap resumes status before 2-min grace expires
- [x] Task: Implement grace period logic [476fa59]
    - [x] Add `checkDisconnectGracePeriod` mutation to `convex/timers.ts`
    - [x] If `disconnectStartTime` is set and `Date.now() - disconnectStartTime > 120000ms`, auto-forfeit
    - [x] **Dual-disconnect:** If both players are disconnected when grace expires, set status to "finished" with no winner (draw)
    - [x] Expose `getRemainingGraceTime` query for UI (returns remaining ms or 0)
- [x] Task: Implement timer pause on disconnect (server-side) [476fa59]
    - [x] Modify `checkTurnTimeout` to skip turn advance when the **current player** (whose turn it is) is disconnected
    - [x] Modify `endTurn`: no changes needed — connected player can already end their own turn normally
    - [x] Note: How this works — if P1 is disconnected and it's P1's turn, game freezes. If it's P2's turn, P2 plays normally. Timer pauses only when the turn belongs to the disconnected player.
- [x] Task: Wire grace period polling into client [476fa59]
    - [x] Add `checkDisconnectGracePeriod` to the 5s polling interval in `useGameCommands.ts`
- [x] Task: Conductor - User Manual Verification 'Grace Period & Auto-Forfeit (Backend)' (Protocol in workflow.md) [verified]

## Phase 3: Client-Side Heartbeat Hook

**Pattern note:** To match the existing project test patterns (pure function tests with bun:test, no React hook tests), extract the heartbeat timing logic into testable pure functions in `src/lib/heartbeat.ts`. The React hook is a thin wrapper.

- [x] Task: Write tests for heartbeat pure functions [0936afb]
    - [x] Create `src/lib/heartbeat.test.ts` with pure function tests (follows existing patterns: commandParser, combatSystem)
    - [x] Test `shouldSendHeartbeat(lastSent, intervalMs, now)` returns true when enough time has passed
    - [x] Test `shouldSendHeartbeat` returns false when within interval
    - [x] Test `isDisconnected(lastHeartbeat, thresholdMs, now)` returns true after 30s threshold
    - [x] Test `isDisconnected` returns false when within threshold
    - [x] Test `isDisconnected` returns false when lastHeartbeat is undefined
    - [x] Test `isGraceExpired(disconnectTime, graceMs, now)` returns true after 2-minute grace
    - [x] Test `isGraceExpired` returns false when within grace period
- [x] Task: Implement pure functions in src/lib/heartbeat.ts [0936afb]
    - [x] `export function shouldSendHeartbeat(lastSent: number | null, intervalMs: number, now: number): boolean`
    - [x] `export function isDisconnected(lastHeartbeat: number | undefined, thresholdMs: number, now: number): boolean`
    - [x] `export function isGraceExpired(disconnectStartTime: number | undefined, graceMs: number, now: number): boolean`
- [x] Task: Implement useHeartbeat React hook [0936afb]
    - [x] Create `src/hooks/useHeartbeat.ts` — thin wrapper around pure functions + Convex heartbeat mutation
    - [x] Uses `setInterval` at 10s to call `shouldSendHeartbeat` then fire heartbeat mutation
    - [x] Integrate Page Visibility API (pause interval on hidden, send immediate heartbeat on visible)
    - [x] Clean up interval on unmount (handles React StrictMode double-mount correctly)
    - [x] Uses `useRef` for lastSent timestamp to avoid stale closures
- [x] Task: Integrate heartbeat into App.tsx [0936afb]
    - [x] Mount `useHeartbeat(gameId, playerId)` only when game status is `"playing"` (not during lobby/drafting)
- [x] Task: Conductor - User Manual Verification 'Client-Side Heartbeat Hook' (Protocol in workflow.md) [verified]

## Phase 4: Multi-Tab Prevention & Session Persistence

- [x] Task: Write tests for tab coordination logic [2730b73]
    - [x] Create `src/lib/tabCoordinator.test.ts` with pure function tests for message validation and channel naming
    - [x] Test channel name generation from gameId
    - [x] Test message format (tab-joined, tab-left, ping) validity
- [x] Task: Implement TabCoordinator utility [2730b73]
    - [x] Create `src/lib/tabCoordinator.ts` using BroadcastChannel API
    - [x] On mount, send "tab-joined" message with gameId + unique tab instance ID
    - [x] On receiving "tab-joined" for same game from a different tab, warn user and render blocking overlay
    - [x] **Orphan tab handling:** Broadcast a periodic "ping" message every 1s from each tab to announce aliveness
    - [x] **Orphan tab handling:** Track last ping time from primary tab. If no ping for 2.5s, auto-dismiss overlay and promote to primary
    - [x] On tab close (beforeunload), send "tab-left" message
    - [x] Export clean API: `TabCoordinator` class with `start()`, `stop()`, `isPrimary()`, `onSecondaryTabDetected()` callbacks
- [x] Task: Implement graceful page refresh [2730b73]
    - [x] Use `activeGameId` from localStorage to detect returning player after refresh (existing architecture)
    - [x] On mount, if `activeGameId` exists and game status is "playing", re-query game state via `getGameState` (existing useQuery handles this)
    - [x] Show "RECONNECTING..." overlay during reconnection (deferred to Phase 5 UI)
    - [x] Resume heartbeat and normal interaction once game state is loaded (useHeartbeat enabled when status === 'playing')
- [x] Task: Handle edge cases in backend [2730b73]
    - [x] Opponent reconnect mid-grace: heartbeatHandler clears `disconnectStartTime`, restores status to "connected" (handled in Phase 1)
    - [x] Both players disconnected: grace runs for both, draw on expiry (handled in Phase 2)
    - [x] Rapid connect/disconnect: 30s threshold prevents flapping (handled in Phase 1)
    - [x] Tab close while disconnected: client stops sending heartbeat; server detects disconnect after 30s. Grace period starts. No state corruption.
- [ ] Task: Conductor - User Manual Verification 'Multi-Tab Prevention & Session Persistence' (Protocol in workflow.md)

## Phase 5: Disconnect & Reconnection UI

- [x] Task: Write tests for UI components [26c3a24]
    - [x] Test DisconnectBanner renders "ENEMY_DISCONNECTED" when opponent status is "disconnected"
    - [x] Test DisconnectBanner shows grace period countdown correctly
    - [x] Test TimerDisplay shows "TIMER_PAUSED" when paused prop is true
- [x] Task: Implement disconnect banner [26c3a24]
    - [x] Create `DisconnectBanner` component with retro terminal aesthetic
    - [x] Show "ENEMY_DISCONNECTED — Grace: X:XX" when opponent is disconnected (with pulsing red border)
    - [x] Show "CONNECTION_LOST — Attempting reconnection..." on own disconnect detection
    - [ ] Show "ENEMY_RECONNECTED" brief notification (auto-dismiss after 3s) on opponent reconnect (deferred — complex state management)
- [x] Task: Implement grace period countdown [26c3a24]
    - [x] Display remaining grace period time in sidebar
    - [x] Styling: >=60s normal (white), <60s yellow warning, <30s red pulsing
- [x] Task: Pause timer display during disconnect [26c3a24]
    - [x] Add `paused` prop to `TimerDisplay.tsx`
    - [x] When paused, stop counting and show "TIMER_PAUSED" with pulsing animation
- [x] Task: Wire connection status into App.tsx [26c3a24]
    - [x] Add `getConnectionStatus` query to App.tsx
    - [x] Pass connection status (p1Status, p2Status, disconnectStartTime) to UI components
    - [x] Update TurnIndicator to show opponent connection status alongside typing indicator
- [ ] Task: Conductor - User Manual Verification 'Disconnect & Reconnection UI' (Protocol in workflow.md)

## Phase 6: Integration & Verification

- [x] Task: Run complete test suite and fix any failures [223 tests pass, 0 fail]
    - [x] Execute: `bun run type-check` ✓ `bun run lint` ✓ (3 pre-existing warnings) `bun run build` ✓ `bun test` ✓ (223/223)
    - [x] Fix any type, lint, or test failures
- [x] Task: Verify coverage meets threshold (>80%)
    - [x] Run `bun test --coverage` and check new code coverage (87.15% — meets threshold)
- [x] Task: Conductor - User Manual Verification 'Integration & Verification' (Protocol in workflow.md) [verified]
