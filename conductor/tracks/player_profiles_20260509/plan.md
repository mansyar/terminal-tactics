# Implementation Plan: Player Profiles & Match History

## Phase A: Schema & Players Table (Backend)

- [ ] Task: Create `players` and `matches` Convex tables
    - [ ] Add `players` table to schema with fields: `userId` (string, unique), `handle` (string, unique), `gamesPlayed` (number), `wins` (number), `losses` (number), `draws` (number)
    - [ ] Add `matches` table to schema with fields: `gameId` (id of games), `p1Id` (string), `p2Id` (string), `p1Handle` (string), `p2Handle` (string), `winner` (optional string), `endReason` (string), `turns` (number), `duration` (number), `finishedAt` (number)
    - [ ] Add indexes: `players` by `userId` (unique), `players` by `handle` (unique), `matches` by `p1Id`, `matches` by `p2Id`
    - [ ] Run `bunx convex codegen` to regenerate types
- [ ] Task: Write tests for players CRUD operations
    - [ ] Create `convex/players.test.ts` following existing patterns
    - [ ] Test `getOrCreatePlayer` handler: creates new player doc with auto-handle
    - [ ] Test `getOrCreatePlayer` handler: returns existing player doc on repeat calls
    - [ ] Test `setHandle` handler: validates 2-20 char length
    - [ ] Test `setHandle` handler: validates alphanumeric + underscore
    - [ ] Test `setHandle` handler: rejects duplicate handles with `HANDLE_TAKEN`
    - [ ] Test `setHandle` handler: successfully updates handle
    - [ ] Test `getPlayerByUserId` query: returns correct player
    - [ ] Test `getPlayerByHandle` query: returns correct player for uniqueness check
- [ ] Task: Implement players CRUD mutations and queries
    - [ ] Create `convex/players.ts` with `getOrCreatePlayer` mutation
    - [ ] Implement `getOrCreatePlayer`: check if player doc exists by userId, if not create with auto-handle `user_xxxx`
    - [ ] Implement `setHandle` mutation: validate length (2-20), chars (alphanumeric + `_`), uniqueness (check `by_handle` index), then update
    - [ ] Create `getPlayerByUserId` query
    - [ ] Create `getPlayerByHandle` query (for uniqueness check)
    - [ ] Create `getPlayersByUserIds` query (batch fetch for lobby display)
- [ ] Task: Conductor - User Manual Verification 'Phase A: Schema & Players Table' (Protocol in workflow.md)

## Phase B: Stats Recording Hook (Backend)

- [ ] Task: Write tests for game-finish stats recording
    - [ ] Create `convex/players.test.ts` — extend with stats tests
    - [ ] Test `recordGameEnd` handler: increments winner's wins, loser's losses
    - [ ] Test `recordGameEnd` handler: records draw correctly (no winner)
    - [ ] Test `recordGameEnd` handler: inserts match record with correct fields
    - [ ] Test `recordGameEnd` handler: snapshots handles at game-end time
    - [ ] Test `recordGameEnd` handler: stores correct `endReason` for each path
    - [ ] Test `recordGameEnd` handler: handles player docs not existing yet (auto-create)
    - [ ] Test `getMatchHistory` query: returns last 20 matches for a player
    - [ ] Test `getMatchHistory` query: does not return matches for other players
    - [ ] Test `getPlayerStats` query: returns correct W/L/D summary
- [ ] Task: Implement stats recording mutation
    - [ ] Create `convex/players.ts` — add `recordGameEndHandler` (standalone, exported for testing)
    - [ ] Handler takes: gameId, p1Id, p2Id, winner (or null for draw), endReason, turns, duration
    - [ ] Fetch or create player docs for both players
    - [ ] Update counters: winner gets +1 wins (or both get +1 draws), loser gets +1 losses, both get +1 gamesPlayed
    - [ ] Insert match document with snapshot of current handles
    - [ ] Create `recordGameEnd` mutation wrapper
    - [ ] Create `getMatchHistory` query (last 20 by p1Id or p2Id, sorted by finishedAt desc)
    - [ ] Create `getPlayerStats` query (returns { handle, wins, losses, draws, gamesPlayed })
    - [ ] Create `getMatchHistoryWithHandles` query (for lobby profile view — last 5 matches with opponent handle)
