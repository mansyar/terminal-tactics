# Track: Session Stability (session_stability_20260508)

## Overview

Implement robust session management and disconnect handling for Terminal Tactics. This track adds a heartbeat-based presence system, a 2-minute grace period for disconnected players, seamless reconnection, tab visibility handling, multi-tab prevention, and graceful refresh support. The current game has no disconnect handling whatsoever — if a player closes their tab or loses connection, the game is effectively broken for both players.

## Architecture Decisions

- **Presence Storage:** Fields will be added directly to the `games` table (`p1LastHeartbeat`, `p2LastHeartbeat`, `p1Status`, `p2Status`, `disconnectStartTime`) to keep queries simple.
- **Reconnection:** Full state resend via existing `getGameState` query — no special reconnect mutation needed.
- **Multi-Tab Prevention:** BroadcastChannel API for tab-to-tab communication.
- **Timer Pause:** Turn timer pauses immediately on opponent disconnect; grace period timer runs independently.

## Functional Requirements

### 8.1 Disconnect Detection

- **Heartbeat System:** Client sends a heartbeat mutation every 10 seconds while a game is active.
- **Presence Tracking:** Server maintains `lastHeartbeat` timestamps per player on the `games` document.
- **Disconnect Detection:** Server marks a player as "disconnected" if no heartbeat received for 30 seconds.
- **UI Indicator:** Show "ENEMY_DISCONNECTED" warning banner in the game UI when opponent is disconnected.

### 8.2 Grace Period & Recovery

- **Grace Period:** 2-minute reconnection window after disconnection is detected.
- **Timer Pause:** Turn timer pauses for the disconnected player's opponent during the grace period.
- **State Preservation:** Game state remains frozen during grace period — no mutations allowed from the disconnected player.
- **Reconnection Flow:** On page reload or tab reopening, the client re-queries full game state via `getGameState` and resumes normal heartbeat and interaction.
- **Auto-Forfeit:** If the grace period expires, the disconnected player is automatically forfeited.

### 8.3 Session Persistence Improvements

- **Browser Tab Handling:** Use Page Visibility API to pause heartbeat when tab is hidden, and send immediate heartbeat on tab re-show.
- **Multi-Tab Prevention:** Use BroadcastChannel API to detect duplicate game sessions. Warn or block a second tab from opening the same game.
- **Graceful Refresh:** Maintain session state through page refresh — `activeGameId` in localStorage already persists, but reconnection must be seamless.

## Non-Functional Requirements

- **Performance:** Heartbeat is a lightweight mutation (single field update). No impact on game performance.
- **Reliability:** Heartbeat interval (10s) + detection threshold (30s) gives 3 missed heartbeats before disconnect, preventing false positives from brief network hiccups.
- **Security:** A disconnected player cannot make game-altering mutations. The reconnect flow validates the player still belongs to the game.

## Acceptance Criteria

1. A heartbeat mutation exists and succeeds.
2. Players are marked disconnected after 30s of inactivity.
3. A 2-minute grace period countdown is visible to both players.
4. Turn timer pauses during opponent disconnection.
5. Reconnecting player sees full game state and can resume playing.
6. If grace period expires, the disconnected player forfeits automatically.
7. Multiple tabs with the same game are detected and warned.
8. Tab hide/show pauses/resumes heartbeat appropriately.
9. Page refresh preserves game session and reconnects seamlessly.
10. All tests pass: `bun run type-check && bun run lint && bun run build && bun test`

## Out of Scope

- Spectator mode (Phase 12)
- Replay recording (Phase 12)
- AI opponent (Phase 12)
- Mobile-specific touch/gesture handling (Phase 9)
