# Track: Phase 7 - Visual & UX Polish

## Overview

Address identified visual limitations and improve battlefield readability. This phase enhances the existing UI with health indicators, color-coded units, log visibility controls, and grid readability improvements — all while maintaining the core CLI-first terminal aesthetic.

## Prerequisites

Before any visual tasks can begin, the grid interaction layer must be extended:

- **Client-side selection state**: Add `selectedUnit`, `hoveredUnit` state to `App.tsx` to track which unit the player is currently inspecting or hovering over. Required by Attack Range Preview, Hover Tooltips, and Last Move Highlight.
- **Viewer identity context**: Pass `currentPlayerId` prop down to `UnitModel` so it can distinguish friendly vs. enemy units for color coding.
- **`moveUnit` mutation return**: Extend the Convex `moveUnit` handler to return `{ originX, originY }` alongside the existing `{ overwatchTriggered, damageTaken }`, so Last Move Highlight has access to the origin tile.

## Requirements

### 7.1 Visual Unit Enhancements

- **Health Bars**: Add visual HP bar beneath each unit icon on the grid, showing current HP / max HP ratio with color gradient (Green >50%, Yellow 25-50%, Red <25%)
- **Enemy Color Coding**: Render hostile units in distinct colors (Friendly: Matrix Green, Enemy: Hostile Red). Requires `currentPlayerId` prop in `UnitModel` to determine which units are "friendly" vs "enemy" from the viewer's perspective.
- **Direction Indicator Enhancement**: The existing direction indicator (thick line on the facing edge) exists in `UnitModel`. Enhance it from a line to an arrow glyph (triangle/chevron) for clearer facing readability at a glance.
- **Stealth Indicator**: Visual shimmer/glitch effect for stealthed Scouts, visible only to the **owning player** (the enemy never sees stealthed Scouts at all — they are filtered from `visibleUnits`).

### 7.2 Log Visibility System

- **Schema Update**: Add `visibility` field to `logs` table (`"public"` | `"private"`). Default to `"public"` for backward-compatible inserts including chat messages in `convex/chat.ts`.
- **Private Logs**: `scan` and `inspect` results visible only to issuing player. Logging currently happens client-side in `App.tsx` via `logCommand` — the `visibility` parameter is passed by the client, not inserted server-side.
- **Filter Logic**: New Convex query that filters logs by game ID AND player ID, returning only public logs + private logs belonging to that player.
- **UI Update**: Render private logs with distinct styling in `ConsoleHistory` (dimmed or italicized).

### 7.3 Grid Readability Enhancements

- **Tile Coordinates Toggle**: Coordinate labels (row numbers 12-1, column letters A-L) already exist on the grid edges. Add an optional toggle to show/hide them (keyboard shortcut or extended `help` command).
- **Last Move Highlight**: Highlight the tile a unit just moved from/to. Requires origin coordinates from the `moveUnit` mutation return value (see Prerequisites).
- **Attack Range Preview**: Visual overlay showing a unit's attack range (circular, covering tiles within `rng` distance) when the unit is selected or hovered. Uses the new `selectedUnit`/`hoveredUnit` state.
- **Overwatch Indicator**: Currently a pulsing border. Replace with a direction cone SVG overlay showing the watched direction (N/E/S/W cone).
- **Hover Tooltips**: Quick unit stats on mouse hover (for non-CLI users). Compact format: type, HP, AP, ATK, RNG. Uses the new `hoveredUnit` state.

## Non-Goals

- No changes to core game mechanics (combat, movement, abilities)
- No changes to the turn system or game loop
- No server-side logic changes beyond the logs visibility schema and the minor `moveUnit` return extension
- No removal of the existing `inspect` CLI command (tooltips complement, not replace it)

## Success Criteria

- All unit health visible at a glance on the grid
- Enemy and friendly units visually distinct at all times
- Private logs filtered correctly per player with distinct styling
- Coordinate labels toggleable, last move highlights, and overwatch direction cones functional
- All existing tests continue to pass

## Technical Context

All visual changes are in `src/components/Grid/` and `src/components/Terminal/`. The log visibility system requires changes in both `convex/` (schema + new query) and `src/` (`App.tsx` logging calls + `ConsoleHistory` rendering). The health bars, color coding, and indicators are SVG-based within the existing `GridBoard` and `UnitModel` components.

Key architectural notes:
- `UnitModel` currently only knows `ownerId` (p1/p2), not `currentPlayerId` — this must change for correct enemy color coding
- `logCommand` mutation is called from `App.tsx` for all commands — `scanArea` and `inspect` do NOT log server-side
- The logs table is also used by `convex/chat.ts` (`sendMessage`) — all chat messages must be `"public"`
- Coordinates (A-L, 1-12) already render in `GridBoard` — no new rendering needed, only a toggle
- A direction indicator (thick edge line) already exists in `UnitModel` — this is an enhancement, not a new feature
- An overwatch pulsing border already exists in `UnitModel` — this is a replacement, not additive
