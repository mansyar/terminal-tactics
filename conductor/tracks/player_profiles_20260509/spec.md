# Track: Player Profiles & Match History

## Overview

Give players a persistent identity beyond their anonymous `user_xxxx` ID, track their win/loss/draw record, and let them review past games. This phase implements player handles, stats tracking, match history, and a rematch button. No ranked mode, no ELO, no leaderboards.

## Architecture Decisions

- **Players Table:** Dedicated `players` Convex table keyed by `userId` (the existing `user_xxxx` ID from localStorage). Handle is stored here and must be unique — enforced via index and server-side validation.
- **Matches Table:** Separate `matches` Convex table recording each finished game's metadata for querying match history without loading the full `games` document.
- **Stats Recording Hook:** Win/loss/draw counters and match history records are inserted at every game-finish path — combat elimination, forfeit, draw acceptance, draft timeout, turn timeout, and disconnect grace period expiry.
- **Handle Display:** Handles shown in the LobbyScreen component and the TurnIndicator sidebar. The existing "Operative_ID" panel is updated to show the handle instead of the raw userId.
- **History CLI Output:** Formatted ASCII table printed to the terminal console, keeping the retro hacker aesthetic.
- **Stats Panel Location:** Visible only in the lobby screen, not in-game sidebar.

## Functional Requirements

### 10.1 Player Identity

- **`players` Table:** Create Convex `players` table with fields: `userId` (string, unique), `handle` (string, unique), `gamesPlayed` (number), `wins` (number), `losses` (number), `draws` (number).
- **Auto-Handle:** On first visit (when `getOrSetUserId` creates a new ID), auto-generate a `players` document with handle `user_xxxx` matching the existing pattern. This runs when the LobbyScreen mounts and no player document exists yet.
- **`handle <name>` CLI Command:** Add a new CLI command to set/change a player's display name. Validate: name must be 2-20 characters, alphanumeric + underscores only, must be unique. On success, update the `players` document. On failure, return descriptive error (`HANDLE_TOO_SHORT`, `HANDLE_TOO_LONG`, `HANDLE_INVALID_CHARS`, `HANDLE_TAKEN`).
- **In-Game Display:** Show player handles in the lobby (replacing raw `userId` display) and in the TurnIndicator sidebar. The Operative_ID panel shows the handle. TurnIndicator shows "WAITING_FOR [handle]" instead of "WAITING_FOR_ENEMY".

### 10.2 Stats Tracking

- **Win/Loss/Draw Recording:** Every time a game transitions to `status: "finished"`, increment the appropriate counters on both players' `players` documents. This applies to all 6 game-finish paths (elimination, forfeit, draw, draft timeout, turn timeout, disconnect grace period).
- **Method of Victory:** Record the method of victory (`elimination`, `forfeit`, `disconnect`, `timeout`, `draw`) — stored in the `matches` table as `endReason`.
- **Post-Game Screen:** Enhance the existing MISSION_COMPLETE/MISSION_FAILED screen to show final stats:
  - Your record (W/L/D)
  - Opponent's record (W/L/D)
  - Game duration
  - Turns played
  - Method of victory

### 10.3 Match History

- **`matches` Table:** Create Convex `matches` table with fields: `gameId` (id of games), `p1Id`, `p2Id` (strings), `p1Handle`, `p2Handle` (strings — snapshot of handle at game end), `winner` (optional string — `"p1"`, `"p2"`, or undefined for draw), `endReason` (string — `"elimination"`, `"forfeit"`, `"disconnect"`, `"timeout"`, `"draw"`), `turns` (number), `duration` (number — ms), `finishedAt` (number — timestamp).
- **`history` CLI Command:** Add a new CLI command that queries the `matches` table for the last 20 games involving the current player. Output is a formatted ASCII table in the terminal:
  ```
  ┌──────┬──────────┬──────────┬──────────┬──────────┐
  │ #    │ Opponent │ Result   │ Turns    │ Duration │
  ├──────┼──────────┼──────────┼──────────┼──────────┤
  │ 1    │ player42 │ WIN      │ 12       │ 8m 32s   │
  │ 2    │ hacker99 │ LOSS     │ 8        │ 5m 15s   │
  └──────┴──────────┴──────────┴──────────┴──────────┘
  ```
- **Profile View:** Add a stats panel to the LobbyScreen showing: your handle, W/L/D record, and last 5 match results (compact format).

### 10.4 Quick Wins

- **Rematch Button:** Add a "REMATCH" button to the post-game (finished) screen. Clicking it creates a new private lobby with the same opponent, generates a new lobby code, and navigates both players to the lobby. Implementation: use existing `createLobby` mutation with `isPublic: false`, but auto-fill the opponent's ID so they are matched immediately when they also click rematch or see the new lobby code.

## Non-Functional Requirements

- Handle uniqueness enforced at the database level (index) and application level (validation before insert/update).
- Match history queries limited to last 20 entries for performance.
- Post-game stats snapshot handles at game-end time so historical records remain accurate even if a player changes their handle later.

## Acceptance Criteria

1. First-time visitor gets auto-generated handle `user_xxxx` and a `players` document is created.
2. `/handle newname` sets the handle, validates uniqueness, and returns success/error.
3. Lobby screen shows player handles instead of raw IDs.
4. TurnIndicator shows player handles.
5. Win/loss/draw counters update correctly after every finished game (all 6 paths).
6. Post-game screen shows both players' records and game duration.
7. `history` CLI command shows last 20 games as an ASCII table.
8. Rematch button creates a new lobby with the same opponent.
9. All 260+ existing tests still pass. New tests cover: handle command validation, history query logic, stats recording, and post-game screen data.

## Out of Scope

- Leaderboards or rankings
- ELO or skill rating
- Profile avatars or customization beyond handle
- Social features (friends list, blocking)
- Match history filtering or search
- Spectator mode linking from match history
