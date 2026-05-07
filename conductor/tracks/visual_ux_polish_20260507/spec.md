# Track: Phase 7 - Visual & UX Polish

## Overview

Address identified visual limitations and improve battlefield readability. This phase enhances the existing UI with health indicators, color-coded units, log visibility controls, and grid readability improvements — all while maintaining the core CLI-first terminal aesthetic.

## Requirements

### 7.1 Visual Unit Enhancements

- **Health Bars**: Add visual HP bar beneath each unit icon on the grid, showing current HP / max HP ratio with color gradient (Green >50%, Yellow 25-50%, Red <25%)
- **Enemy Color Coding**: Render hostile units in distinct colors (Friendly: Matrix Green, Enemy: Hostile Red, Neutral/Unknown: Dim Gray)
- **Direction Indicator**: Visual arrow or facing indicator on unit tiles (N, E, S, W arrows)
- **Stealth Indicator**: Visual shimmer/glitch effect for stealthed Scouts visible to the enemy

### 7.2 Log Visibility System

- **Schema Update**: Add `visibility` field to `logs` table (`"public"` | `"private"`)
- **Private Logs**: `scan` and `inspect` results visible only to issuing player
- **Filter Logic**: Query logs with player-specific visibility filter in Convex
- **UI Update**: Render private logs with distinct styling (dimmed or italicized)

### 7.3 Grid Readability Enhancements

- **Tile Coordinates**: Optional toggle to show coordinate labels on grid edges (A-L, 1-12)
- **Last Move Highlight**: Highlight the tile a unit just moved from/to
- **Attack Range Preview**: Visual overlay when hovering over or inspecting a unit
- **Overwatch Indicator**: Show direction cone for units on overwatch
- **Hover Tooltips**: Quick unit stats on mouse hover (for non-CLI users)

## Non-Goals

- No changes to core game mechanics (combat, movement, abilities)
- No changes to the turn system or game loop
- No server-side logic changes beyond the logs visibility schema

## Success Criteria

- All unit health visible at a glance on the grid
- Enemy and friendly units visually distinct at all times
- Private logs filtered correctly per player with distinct styling
- Coordinate labels, last move highlights, and overwatch indicators functional
- All existing tests continue to pass

## Technical Context

All visual changes are in `src/components/Grid/` and `src/components/Terminal/`. The log visibility system requires changes in both `convex/` (schema + queries) and `src/` (rendering). The health bars, color coding, and indicators are SVG-based within the existing `GridBoard` and `UnitModel` components.
