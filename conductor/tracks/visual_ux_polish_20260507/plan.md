# Implementation Plan: Phase 7 - Visual & UX Polish

**Dependency Legend:**
- `DEPENDS ON: <task_id>` — This task cannot start until the listed task is complete
- Tasks within the same phase that have no dependency marker can be done in parallel

---

## Phase 7.1: Visual Unit Enhancements [checkpoint: 341d6d6]

### Task 7.1.0: Client-side Interaction State & Viewer Context (Prerequisite)
**DEPENDS ON: (none — foundation task)**
- [x] Write tests for selection state management (selectedUnit, hoveredUnit, isHovering) [e89f4fd]
- [x] Add `selectedUnit` and `hoveredUnit` state to `App.tsx` via `useState`
- [x] Add `onUnitHover`/`onUnitLeave`/`onUnitClick` callbacks passed to `GridBoard` children
- [x] Add `currentPlayerId` prop to `UnitModel` interface for friendly/enemy distinction
- [x] Wire callbacks from `App.tsx` through `GameLayout` to unit rendering
- [x] Verify tests pass

### Task 7.1.1: Health Bars on Unit Icons
**DEPENDS ON: 7.1.0** (uses hoveredUnit for optional highlight)
- [x] Write failing tests for health bar rendering (color gradient, positioning, sizing) [1ca1ca7]
- [x] Implement `HealthBar` SVG sub-component in `UnitModel`
- [x] Wire HP/maxHP props from game state to health bar rendering
- [x] Verify tests pass

### Task 7.1.2: Enemy Color Coding
**DEPENDS ON: 7.1.0** (needs currentPlayerId prop)
- [x] Write failing tests for friendly/enemy color differentiation [43e3289]
- [x] Implement color mapping: `ownerId === currentPlayerId` → Matrix Green (`#00FF00`), else → Hostile Red (`#FF4444`)
- [x] Update `UnitModel` to receive `currentPlayerId` and apply dynamic color to border, text, direction line, and AP dots
- [x] Verify tests pass

### Task 7.1.3: Direction Indicator Enhancement — Line to Arrow
**Note:** A direction indicator already exists in `UnitModel` (thick edge line). This task enhances it.
**DEPENDS ON: 7.1.0**
- [x] Write failing tests for arrow direction rendering (N, E, S, W arrow glyphs) [908e39d]
- [x] Replace the existing `<motion.line>` indicator with an `<motion.polygon>` or `<motion.path>` arrow (triangle/chevron pointing in the facing direction)
- [x] Ensure arrow maintains the existing spring animation
- [x] Verify tests pass

### Task 7.1.4: Stealth Indicator for Friendly Scouts
**Note:** Stealthed Scouts are filtered from `visibleUnits` for the enemy — the indicator is for the **owning player** only.
**DEPENDS ON: 7.1.0**
- [x] Write failing tests for stealthed unit shimmer/glitch visual effect [dbbb9b0]
- [x] Implement CSS `@keyframes` shimmer pulse animation (not opacity flicker — a glitchy horizontal offset)
- [x] Apply CSS class to `UnitModel` group when `isStealthed` is true (visible to owning player only)
- [x] Verify tests pass
- [x] Task: Conductor - User Manual Verification 'Phase 7.1: Visual Unit Enhancements' (Protocol in workflow.md)

---

## Phase 7.2: Log Visibility System

### Task 7.2.1: Schema Update for Log Visibility
**DEPENDS ON: (none — can run in parallel with Phase 7.1)**
- [x] Write failing tests for visibility field in logs schema [38e1d14]
- [x] Add `visibility: v.optional(v.union(v.literal("public"), v.literal("private")))` to logs schema in `convex/schema.ts` (optional for backward compatibility)
- [x] Update `logCommand` mutation args in `convex/game.ts` to accept optional `visibility` parameter
- [x] Update `convex/chat.ts` `sendMessage` to always insert with `visibility: "public"`
- [x] Verify tests pass

### Task 7.2.2: Private Log Creation (Client-Side)
**Note:** Logging happens client-side in `App.tsx`, not inside Convex mutations. The `scanArea` mutation does not call `logCommand`.
**DEPENDS ON: 7.2.1**
- [x] Write failing tests for logCommand calls with visibility parameter [ae9a92f]
- [x] Update `App.tsx` scan command handler to pass `visibility: "private"` to `logCommand`
- [x] Update `App.tsx` inspect command handler to pass `visibility: "private"` to `logCommand`
- [x] Ensure all other command handlers pass `visibility: "public"` (or omit — schema field is optional)
- [x] Verify tests pass

