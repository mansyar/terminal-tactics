# Implementation Plan: Player Profiles & Match History

## Phase A: Schema & Players Table (Backend) [checkpoint: b4f749d]

- [x] Task: Update games schema and create new tables (1e2460d)
    - [x] Add `gameStartTime` (optional number) to `games` table in `convex/schema.ts`
    - [x] Add `players` table to schema: `userId` (string, unique), `handle` (string, unique), `gamesPlayed` (number), `wins` (number), `losses` (number), `draws` (number)
    - [x] Add `matches` table to schema: `gameId` (id of games), `p1Id` (string), `p2Id` (string), `p1Handle` (string), `p2Handle` (string), `winner` (optional string), `endReason` (string), `turns` (number), `duration` (number), `finishedAt` (number)
    - [x] Add indexes: `players` by `userId` (unique), `players` by `handle` (unique), `matches` by `p1Id`, `matches` by `p2Id`
    - [x] Run `bunx convex codegen` to regenerate types
- [x] Task: Write tests for players CRUD operations (7a60bff)
    - [x] Create `convex/players.test.ts` following existing patterns
    - [x] Test `getOrCreatePlayer` handler: creates new player doc with auto-handle `user_xxxx`
    - [x] Test `getOrCreatePlayer` handler: returns existing player doc on repeat calls (idempotent)
    - [x] Test `setHandle` handler: validates 2-20 char length (rejects too short / too long)
    - [x] Test `setHandle` handler: validates alphanumeric + underscore only (rejects special chars)
    - [x] Test `setHandle` handler: rejects duplicate handles with `HANDLE_TAKEN`
    - [x] Test `setHandle` handler: successfully updates handle
    - [x] Test `getPlayerByUserId` query: returns correct player
    - [x] Test `getPlayersByUserIds` query: returns map of userId → player for batch lookup
- [x] Task: Implement players CRUD mutations and queries (7a60bff)
    - [x] Create `convex/players.ts` with `getOrCreatePlayerHandler` (standalone, exported for testing)
    - [x] Implement `getOrCreatePlayer`: check if player doc exists by userId, if not create with auto-handle `user_xxxx`
    - [x] Implement `setHandleHandler`: validate length (2-20), chars (alphanumeric + `_`), uniqueness (query `by_handle` index), then update
    - [x] Create `getPlayerByUserId` query
    - [x] Create `getPlayersByUserIds` query (batch fetch, returns Map<userId, playerDoc> — used for lobby display of both players)
    - [x] Create `getOrCreatePlayer` mutation wrapper
    - [x] Create `setHandle` mutation wrapper
- [x] Task: Set `gameStartTime` on game start (1e2460d)
    - [x] In `convex/squadBuilder.ts` `startGame()`: add `gameStartTime: Date.now()` to the patch that transitions game to `status: 'playing'`
- [x] Task: Conductor - User Manual Verification 'Phase A: Schema & Players Table' (Protocol in workflow.md)

## Phase B: Stats Recording Hook (Backend)

- [x] Task: Write tests for game-finish stats recording (3462b6c)
    - [x] Extend `convex/players.test.ts` with stats tests
    - [x] Test `recordGameEnd` handler: increments winner's wins, loser's losses
    - [x] Test `recordGameEnd` handler: records draw correctly (no winner, both get +1 draws)
    - [x] Test `recordGameEnd` handler: inserts match record with correct fields
    - [x] Test `recordGameEnd` handler: snapshots handles at game-end time
    - [x] Test `recordGameEnd` handler: stores correct `endReason` for each path
    - [x] Test `recordGameEnd` handler: handles player docs not existing yet (auto-create)
    - [x] Test `getMatchHistory` query: returns last 20 matches for a player, sorted by finishedAt desc
    - [x] Test `getMatchHistory` query: does not return matches involving other players only
    - [x] Test `getPlayerStats` query: returns correct W/L/D summary