- [ ] Task: Integrate stats recording into all 6 game-finish paths
    - [ ] **combat.ts (elimination):** After setting status='finished' and winner, call `recordGameEnd` with endReason='elimination'
    - [ ] **gameEnd.ts (forfeit):** After setting status='finished', call `recordGameEnd` with endReason='forfeit'
    - [ ] **gameEnd.ts (draw):** After setting status='finished', call `recordGameEnd` with endReason='draw'
    - [ ] **timers.ts (draft timeout):** After setting status='finished', call `recordGameEnd` with endReason='timeout'
    - [ ] **timers.ts (turn timeout):** After setting status='finished', call `recordGameEnd` with endReason='timeout'
    - [ ] **timers.ts (disconnect grace):** After setting status='finished', call `recordGameEnd` with endReason='disconnect'
- [ ] Task: Conductor - User Manual Verification 'Phase B: Stats Recording Hook' (Protocol in workflow.md)

## Phase C: CLI Commands — handle & history

- [ ] Task: Add handle and history to command parser
    - [ ] Update `CommandType` union in `src/lib/commandParser.ts`: add `'handle'`, `'history'`
    - [ ] Add parsing logic for `handle <name>` (single arg) and `history` (no args)
    - [ ] Write test in `src/lib/commandParser.test.ts` for both new commands
- [ ] Task: Write tests for handle CLI command handler
    - [ ] Create or extend command handler tests
    - [ ] Test `handleCommand` calls setHandle mutation with correct args
    - [ ] Test handle command captures and displays returned handle
    - [ ] Test handle command displays error message on server rejection
- [ ] Task: Write tests for history CLI command handler
    - [ ] Test history command calls getMatchHistory query
    - [ ] Test history command formats output as ASCII table
    - [ ] Test history command handles empty history (no matches yet)
    - [ ] Test history command truncates to 20 entries
- [ ] Task: Implement handle command in useGameCommands
    - [ ] Wire up `setHandle` mutation in `src/App.tsx` (pass to useGameCommands mutations)
    - [ ] Add `handle` case in `useGameCommands.handleCommand`: call setHandle, display result/error
    - [ ] After successful handle change, update local state to refresh display
    - [ ] Result format: `HANDLE_SET: newname` or `ERROR: HANDLE_TAKEN`
- [ ] Task: Implement history command in useGameCommands
    - [ ] Wire up `getMatchHistory` query
    - [ ] Add `history` case in `useGameCommands.handleCommand`: call query, format ASCII table output
    - [ ] Handle empty history gracefully: `NO_MATCHES_FOUND`
    - [ ] Format example: `# | OPPONENT | RESULT | TURNS | DURATION`
- [ ] Task: Conductor - User Manual Verification 'Phase C: CLI Commands' (Protocol in workflow.md)

## Phase D: UI — Handles, Stats Panel, Rematch

- [ ] Task: Wire up player identity on lobby mount
    - [ ] In `src/App.tsx` or `LobbyScreen.tsx`: on lobby mount, call `getOrCreatePlayer` to ensure player doc exists
    - [ ] Query `getPlayerByUserId` to get current handle
    - [ ] Pass handle down to LobbyScreen and TurnIndicator
- [ ] Task: Update LobbyScreen with stats panel and handle display
    - [ ] Show handle in lobby header (replacing raw userId)
    - [ ] Add stats panel showing: handle, W/L/D record, last 5 match results
    - [ ] Style stats panel in terminal aesthetic (green on black, monospace)
    - [ ] Add `handle` command hint in lobby: "SET_HANDLE: /handle <name>"
- [ ] Task: Update TurnIndicator with player handles
    - [ ] Pass p1Handle and p2Handle props to TurnIndicator
    - [ ] Show "WAITING_FOR [handle]" instead of "WAITING_FOR_ENEMY"
    - [ ] Update Operative_ID panel to show handle instead of raw userId
- [ ] Task: Enhance post-game screen with stats and rematch
    - [ ] Query both players' stats via `getPlayerStats`
    - [ ] Display your record (W/L/D) and opponent's record on the finished screen
    - [ ] Show game duration and turns played
    - [ ] Show method of victory: e.g., "ELIMINATION_VICTORY" or "FORFEIT_VICTORY"
    - [ ] Add "REMATCH" button alongside existing "RETURN_TO_BASE"
    - [ ] Rematch implementation: call `createLobby` with `isPublic: false`, store new game code for opponent
    - [ ] Style rematch button matching existing button aesthetic
- [ ] Task: Write component tests for UI changes
    - [ ] Test LobbyScreen shows handle from props
    - [ ] Test LobbyScreen stats panel renders W/L/D
    - [ ] Test TurnIndicator shows handle instead of "ENEMY"
    - [ ] Test post-game screen shows both players' stats
    - [ ] Test post-game screen rematch button calls createLobby
- [ ] Task: Conductor - User Manual Verification 'Phase D: UI Changes' (Protocol in workflow.md)
