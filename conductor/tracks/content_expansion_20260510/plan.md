# Implementation Plan: Content Expansion (Phase 11)

## Phase A: Unit Templates & Schema Infrastructure

- [ ] Task: Update UNIT_TEMPLATES with 3 new unit classes
    - [ ] Add `E` (Engineer: cost 200, HP 60, AP 3, ATK 10, RNG 1, VIS 3) to `src/lib/unitTemplates.ts`
    - [ ] Add `R` (Sniper: cost 350, HP 40, AP 2, ATK 40, RNG 8, VIS 6) to `src/lib/unitTemplates.ts`
    - [ ] Add `C` (Commander: cost 400, HP 80, AP 2, ATK 20, RNG 2, VIS 4) to `src/lib/unitTemplates.ts`
    - [ ] Update `UnitType` type union in `combatSystem.ts` to include `'E' | 'R' | 'C'`
    - [ ] NOTE: `getScannedHostiles` needs no change — its filter `u.type !== 'S'` already correctly includes E, R, C in scan results
- [ ] Task: Write failing tests for UNIT_TEMPLATES update (Red Phase)
    - [ ] Test that all 3 new unit types exist in UNIT_TEMPLATES with correct stats
    - [ ] Test UnitType union accepts 'E', 'R', 'C'
- [ ] Task: Run tests to confirm failures (Red Phase verification)
- [ ] Task: Implement UNIT_TEMPLATES changes (Green Phase)
    - [ ] Add new templates to `unitTemplates.ts`
    - [ ] Update `UnitType` type in `combatSystem.ts`
    - [ ] Run tests to confirm passing
- [ ] Task: Update Convex schema for new fields
    - [ ] Add `mapPreset` (v.optional(v.string())) to `games` table in `convex/schema.ts`
    - [ ] Add `engineerWallCount` (v.optional(v.number())) to `units` table — tracks remaining `build` uses
    - [ ] Add `sniperMovedThisTurn` (v.optional(v.boolean())) to `units` table
    - [ ] NOTE: `rallyBuff` field is NOT needed — rally directly increments `ap` by 1; the existing turn-end AP reset (`ap = unit.maxAp`) auto-cleans the bonus
    - [ ] Run `bunx convex codegen` to regenerate types
    - [ ] Write tests for schema field access
- [ ] Task: Verify coverage and commit
    - [ ] Run `bun run type-check; bun run lint; bun test --coverage`
    - [ ] Commit with message: `feat(units): Add Engineer, Sniper, Commander unit templates and schema fields`
    - [ ] Attach git note with task summary
- [ ] NOTE: The Squad Builder (`SquadBuilder.tsx`) iterates over `Object.entries(UNIT_TEMPLATES)` — new unit types automatically appear. No Squad Builder UI code changes needed.
- [ ] Task: Conductor - User Manual Verification 'Phase A: Unit Templates & Schema' (Protocol in workflow.md)

## Phase B: Engineer Abilities (build & demolish)

- [ ] Task: Add `build` and `demolish` commands to command parser
    - [ ] Update `CommandType` union in `commandParser.ts` with `'build' | 'demolish'`
    - [ ] Add parsing logic for both commands
- [ ] Task: Write failing tests for build/demolish commands (Red Phase)
    - [ ] Test `build` with valid adjacent floor coordinate → success
    - [ ] Test `build` on non-adjacent tile → error
    - [ ] Test `build` on existing wall → error
    - [ ] Test `build` on occupied tile → error
    - [ ] Test `demolish` on adjacent wall → success
    - [ ] Test `demolish` on non-wall tile → error
    - [ ] Test `demolish` on non-adjacent tile → error
    - [ ] Test `build` fails when Engineer has already used its 1 build (engineerWallCount = 0)
    - [ ] Test `build` succeeds if demolished first (reusable)
    - [ ] Test non-Engineer units cannot use build/demolish