- [x] Task: Implement stats recording mutation (3462b6c)
    - [x] Add `recordGameEndHandler` to `convex/players.ts` (standalone, exported for testing)
    - [x] Handler signature: `(ctx, args: { gameId, p1Id, p2Id, winner (or null for draw), endReason, turns, duration })`
    - [x] Fetch or auto-create player docs for both players
    - [x] Update counters: winner gets +1 wins (or both get +1 draws), loser gets +1 losses, both get +1 gamesPlayed
    - [x] Insert match document with snapshot of current handles
    - [x] Create `recordGameEnd` mutation wrapper
    - [x] Create `getMatchHistory` query (last 20 by p1Id or p2Id, sorted by finishedAt desc)
    - [x] Create `getPlayerStats` query (returns `{ handle, wins, losses, draws, gamesPlayed }`)
- [x] Task: Integrate stats recording into all game-finish paths (with guard) (8f8cbdc)
    - [x] **combat.ts (elimination):** After setting `status='finished'` and `winner`, call `recordGameEnd` with `endReason='elimination'`.
    - [x] **gameEnd.ts (forfeit):** After setting `status='finished'`, call `recordGameEnd` with `endReason='forfeit'`.
    - [x] **gameEnd.ts (draw):** After setting `status='finished'`, call `recordGameEnd` with `endReason='draw'`.
    - [x] **timers.ts (turn timeout):** After setting `status='finished'`, call `recordGameEnd` with `endReason='timeout'`.
    - [x] **timers.ts (disconnect grace):** After setting `status='finished'`, call `recordGameEnd` with `endReason='disconnect'`.
    - [x] **timers.ts (draft timeout):** Guard with a check — only call `recordGameEnd` if game has at least one squad submitted. If both failed to submit, skip entirely.
- [ ] Task: Conductor - User Manual Verification 'Phase B: Stats Recording Hook' (Protocol in workflow.md)

## Phase C: Lobby Handle UI (Frontend)

- [x] Task: Wire up player identity at App mount (cdf8184)
    - [x] In `src/App.tsx`: on mount, call `getOrCreatePlayer` mutation to ensure player doc exists
    - [x] Query `getPlayerByUserId(playerId)` to get current handle
    - [x] Pass handle down to LobbyScreen, TurnIndicator, and the waiting-for-opponent screen via props or context (stubs ready for next tasks)
- [x] Task: Write tests for lobby handle widget (668ee7f)
    - [x] Test LobbyScreen shows current handle from props
    - [x] Test LobbyScreen shows [EDIT] button
    - [x] Test LobbyScreen shows handle input when [EDIT] is clicked
    - [x] Test LobbyScreen shows validation errors (too short, too long, bad chars)
    - [x] Test LobbyScreen cancels edit properly
    - [x] Test LobbyScreen returns to display mode after successful handle change
    - [x] Test LobbyScreen renders basic title
- [x] Task: Add handle display and edit UI to LobbyScreen (668ee7f)
    - [x] Add handle display section to LobbyScreen showing current handle
    - [x] Add inline "edit" UI (text input) with SET/CANCEL buttons
    - [x] Wire input to `setHandle` mutation with loading + error states
    - [x] Show validation errors inline (length, chars)
    - [x] Style consistently with terminal aesthetic
    - [x] Add instructional text: "Use /handle <name> in-game to change"
- [ ] Task: Conductor - User Manual Verification 'Phase C: Lobby Handle UI' (Protocol in workflow.md)

## Phase D: CLI Commands — handle & history

- [x] Task: Add handle and history to command parser (cb06881)
    - [x] Update `CommandType` union in `src/lib/commandParser.ts`: add `'handle'`, `'history'`
    - [x] Add parsing logic for `handle <name>` (single arg) and `history` (no args) to the `validTypes` array
    - [x] Write test in `src/lib/commandParser.test.ts` for both new commands
- [x] Task: Write tests for handle CLI command handler (eb55910)
    - [x] Test `handleCommand` calls `setHandle` mutation with correct args
    - [x] Test handle command captures and displays returned handle
    - [x] Test handle command displays error message on server rejection
- [ ] Task: Write tests for history CLI command handler
    - [ ] Test history command calls `getMatchHistory` query
    - [ ] Test history command formats output as ASCII table with correct columns
    - [ ] Test history command handles empty history gracefully (`NO_MATCHES_FOUND`)
    - [ ] Test history command truncates to 20 entries