### Task 7.2.3: Log Filter Query (Server-Side)
**DEPENDS ON: 7.2.1**
- [ ] Write failing tests for player-specific log filtering
- [ ] Create new Convex query `getFilteredLogs` that accepts `gameId` and `playerId` args
- [ ] Filter logic: return logs where `visibility === "public"` OR (`visibility === "private"` AND `playerId === requestedPlayerId`)
- [ ] Return logs ordered ascending by timestamp for chronological display
- [ ] Verify tests pass

### Task 7.2.4: UI Rendering for Private Logs
**DEPENDS ON: 7.2.2, 7.2.3**
- [ ] Write failing tests for private log styling
- [ ] Switch `App.tsx` from `getLogs` to `getFilteredLogs` query, passing the current `playerId`
- [ ] Update `ConsoleHistory` or log formatting in `App.tsx` to render private logs dimmed or italicized
- [ ] Optionally add a small privacy indicator icon/label to private entries (e.g., `[PRIVATE]`)
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.2: Log Visibility System' (Protocol in workflow.md)

---

## Phase 7.3: Grid Readability Enhancements

### Task 7.3.1: Coordinate Labels Toggle
**Note:** Row labels (12-1) and column labels (A-L) already render on grid edges in `GridBoard.tsx`. This task adds a toggle.
**DEPENDS ON: (none — independent of other 7.3 tasks)**
- [ ] Write failing tests for coordinate label toggle behavior
- [ ] Add a `showCoordinates` boolean state (default: true) to `GridBoard` or parent
- [ ] Add keyboard shortcut (e.g., toggle via new `toggle labels` command or extend existing CLI)
- [ ] Conditionally render the existing label `<text>` elements based on `showCoordinates`
- [ ] Verify tests pass

### Task 7.3.2: Last Move Highlight
**Note:** `moveUnit` mutation must return origin coordinates. See Prerequisites in spec.
**DEPENDS ON: 7.1.0, moveUnit return extension (spec prerequisite)**
- [ ] Write failing tests for last-move highlight rendering
- [ ] Track `lastMoveOrigin` and `lastMoveDestination` in `App.tsx` state, set after successful `moveUnit` call
- [ ] Pass last-move tiles to `GridBoard` and render highlight overlays (semi-transparent colored rectangles)
- [ ] Clear highlight on next action (next move, attack, end-turn, or turn change detected in `gameState`)
- [ ] Verify tests pass

### Task 7.3.3: Attack Range Preview
**DEPENDS ON: 7.1.0** (uses selectedUnit/hoveredUnit state)
- [ ] Write failing tests for attack range overlay
- [ ] Implement range calculation: all tiles within Manhattan distance ≤ `unit.rng` from selected/hovered unit
- [ ] Render translucent overlay circles on in-range tiles in `GridBoard`
- [ ] Clear overlay when no unit is selected or hovered
- [ ] Verify tests pass

### Task 7.3.4: Overwatch Direction Cone (Replace Pulsing Border)
**Note:** A pulsing-border overwatch effect already exists in `UnitModel`. This task replaces it with a direction-aware cone.
**DEPENDS ON: 7.1.0**
- [ ] Write failing tests for overwatch direction cone rendering
- [ ] Design SVG cone/pie-slice shape for each direction (N: upward cone, E: rightward, S: downward, W: leftward)
- [ ] Replace the existing `<motion.rect>` pulse with the new cone SVG
- [ ] Maintain the pulsing/breathing animation on the cone
- [ ] Verify tests pass

### Task 7.3.5: Hover Tooltips
**DEPENDS ON: 7.1.0, 7.1.2** (needs hover state + correct colors)
- [ ] Write failing tests for hover tooltip rendering and content
- [ ] Implement a tooltip SVG group or absolutely-positioned HTML overlay showing: type, HP, AP, ATK, RNG
- [ ] Position tooltip near the hovered unit, with boundary clamping to avoid viewport overflow
- [ ] Show only on mouse hover (not keyboard focus), as keyboard users have the `inspect` command
- [ ] Verify tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase 7.3: Grid Readability Enhancements' (Protocol in workflow.md)