- [ ] Task: Run tests to confirm failures (Red Phase verification)
- [ ] Task: Implement Engineer build/demolish logic (Green Phase)
    - [ ] Create `convex/engineer.ts` with `buildWallHandler` and `demolishWallHandler` mutations
    - [ ] Implement validation: unit type check (Engineer only), adjacency check, terrain check
    - [ ] Implement build: set target tile to 'wall' in mapData, decrement engineerWallCount
    - [ ] Implement demolish: set target tile to 'floor' in mapData
    - [ ] Update `convex/squadBuilder.ts` `startGame()`: add `engineerWallCount: type === 'E' ? 1 : undefined` to unit insert
    - [ ] Add `buildWall` and `demolishWall` to `GameMutations` interface in `src/hooks/useGameCommands.ts`
    - [ ] Add `build` and `demolish` cases to `handleCommand` in `useGameCommands.ts` (call mutations, handle error responses)
    - [ ] Wire `api.engineer.buildWall` and `api.engineer.demolishWall` mutations in `src/App.tsx`
    - [ ] Run tests to confirm passing
- [ ] Task: Verify coverage and commit
    - [ ] Run `bun run type-check; bun run lint; bun test --coverage`
    - [ ] Commit with message: `feat(engineer): Implement build and demolish abilities`
    - [ ] Attach git note with task summary
- [ ] Task: Conductor - User Manual Verification 'Phase B: Engineer Abilities' (Protocol in workflow.md)

## Phase C: Sniper Stationary Attack Rule

- [ ] Task: Write failing tests for Sniper stationary rule (Red Phase)
    - [ ] Test Sniper attacks normally when not moved this turn
    - [ ] Test Sniper attack is rejected with `SNIPER_MOVED_THIS_TURN` when moved this turn
    - [ ] Test `sniperMovedThisTurn` flag clears at start of next turn
    - [ ] Test `atk` succeeds after mv on previous turn (flag resets between turns)
    - [ ] Test `sudo mv` also sets sniperMovedThisTurn flag
- [ ] Task: Run tests to confirm failures (Red Phase verification)
- [ ] Task: Implement Sniper movement tracking logic (Green Phase)
    - [ ] **SET flag** — In `convex/movement.ts` `moveUnit` mutation, add `sniperMovedThisTurn: true` to the unit patch when `unit.type === 'R'`
    - [ ] **SET flag (sudo)** — In `convex/sudo.ts` `sudoMove`, add the same `sniperMovedThisTurn: true` for Sniper units
    - [ ] **CHECK flag** — In `convex/combat.ts` `attackUnit` mutation, before damage calculation: if `attacker.type === 'R'` and `attacker.sniperMovedThisTurn`, reject with `SNIPER_MOVED_THIS_TURN`
    - [ ] **CLEAR flag** — In `convex/game.ts` `endTurn` mutation, clear `sniperMovedThisTurn: undefined` for all units at turn start (alongside AP reset)
    - [ ] **Client-side** — No extra wiring needed; existing `atk` error handling in `useGameCommands.ts` (try/catch) will display the server error
    - [ ] Run tests to confirm passing
- [ ] Task: Verify coverage and commit
    - [ ] Run `bun run type-check; bun run lint; bun test --coverage`
    - [ ] Commit with message: `feat(sniper): Implement stationary attack restriction`
    - [ ] Attach git note with task summary
- [ ] Task: Conductor - User Manual Verification 'Phase C: Sniper Stationary Rule' (Protocol in workflow.md)

## Phase D: Commander Rally Ability

- [ ] Task: Add `rally` command to command parser
    - [ ] Update `CommandType` union in `commandParser.ts` with `'rally'`
    - [ ] Add parsing logic for `rally [coord]`
- [ ] Task: Write failing tests for rally command (Red Phase)
    - [ ] Test `rally` on adjacent friendly unit → unit gains +1 AP
    - [ ] Test `rally` self-target (Commander on own tile) → Commander gains +1 AP
    - [ ] Test `rally` on non-adjacent unit → error
    - [ ] Test `rally` on enemy unit → error
    - [ ] Test non-Commander units cannot use rally
    - [ ] Test rally AP buff is consumed/lost at turn end
- [ ] Task: Run tests to confirm failures (Red Phase verification)
- [ ] Task: Implement Commander rally logic (Green Phase)
    - [ ] Create `convex/commander.ts` with `rallyHandler` mutation
    - [ ] Implement validation: unit type check (Commander only), adjacency check, friendly check
    - [ ] Implement rally: **directly increment `target.ap += 1`** — no special `rallyBuff` field needed
    - [ ] Cleanup is automatic — `endTurn` resets all AP to `maxAp`, consuming any rally bonus
    - [ ] Add `useRally` to `GameMutations` interface in `src/hooks/useGameCommands.ts`
    - [ ] Add `rally` case to `handleCommand` in `useGameCommands.ts` (parse coord, find units, call mutation)
    - [ ] Wire `api.commander.useRally` mutation in `src/App.tsx`
    - [ ] Run tests to confirm passing
