# Track: Player Profiles & Match History

## Overview

Give players a persistent identity beyond their anonymous `user_xxxx` ID, track their win/loss/draw record, and let them review past games. This phase implements player handles, stats tracking, match history, and a rematch button. No ranked mode, no ELO, no leaderboards.

## Architecture Decisions

- **Players Table:** Dedicated `players` Convex table keyed by `userId` (the existing `user_xxxx` ID from localStorage). Handle is stored here and must be unique — enforced via index and server-side validation.
- **Matches Table:** Separate `matches` Convex table recording each finished game's metadata for querying match history without loading the full `games` document.
- **`gameStartTime` Field:** Added to the `games` table, set when the game transitions from `drafting` → `playing` (in `startGame()`). This enables accurate duration calculation (`finishedAt - gameStartTime`) in match history.
- **Stats Recording Hook:** Win/loss/draw counters and match history records are inserted at every game-finish path. **Exception:** Games that ended during `drafting` (both players failed to submit squads) do NOT record stats, since no game was actually played.
- **Handle Setting:** Primary mechanism is a text input in the `LobbyScreen` component. The `handle <name>` CLI command is a secondary mechanism for changing handles during gameplay.
- **Rematch Protocol:** P1 clicks "REMATCH" → backend creates a new private lobby → stores the new lobby code in a `rematchCode` field on the finished game document → P2's query picks this up → P2 sees "REMATCH_AVAILABLE" and can accept to join.
- **Handle Display:** Handles shown in the lobby screen, the "waiting for opponent" screen, the TurnIndicator sidebar, and the post-game screen. The existing "Operative_ID" panel shows the handle instead of the raw userId.
- **History CLI Output:** Formatted ASCII table printed to the terminal console, keeping the retro hacker aesthetic.
- **Stats Panel Location:** Visible only in the lobby screen, not in-game sidebar.

## Functional Requirements

### 10.1 Player Identity

- **`players` Table:** Create Convex `players` table with fields: `userId` (string, unique), `handle` (string, unique), `gamesPlayed` (number), `wins` (number), `losses` (number), `draws` (number).
- **`gameStartTime` Field:** Add optional `gameStartTime` (number, timestamp) to the `games` table. Set in `startGame()` when transitioning from `drafting` → `playing`.
- **Auto-Handle:** On **App mount** (not LobbyScreen mount, since handles are needed everywhere), call `getOrCreatePlayer` to ensure a `players` document exists. Auto-generated handle matches the existing `user_xxxx` pattern from `getOrSetUserId()`.
- **Handle Setting (Lobby UI — Primary):** Add a handle display + edit text input to the `LobbyScreen` component. Validation: 2-20 characters, alphanumeric + underscores only, must be unique. Shows current handle, allows inline editing, provides validation feedback. On success, updates `players` document and UI immediately.
- **`handle <name>` CLI Command (Secondary):** Same validation logic available during gameplay. Result format: `HANDLE_SET: newname` or `ERROR: HANDLE_TAKEN` / `HANDLE_TOO_SHORT` / `HANDLE_INVALID_CHARS`.
- **In-Game Display:** Show player handles in the lobby (replacing raw `userId` display), the "Waiting for Opponent" screen (once opponent has joined/displays both handles), and the TurnIndicator sidebar. The Operative_ID panel shows the handle. TurnIndicator shows "WAITING_FOR [handle]" (replacing the current hardcoded "WAITING_FOR_ENEMY" string).

### 10.2 Stats Tracking

- **Win/Loss/Draw Recording:** Every time a game transitions to `status: "finished"`, increment the appropriate counters on both players' `players` documents. **Guard:** Only record stats for games that reached `status === "playing"`. Games cancelled during `drafting` (e.g., both players failed draft timeout) are excluded — they are not real matches.
- **Applies to:** 5 game-finish paths that reached "playing" status (elimination, forfeit, draw, turn timeout, disconnect grace period).
- **Excluded:** Draft timeout where game never reached "playing" status.
- **Method of Victory:** Record the method of victory (`elimination`, `forfeit`, `disconnect`, `timeout`, `draw`) — stored in the `matches` table as `endReason`.
- **Post-Game Screen:** Enhance the existing MISSION_COMPLETE/MISSION_FAILED screen to show final stats:
  - Your record (W/L/D)
  - Opponent's record (W/L/D)
  - Game duration (calculated as `finishedAt - gameStartTime`)
  - Turns played
  - Method of victory

