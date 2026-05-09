# Specification: Content Expansion (Phase 11)

## Overview

Expand gameplay depth by introducing 3 new playable unit classes (Engineer, Sniper, Commander) and a curated map selection system with 3 preset maps. The random procedural map generation (cellular automata) from Phase 4 remains the default; presets are an alternative for the lobby host.

---

## 1. New Unit Classes

### 1.1 Engineer `[E]`

- **Cost:** 200 credits
- **Stats:** HP: 60, AP: 3, ATK: 10, RNG: 1, VIS: 3
- **Label character:** `E`
- **Ability: `build [coord]`**
  - Create a wall tile (`#`) at the specified adjacent coordinate
  - AP Cost: 1
  - Limit: 1 wall per Engineer unit, reusable (demolish → rebuild elsewhere)
  - The target tile must be floor terrain and orthogonal-adjacent to the Engineer
- **Ability: `demolish [coord]`**
  - Destroy an adjacent wall tile, turning it back to floor
  - AP Cost: 1
  - Target must be a wall tile orthogonal-adjacent to the Engineer
- **Combat:** Standard melee attack rules (RNG: 1)

### 1.2 Sniper `[R]`

- **Cost:** 350 credits
- **Stats:** HP: 40, AP: 2, ATK: 40, RNG: 8, VIS: 6
- **Label character:** `R` (Rifleman)
- **Restriction: Stationary Attack**
  - If the Sniper has moved during the current turn (via `mv` or `sudo mv`), any `atk` command is rejected with an error (`SNIPER_MOVED_THIS_TURN`)
  - This restriction clears at the start of the Sniper's next turn
- **Combat:** Highest single-target damage (40 ATK) with very long range (8 tiles). Glass cannon — only 40 HP.

### 1.3 Commander `[C]`

- **Cost:** 400 credits
- **Stats:** HP: 80, AP: 2, ATK: 20, RNG: 2, VIS: 4
- **Label character:** `C`
- **Ability: `rally [coord]`**
  - Grant +1 AP to all friendly units adjacent to the target coordinate
  - AP Cost: 1
  - Duration: Current turn only (bonus AP is consumed or lost at turn end)
  - The Commander itself can be both the origin (target its own tile) or target a position adjacent to allies
- **Combat:** Strong melee attacker (ATK: 20), but expensive (400 credits). Primary value is the rally support ability.

---

## 2. Map Presets

### 2.1 Preset Map Definitions

Three handcrafted 12×12 tile arrays stored as static constants in a new data file:

- **The Grid** — Symmetrical, open sightlines. Showcases core tactics.
  - Central open area with walls along the edges and scattered high ground
  - Minimal chokepoints; encourages direct engagement
- **The Maze** — Tight corridors, heavy cover. Showcases Engineer wall plays.
  - Winding corridors with frequent wall cover
  - Multiple flanking routes; rewards positioning and unit abilities
- **The Ridge** — High ground focus. Showcases Archer/Sniper elevation.
  - Elevated center ridge with high ground tiles
  - Spawn zones at low elevation; promotes ranged unit strategy

### 2.2 Map Selection

- **Lobby host** (player who creates the lobby) chooses the map type before the game starts
- **Options:** Random (procedural generation, default) or one of the 3 presets (The Grid, The Maze, The Ridge)
- **UI Element:** Selector/dropdown in the Lobby UI, placed near the squad builder
- **Storage:** Selected map name is stored on the `games` document

### 2.3 Map Preview

- **ASCII Grid:** When a preset is selected in the lobby, render a compact ASCII preview in the CLI (e.g., `map` command or auto-displayed)
- **Format:** Character-based grid where `.` = floor, `#` = wall, `^` = high ground
- **Trigger:** Automatically displayed when the lobby host selects/changes a preset

---

## 3. Command Parser Updates

Add the following to the command parser and validation system:

| Command | Syntax | AP Cost | Unit Restriction |
|---------|--------|---------|-----------------|
| `build` | `build [coord]` | 1 | Engineer only |
| `demolish` | `demolish [coord]` | 1 | Engineer only |
| `rally` | `rally [coord]` | 1 | Commander only |
| `map` | `map` | 0 | Lobby only, preview selected preset |

---

## 4. Unit Templates Update

Extend the `UNIT_TEMPLATES` and `UnitType` union to include the 3 new types:

| Type | Label | Cost | HP | AP | ATK | RNG | VIS |
|------|-------|------|----|----|-----|-----|-----|
| `E` | Engineer | 200 | 60 | 3 | 10 | 1 | 3 |
| `R` | Sniper | 350 | 40 | 2 | 40 | 8 | 6 |
| `C` | Commander | 400 | 80 | 2 | 20 | 2 | 4 |

---

## 5. Convex Schema Updates

- Add `mapPreset` field (optional string) to `games` table — stores chosen preset name (`"grid"`, `"maze"`, `"ridge"`, or undefined for random)
- Add `engineerWallCount` (optional number) to `units` table — tracks remaining `build` uses per Engineer unit
- Add `sniperMovedThisTurn` (optional boolean) to `units` table — tracks if Sniper has moved
- Add `rallyBuff` (optional boolean) to `units` table — tracks +1 AP buff this turn

---

## 6. Squad Builder Update

- Add Engineer [E], Sniper [R], Commander [C] to the Squad Builder as selectable units
- Budget: 1000 credits total, 2–5 unit squad size limit (unchanged)
- Unit template definitions sourced from `UNIT_TEMPLATES`

---

## Acceptance Criteria

- [ ] Engineer can `build` a wall tile (1 per unit, reusable) and `demolish` adjacent walls
- [ ] Sniper's `atk` is rejected if moved this turn; otherwise deals 40 base damage at range 8
- [ ] Commander `rally` grants adjacent allies +1 AP for the current turn
- [ ] All 3 new units appear in the Squad Builder and can be drafted within the 1000-credit budget
- [ ] 3 preset maps available as static 12×12 tile arrays
- [ ] Lobby host can select Random or a preset map before the game starts
- [ ] Map preview renders as ASCII grid in lobby when a preset is selected
- [ ] New commands (`build`, `demolish`, `rally`, `map`) are parsed and validated correctly
- [ ] Enemy units can use terrain created by Engineer `build` (both teams)
- [ ] Existing unit templates, combat, and movement logic remain unchanged
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` (0 failures)

---

## Out of Scope

- AI squad composition for new units (Phase 12)
- Visual unit icons for new classes (follow existing `[type]` text rendering pattern)
- Balance tuning (stats may be adjusted after playtesting)
- King of the Hill game mode