- [ ] Task: Verify coverage and commit
    - [ ] Run `bun run type-check; bun run lint; bun test --coverage`
    - [ ] Commit with message: `feat(commander): Implement rally ability granting +1 AP`
    - [ ] Attach git note with task summary
- [ ] Task: Conductor - User Manual Verification 'Phase D: Commander Rally' (Protocol in workflow.md)

## Phase E: Map Preset Definitions & Selection

- [ ] Task: Create preset map data file
    - [ ] Create `src/lib/mapPresets.ts` with `PresetMap` interface
    - [ ] Define "The Grid" — symmetrical 12×12 layout with open center, walls on edges, scattered high ground
    - [ ] Define "The Maze" — tight corridors, frequent wall cover, multiple flanking routes
    - [ ] Define "The Ridge" — elevated center ridge, high ground tiles across midline
    - [ ] Export a `PRESET_MAPS` record keyed by preset name
- [ ] Task: Write failing tests for preset maps (Red Phase)
    - [ ] Test all 3 presets are valid 12×12 grids
    - [ ] Test all tiles are valid TileType values (floor/wall/highground)
    - [ ] Test spawn zones (rows 0,1 and 10,11) are clear for all presets
    - [ ] Test each preset has unique layout (not identical)
- [ ] Task: Run tests to confirm failures (Red Phase verification)
- [ ] Task: Implement preset map selection in lobby
    - [ ] Create `convex/mapSelection.ts` with `selectMapPreset` mutation
    - [ ] Add map preset selector to Lobby UI (radio buttons or dropdown)
    - [ ] Update `submitSquad` to use selected preset mapData instead of procedural generation
    - [ ] Store selected preset name in `game.mapPreset`
    - [ ] Run tests to confirm passing
- [ ] Task: Verify coverage and commit
    - [ ] Run `bun run type-check; bun run lint; bun test --coverage`
    - [ ] Commit with message: `feat(maps): Add 3 preset maps and lobby selection UI`
    - [ ] Attach git note with task summary
- [ ] Task: Conductor - User Manual Verification 'Phase E: Map Presets & Selection' (Protocol in workflow.md)

## Phase F: Map Preview (ASCII Grid)

- [ ] Task: Write failing tests for map preview (Red Phase)
    - [ ] Test `renderMapAscii(presetMap)` returns correctly formatted string
    - [ ] Test ASCII output uses `.` for floor, `#` for wall, `^` for high ground
    - [ ] Test ASCII output is 12 rows of 12 characters
    - [ ] Test `map` CLI command in lobby context returns current preset preview
- [ ] Task: Run tests to confirm failures (Red Phase verification)
- [ ] Task: Implement ASCII map preview (client-side only — no server mutation needed)
    - [ ] Create `src/lib/mapPreviewer.ts` with `renderMapAscii` function
    - [ ] Implement tile-to-character mapping: floor → `.`, wall → `#`, highground → `^`
    - [ ] Add `map` CLI command to command parser
    - [ ] Add `map` case to `handleCommand` in `useGameCommands.ts`: render ASCII grid from selected preset map data (read from PRESET_MAPS or gameState.mapData)
    - [ ] Auto-display preview in lobby when host selects/changes a preset (inline in LobbyScreen or via a "Map Preview:" log entry)
    - [ ] Run tests to confirm passing
- [ ] Task: Verify coverage and commit
    - [ ] Run `bun run type-check; bun run lint; bun test --coverage`
    - [ ] Commit with message: `feat(maps): Add ASCII map preview in lobby`
    - [ ] Attach git note with task summary
- [ ] Task: Conductor - User Manual Verification 'Phase F: Map Preview' (Protocol in workflow.md)

## Final Verification (Phase 11 Definition of Done)

- [ ] Task: Run full test suite across all phases
    - [ ] Run `bun run type-check; bun run lint; bun run build; bun test`
    - [ ] Verify 0 errors, all tests passing
- [ ] Task: Update docs/ROADMAP.md to mark Phase 11 as complete
- [ ] Task: Final checkpoint commit
    - [ ] Commit with message: `chore(phase11): Content Expansion complete`
    - [ ] Attach git note with full verification report