### 10.3 Match History

- **`matches` Table:** Create Convex `matches` table with fields:
  - `gameId` (id of games), `p1Id`, `p2Id` (strings), `p1Handle`, `p2Handle` (strings — snapshot of handle at game end)
  - `winner` (optional string — `"p1"`, `"p2"`, or undefined for draw)
  - `endReason` (string — `"elimination"`, `"forfeit"`, `"disconnect"`, `"timeout"`, `"draw"`)
  - `turns` (number), `duration` (number — ms), `finishedAt` (number — timestamp)
- **`history` CLI Command:** Add a new CLI command that queries the `matches` table for the last 20 games involving the current player. Output is a formatted ASCII table in the terminal:
  ```
  ┌──────┬──────────┬──────────┬──────────┬──────────┐
  │ #    │ Opponent │ Result   │ Turns    │ Duration │
  ├──────┼──────────┼──────────┼──────────┼──────────┤
  │ 1    │ player42 │ WIN      │ 12       │ 8m 32s   │
  │ 2    │ hacker99 │ LOSS     │ 8        │ 5m 15s   │
  └──────┴──────────┴──────────┴──────────┴──────────┘
  ```
- **Profile View:** Add a stats panel to the LobbyScreen showing: your handle, W/L/D record, and last 5 match results (compact format). The opponent handle is already available in the `matches` document's `p1Handle`/`p2Handle` snapshot — no separate query needed.

### 10.4 Rematch

- **Rematch Button:** Add a "REMATCH" button to the post-game (finished) screen.
- **Protocol:**
  1. P1 clicks "REMATCH"
  2. Backend creates a new private lobby via `createLobby({ isPublic: false, p1: P1's userId })`
  3. Backend stores `{ rematchCode: <new lobby code>, rematchLobbyId: <new game ID> }` on the **finished game document**
  4. P2's `getGameState` query picks up the `rematchCode` field
  5. P2's UI shows: "REMATCH_AVAILABLE — CODE: XXXX — CLICK TO JOIN"
  6. P2 clicks → calls `joinLobby` with the code → both players enter drafting
  7. Clear `rematchCode` / `rematchLobbyId` from the finished game when either player joins or leaves

## Non-Functional Requirements

- Handle uniqueness enforced at the database level (index) and application level (validation before insert/update).
- Match history queries limited to last 20 entries for performance.
- Post-game stats snapshot handles at game-end time so historical records remain accurate even if a player changes their handle later.
- Games that never reached "playing" status (cancelled during draft) do NOT create match history entries.

## Acceptance Criteria

1. First-time visitor gets auto-generated handle `user_xxxx` and a `players` document is created on App mount.
2. Lobby screen shows current handle with an inline edit input to change it.
3. `/handle newname` CLI command validates uniqueness and length (2-20 chars, alphanumeric + underscores).
4. Lobby screen and "Waiting for Opponent" screen show player handles instead of raw IDs.
5. TurnIndicator shows "WAITING_FOR [handle]" instead of hardcoded "WAITING_FOR_ENEMY".
6. Win/loss/draw counters update correctly after every finished game (elimination, forfeit, draw, turn timeout, disconnect).
7. Draft timeout (both failed to submit) does NOT create a match record or increment counters.
8. Post-game screen shows both players' records, game duration, turns played, and method of victory.
9. `history` CLI command shows last 20 games as an ASCII table.
10. Rematch button creates a new lobby; P2 sees "REMATCH_AVAILABLE" and can join.
11. All 260+ existing tests still pass. New tests cover: handle CRUD, recordGameEnd for all 5 valid paths, draft timeout exclusion, history formatting, handle UI widget, rematch protocol.

## Out of Scope

- Leaderboards or rankings
- ELO or skill rating
- Profile avatars or customization beyond handle
- Social features (friends list, blocking)
- Match history filtering or search
- Spectator mode linking from match history
