# Implementation Plan: Phase 7 - Visual & UX Polish

---

## Phase 7.1: Visual Unit Enhancements

### Task 7.1.1: Add Health Bars to Unit Icons
- [ ] Write failing tests for health bar rendering (color gradient, positioning, sizing)
- [ ] Implement `HealthBar` sub-component in `UnitModel` with SVG bar
- [ ] Wire HP/maxHP props from game state to unit rendering
- [ ] Verify tests pass and visual integration is correct
- [ ] Task: Conductor - User Manual Verification 'Phase 7.1: Visual Unit Enhancements' (Protocol in workflow.md)

### Task 7.1.2: Enemy Color Coding
- [ ] Write failing tests for enemy/friendly unit color differentiation
- [ ] Implement color mapping based on `ownerId` (friendly=green, enemy=red, neutral=gray)
- [ ] Update `UnitModel` component to apply color classes
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.1: Visual Unit Enhancements' (Protocol in workflow.md)

### Task 7.1.3: Direction Indicator
- [ ] Write failing tests for direction arrow rendering on units
- [ ] Implement directional arrow SVG (N, E, S, W arrow glyphs)
- [ ] Integrate into `UnitModel` using `direction` prop
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.1: Visual Unit Enhancements' (Protocol in workflow.md)

### Task 7.1.4: Stealth Indicator for Scouts
- [ ] Write failing tests for stealthed unit visual effect
- [ ] Implement shimmer/glitch CSS animation for stealthed units
- [ ] Apply to Scout units when `isStealthed` is true and unit is visible to opponent
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.1: Visual Unit Enhancements' (Protocol in workflow.md)

---

## Phase 7.2: Log Visibility System

### Task 7.2.1: Schema Update for Log Visibility
- [ ] Write failing tests for visibility field in logs
- [ ] Add `visibility: v.union(v.literal("public"), v.literal("private"))` to logs schema in `convex/schema.ts`
- [ ] Update existing mutations that create logs to include visibility field
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.2: Log Visibility System' (Protocol in workflow.md)

### Task 7.2.2: Private Log Mutation Logic
- [ ] Write failing tests for private log creation (scan and inspect commands)
- [ ] Update `convex/combat.ts` scan handler to log with `visibility: "private"`
- [ ] Update `App.tsx` inspect handler to log with `visibility: "private"`
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.2: Log Visibility System' (Protocol in workflow.md)

### Task 7.2.3: Log Filter Query
- [ ] Write failing tests for player-specific log filtering
- [ ] Create new Convex query that filters logs by player ID and visibility
- [ ] Ensure public logs visible to all, private logs only to issuing player
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.2: Log Visibility System' (Protocol in workflow.md)

### Task 7.2.4: UI Rendering for Private Logs
- [ ] Write failing tests for private log styling
- [ ] Update `ConsoleHistory` or log rendering to show private logs dimmed/italicized
- [ ] Add visibility indicator icon or label to private entries
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.2: Log Visibility System' (Protocol in workflow.md)

---

## Phase 7.3: Grid Readability Enhancements

### Task 7.3.1: Tile Coordinate Labels
- [ ] Write failing tests for coordinate label rendering
- [ ] Add coordinate labels (A-L columns, 1-12 rows) to grid edges
- [ ] Implement toggle mechanism (keyboard shortcut or `help` command extension)
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.3: Grid Readability Enhancements' (Protocol in workflow.md)

### Task 7.3.2: Last Move Highlight
- [ ] Write failing tests for last move highlight
- [ ] Track last move origin and destination in component state
- [ ] Render highlight overlay on source and target tiles
- [ ] Clear highlight on next action or turn end
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.3: Grid Readability Enhancements' (Protocol in workflow.md)

### Task 7.3.3: Attack Range Preview
- [ ] Write failing tests for attack range overlay
- [ ] Implement range visualization overlay using unit `rng` stat
- [ ] Show overlay when unit is selected or hovered
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.3: Grid Readability Enhancements' (Protocol in workflow.md)

### Task 7.3.4: Overwatch Direction Indicator
- [ ] Write failing tests for overwatch cone rendering
- [ ] Implement direction cone SVG overlay for units on overwatch
- [ ] Integrate with existing `isOverwatching` and `overwatchDirection` props
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.3: Grid Readability Enhancements' (Protocol in workflow.md)

### Task 7.3.5: Hover Tooltips
- [ ] Write failing tests for tooltip rendering
- [ ] Implement tooltip component showing unit stats on hover
- [ ] Display type, HP, AP, ATK, RNG in compact format
- [ ] Handle tooltip positioning to avoid overflow
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.3: Grid Readability Enhancements' (Protocol in workflow.md)
