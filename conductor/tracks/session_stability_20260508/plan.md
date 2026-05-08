# Implementation Plan: Session Stability

## Phase 1: Schema & Backend Foundation

- [ ] Task: Update Convex schema with presence fields
    - [ ] Add `p1LastHeartbeat`, `p2LastHeartbeat` (optional `number` — timestamp) to `games` table
    - [ ] Add `p1Status`, `p2Status` (optional `string` — "connected" | "disconnected" | "reconnecting") to `games` table
    - [ ] Add `disconnectStartTime` (optional `number` — timestamp) to `games` table
    - [ ] Run `bunx convex codegen` to regenerate types
- [ ] Task: Conductor - User Manual Verification 'Schema & Backend Foundation' (Protocol in workflow.md)

## Phase 2: Heartbeat & Disconnect Detection (Backend)

- [ ] Task: Write tests for heartbeat and disconnect detection
    - [ ] Test that heartbeat mutation updates lastHeartbeat timestamp
    - [ ] Test that a player is marked disconnected after 30s of no heartbeat
    - [ ] Test that heartbeat fails for non-existent game
    - [ ] Test that heartbeat fails for non-participant player
- [ ] Task: Implement heartbeat mutation
    - [ ] Create `convex/presence.ts` with `heartbeat` mutation
    - [ ] Validate gameId exists and player is a participant
    - [ ] Update player's `lastHeartbeat` timestamp and set status to "connected"
- [ ] Task: Implement disconnect detection
    - [ ] Create `checkDisconnect` mutation that checks both players' lastHeartbeat vs Date.now()
    - [ ] If no heartbeat for 30s, mark player as "disconnected" and set `disconnectStartTime`
    - [ ] Create `getConnectionStatus` query returning both players' status
    - [ ] Wire into existing timer polling in `useGameCommands.ts`
- [ ] Task: Conductor - User Manual Verification 'Heartbeat & Disconnect Detection (Backend)' (Protocol in workflow.md)

## Phase 3: Grace Period & Auto-Forfeit (Backend)

- [ ] Task: Write tests for grace period and auto-forfeit
    - [ ] Test that auto-forfeit triggers after 2-minute grace period expiry
    - [ ] Test that reconnection resets status before grace expiry cancels forfeit
    - [ ] Test that connected player cannot be auto-forfeited
    - [ ] Test that turn timer does not advance during opponent disconnect
- [ ] Task: Implement grace period logic
    - [ ] Modify `convex/timers.ts` to add `checkDisconnectGracePeriod` check
    - [ ] If `disconnectStartTime` is set and `Date.now() - disconnectStartTime > 120000ms`, auto-forfeit
    - [ ] Expose `getRemainingGraceTime` query for UI
- [ ] Task: Implement timer pause on disconnect
    - [ ] Modify `checkTurnTimeout` to skip turn advance when opponent is disconnected
    - [ ] Modify `endTurn` to validate opponent is connected before advancing
- [ ] Task: Modify game start to initialize presence
    - [ ] In `convex/squadBuilder.ts` (`startGame`), initialize `p1Status`/`p2Status` as "connected" and set `lastHeartbeat` timestamps
- [ ] Task: Wire grace period polling into client
    - [ ] Add grace period check to the polling interval in `useGameCommands.ts`
    - [ ] Add `checkDisconnectGracePeriod` mutation call in the same polling loop
- [ ] Task: Conductor - User Manual Verification 'Grace Period & Auto-Forfeit (Backend)' (Protocol in workflow.md)

## Phase 4: Client-Side Heartbeat Hook

- [ ] Task: Write tests for useHeartbeat hook
    - [ ] Test that heartbeat fires every 10s while game is active
    - [ ] Test that heartbeat stops when component unmounts
    - [ ] Test that heartbeat pauses on tab hide (Page Visibility API)
    - [ ] Test that heartbeat resumes on tab show
- [ ] Task: Implement useHeartbeat hook
    - [ ] Create `src/hooks/useHeartbeat.ts` with `setInterval` at 10s
    - [ ] Integrate Page Visibility API (pause on hidden, send immediate on visible)
    - [ ] Clean up interval on unmount
- [ ] Task: Integrate heartbeat into App.tsx
    - [ ] Mount `useHeartbeat(gameId, playerId)` when game is active
- [ ] Task: Conductor - User Manual Verification 'Client-Side Heartbeat Hook' (Protocol in workflow.md)

## Phase 5: Disconnect & Reconnection UI

- [ ] Task: Write tests for disconnect/reconnect UI components
    - [ ] Test that "ENEMY_DISCONNECTED" banner renders when opponent status is "disconnected"
    - [ ] Test that grace period countdown displays correctly
    - [ ] Test that timer display shows "PAUSED" during opponent disconnect
- [ ] Task: Implement disconnect banner
    - [ ] Create `DisconnectBanner` component showing "ENEMY_DISCONNECTED — Reconnecting in X:XX..."
    - [ ] Show "CONNECTION_LOST — Attempting reconnection..." on own disconnect
    - [ ] Show "ENEMY_RECONNECTED" brief notification on reconnect
- [ ] Task: Implement grace period countdown
    - [ ] Display remaining grace period time in sidebar
    - [ ] Different styling for >=60s (white) vs <60s (yellow) vs <30s (red)
- [ ] Task: Pause timer display during disconnect
    - [ ] Add `paused` prop to `TimerDisplay.tsx`
    - [ ] Show "TIMER_PAUSED" with pulsing animation when paused
- [ ] Task: Wire connection status into game state
    - [ ] Use `getConnectionStatus` query in `useGameDerivedState.ts`
    - [ ] Pass connection status to UI components
- [ ] Task: Conductor - User Manual Verification 'Disconnect & Reconnection UI' (Protocol in workflow.md)

## Phase 6: Multi-Tab Prevention & Session Persistence

- [ ] Task: Write tests for multi-tab detection and tab visibility
    - [ ] Test BroadcastChannel message sending/receiving for tab coordination
    - [ ] Test that second tab shows warning and prevents game interaction
    - [ ] Test that tab hide/show correctly pauses/resumes heartbeat
- [ ] Task: Implement BroadcastChannel tab coordination
    - [ ] Create `TabCoordinator` utility using BroadcastChannel API
    - [ ] On mount, send "tab-joined" message with gameId
    - [ ] On receiving "tab-joined" for same game, warn user and render blocking overlay
    - [ ] On tab close (beforeunload), send "tab-left" message
- [ ] Task: Implement graceful page refresh
    - [ ] Use `activeGameId` from localStorage to detect returning player
    - [ ] On mount, if activeGameId exists, re-query game state and resume heartbeat
    - [ ] Show "RECONNECTING..." overlay during reconnection
- [ ] Task: Handle edge cases
    - [ ] Handle opponent reconnect mid-grace-period (clear grace timer, resume turn timer)
    - [ ] Handle both players disconnected simultaneously
    - [ ] Handle rapid connect/disconnect cycles
    - [ ] Handle tab close while disconnected (no state corruption)
- [ ] Task: Conductor - User Manual Verification 'Multi-Tab Prevention & Session Persistence' (Protocol in workflow.md)

## Phase 7: Integration & Verification

- [ ] Task: Run complete test suite and fix any failures
    - [ ] Execute: `bun run type-check && bun run lint && bun run build && bun test`
    - [ ] Fix any type, lint, or test failures
- [ ] Task: Verify coverage meets threshold (>80%)
    - [ ] Run `bun test --coverage` and check new code coverage
- [ ] Task: Conductor - User Manual Verification 'Integration & Verification' (Protocol in workflow.md)
