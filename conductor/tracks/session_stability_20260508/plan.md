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
- [ ] Task: Conductor - User Manual Verification 'Grace Period & Auto-Forfeit (Backend)' (Protocol in workflow.md) [pending]

## Phase 3: Client-Side Heartbeat Hook

**Pattern note:** To match the existing project test patterns (pure function tests with bun:test, no React hook tests), extract the heartbeat timing logic into testable pure functions in `src/lib/heartbeat.ts`. The React hook is a thin wrapper.

- [ ] Task: Write tests for heartbeat pure functions
    - [ ] Create `src/lib/heartbeat.test.ts` with pure function tests (follows existing patterns: commandParser, combatSystem)
    - [ ] Test `shouldSendHeartbeat(lastSent, intervalMs, now)` returns true when enough time has passed
    - [ ] Test `shouldSendHeartbeat` returns false when within interval
    - [ ] Test `isDisconnected(lastHeartbeat, thresholdMs, now)` returns true after 30s threshold
    - [ ] Test `isDisconnected` returns false when within threshold
    - [ ] Test `isDisconnected` returns false when lastHeartbeat is undefined
    - [ ] Test `isGraceExpired(disconnectTime, graceMs, now)` returns true after 2-minute grace
    - [ ] Test `isGraceExpired` returns false when within grace period
- [ ] Task: Implement pure functions in src/lib/heartbeat.ts
    - [ ] `export function shouldSendHeartbeat(lastSent: number | null, intervalMs: number, now: number): boolean`
    - [ ] `export function isDisconnected(lastHeartbeat: number | undefined, thresholdMs: number, now: number): boolean`
    - [ ] `export function isGraceExpired(disconnectStartTime: number | undefined, graceMs: number, now: number): boolean`
- [ ] Task: Implement useHeartbeat React hook
    - [ ] Create `src/hooks/useHeartbeat.ts` — thin wrapper around pure functions + Convex heartbeat mutation
    - [ ] Uses `setInterval` at 10s to call `shouldSendHeartbeat` then fire heartbeat mutation
    - [ ] Integrate Page Visibility API (pause interval on hidden, send immediate heartbeat on visible)
    - [ ] Clean up interval on unmount (handles React StrictMode double-mount correctly)
    - [ ] Uses `useRef` for lastSent timestamp to avoid stale closures
- [ ] Task: Integrate heartbeat into App.tsx
    - [ ] Mount `useHeartbeat(gameId, playerId)` only when game status is `"playing"` (not during lobby/drafting)
- [ ] Task: Conductor - User Manual Verification 'Client-Side Heartbeat Hook' (Protocol in workflow.md)

## Phase 4: Multi-Tab Prevention & Session Persistence

- [ ] Task: Write tests for tab coordination logic
    - [ ] Create `src/lib/tabCoordinator.test.ts` with pure function tests for message validation and channel naming
    - [ ] Test channel name generation from gameId
    - [ ] Test message format (tab-joined, tab-left, ping) validity
- [ ] Task: Implement TabCoordinator utility
    - [ ] Create `src/lib/tabCoordinator.ts` using BroadcastChannel API
    - [ ] On mount, send "tab-joined" message with gameId + unique tab instance ID
    - [ ] On receiving "tab-joined" for same game from a different tab, warn user and render blocking overlay
    - [ ] **Orphan tab handling:** Broadcast a periodic "ping" message every 1s from each tab to announce aliveness
    - [ ] **Orphan tab handling:** Track last ping time from primary tab. If no ping for 2s, auto-dismiss overlay and promote to primary
    - [ ] On tab close (beforeunload), send "tab-left" message
    - [ ] Export clean API: `TabCoordinator` class with `start()`, `stop()`, `isPrimary()`, `onSecondaryTabDetected()` callbacks
- [ ] Task: Implement graceful page refresh
    - [ ] Use `activeGameId` from localStorage to detect returning player after refresh
    - [ ] On mount, if `activeGameId` exists and game status is "playing", re-query game state via `getGameState`
    - [ ] Show "RECONNECTING..." overlay during reconnection
    - [ ] Resume heartbeat and normal interaction once game state is loaded
- [ ] Task: Handle edge cases in backend
    - [ ] Opponent reconnect mid-grace: clear `disconnectStartTime`, restore status to "connected", resume any paused turn timer
    - [ ] Both players disconnected: grace runs for both, draw on expiry (handled in Phase 2)
    - [ ] Rapid connect/disconnect: heartbeat resets timer, no spurious disconnect events. The 30s threshold already prevents flapping.
    - [ ] Tab close while disconnected: client stops sending heartbeat; server detects disconnect after 30s. Grace period starts. No state corruption.
- [ ] Task: Conductor - User Manual Verification 'Multi-Tab Prevention & Session Persistence' (Protocol in workflow.md)

## Phase 5: Disconnect & Reconnection UI

- [ ] Task: Write tests for UI components
    - [ ] Test DisconnectBanner renders "ENEMY_DISCONNECTED" when opponent status is "disconnected"
    - [ ] Test DisconnectBanner shows grace period countdown correctly
    - [ ] Test TimerDisplay shows "TIMER_PAUSED" when paused prop is true
- [ ] Task: Implement disconnect banner
    - [ ] Create `DisconnectBanner` component with retro terminal aesthetic
    - [ ] Show "ENEMY_DISCONNECTED — Grace: X:XX" when opponent is disconnected (with pulsing red border)
    - [ ] Show "CONNECTION_LOST — Attempting reconnection..." on own disconnect detection
    - [ ] Show "ENEMY_RECONNECTED" brief notification (auto-dismiss after 3s) on opponent reconnect
- [ ] Task: Implement grace period countdown
    - [ ] Display remaining grace period time in sidebar
    - [ ] Styling: >=60s normal (white), <60s yellow warning, <30s red pulsing
- [ ] Task: Pause timer display during disconnect
    - [ ] Add `paused` prop to `TimerDisplay.tsx`
    - [ ] When paused, stop counting and show "TIMER_PAUSED" with pulsing animation
- [ ] Task: Wire connection status into App.tsx
    - [ ] Add `getConnectionStatus` query to App.tsx
    - [ ] Pass connection status (p1Status, p2Status, disconnectStartTime) to UI components
    - [ ] Update TurnIndicator to show opponent connection status alongside typing indicator
- [ ] Task: Conductor - User Manual Verification 'Disconnect & Reconnection UI' (Protocol in workflow.md)

## Phase 6: Integration & Verification

- [ ] Task: Run complete test suite and fix any failures
    - [ ] Execute: `bun run type-check && bun run lint && bun run build && bun test`
    - [ ] Fix any type, lint, or test failures
- [ ] Task: Verify coverage meets threshold (>80%)
    - [ ] Run `bun test --coverage` and check new code coverage
- [ ] Task: Conductor - User Manual Verification 'Integration & Verification' (Protocol in workflow.md)