- [x] Task: Implement handle command in useGameCommands (eb55910)
    - [x] Wire up `setHandle` mutation in `src/App.tsx` (add to useGameCommands mutations)
    - [x] Add `handle` case in `useGameCommands.handleCommand`: call `setHandle`, display result/error
    - [x] Result format: `HANDLE_SET: newname` or `ERROR: HANDLE_TAKEN`
- [ ] Task: Implement history command in useGameCommands
    - [ ] Wire up `getMatchHistory` query in `src/App.tsx`
    - [ ] Add `history` case in `useGameCommands.handleCommand`: call query, format ASCII table output
    - [ ] Handle empty history: `NO_MATCHES_FOUND`
    - [ ] Format: `# | OPPONENT | RESULT | TURNS | DURATION`
- [ ] Task: Conductor - User Manual Verification 'Phase D: CLI Commands' (Protocol in workflow.md)

## Phase E: UI Polish — TurnIndicator, Post-Game, Rematch

- [ ] Task: Write component tests for UI changes
    - [ ] Test TurnIndicator shows handle from props instead of "ENEMY"
    - [ ] Test waiting-for-opponent screen shows both handles when opponent joined
    - [ ] Test post-game screen shows both players' stats
    - [ ] Test post-game screen shows game duration and turns played
    - [ ] Test post-game screen rematch button calls createLobby mutation
    - [ ] Test "REMATCH_AVAILABLE" appears on P2's screen after P1 clicks rematch
- [ ] Task: Update TurnIndicator with player handles
    - [ ] Add `p1Handle` and `p2Handle` props to TurnIndicator (plus `currentPlayerId` or `myPlayerKey` to distinguish self from opponent)
    - [ ] Show `WAITING_FOR [enemyHandle]` instead of hardcoded `WAITING_FOR_ENEMY`
    - [ ] Update Operative_ID panel in App.tsx sidebar to show `handle` instead of raw `playerId`
- [ ] Task: Update waiting-for-opponent screen with handles
    - [ ] In `src/App.tsx` waiting screen (`gameState.status === 'lobby'`): show P1's handle
    - [ ] Once opponent joins but game hasn't started, show both handles
    - [ ] Use `getPlayersByUserIds` to batch-fetch both players' handles
- [ ] Task: Enhance post-game screen with stats and rematch
    - [ ] Query both players' stats via `getPlayerStats`
    - [ ] Display your record (W/L/D) and opponent's record on the finished screen
    - [ ] Show game duration (format as `Xm Ys`) and turns played
    - [ ] Show method of victory label: "ELIMINATION_VICTORY", "FORFEIT_VICTORY", "DRAW", "TIMEOUT_VICTORY", "DISCONNECT_VICTORY"
    - [ ] Add "REMATCH" button alongside existing "RETURN_TO_BASE"
    - [ ] Style rematch button matching existing button aesthetic
    - [ ] Add `rematchCode` / `rematchLobbyId` fields to `games` schema (optional string/id)
- [ ] Task: Implement rematch backend protocol
    - [ ] Create `convex/rematch.ts` mutation `initiateRematch`:
      - Takes `gameId`, `playerId`
      - Validates it's this player's game and game is finished
      - Creates new private lobby via `createLobby` (reuse `createLobbyHandler`)
      - Patches finished game with `{ rematchCode, rematchLobbyId }`
      - Returns `{ gameId, code }`
    - [ ] Create `getRematchInfo` query: returns `{ rematchCode, rematchLobbyId }` if set
    - [ ] In `src/App.tsx`: if `gameState.status === 'finished'`, query `getRematchInfo`
    - [ ] On P1 click "REMATCH": call `initiateRematch`, show "AWAITING_OPPONENT..." + lobby code
    - [ ] On P2's screen: `getRematchInfo` returns non-null → show "REMATCH_AVAILABLE v2.0 — CODE: XXXX — CLICK TO JOIN"
    - [ ] On P2 click "ACCEPT": call `joinLobby` with `rematchCode`, navigate to lobby
    - [ ] When either player joins the new lobby or navigates away, clear `rematchCode`/`rematchLobbyId` from the finished game
- [ ] Task: Conductor - User Manual Verification 'Phase E: UI Polish' (Protocol in workflow.md)
