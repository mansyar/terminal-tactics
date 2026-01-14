# ⚔️ TERMINAL TACTICS — Combat System

> Technical specifications for combat, Line of Sight, and damage calculation.  
> See [GDD.md](./GDD.md) for gameplay overview.

---

## Overview

Combat in Terminal Tactics is **deterministic** — no dice rolls, no RNG. Damage is calculated based on:

1. Unit's base ATK stat
2. Attacker's position relative to defender's facing
3. Elevation (high ground bonus)
4. Defensive abilities (Knight's shield)

---

## Line of Sight (LoS) Algorithm

Uses **Bresenham's Line Algorithm** to trace a path from attacker to target:

### Steps:

1. Draw a line from center of attacker tile to center of target tile.
2. Check each tile the line passes through.
3. If **any tile is a wall (`#`)**, LoS is blocked → `BLOCKED_BY_WALL` error.
4. Other units do **not** block LoS (you can shoot over/past allies).

### Example:

```
Attacker [A] at B2, Target [K] at E2
Path: B2 → C2 → D2 → E2

If D2 is wall: BLOCKED
If D2 is floor/unit: CLEAR
```

### Implementation Notes:

- Use integer math for performance.
- For diagonal lines, check all tiles the line passes through (not just corners).
- Edge case: Adjacent units always have LoS (range 1 = no intermediate tiles).

---

## Directional Damage (Facing System)

Damage is modified by the **relative angle** between the attacker's position and the defender's facing direction.

### Multipliers:

| Attack Position          | Damage | Name         |
| ------------------------ | ------ | ------------ |
| Directly facing defender | 100%   | **Frontal**  |
| Side of defender         | 125%   | **Flank**    |
| Behind defender          | 150%   | **Backstab** |

### Position Diagram:

```
        N (Front)
          ↑
    NW    |    NE
      \   |   /
       \  |  /     ← Frontal Zone (100%)
        \ | /
W ←------[K]------→ E   ← Flank Zone (125%)
        / | \
       /  |  \
      /   |   \     ← Rear Zone (150%)
    SW    |    SE
          ↓
        S (Back)
```

### Quadrant Logic:

For a unit facing **North** (direction = "N"):

| Attacker Position                      | Zone    | Multiplier |
| -------------------------------------- | ------- | ---------- |
| Y < defender.Y (rows above)            | Frontal | 1.00       |
| Y == defender.Y (same row, left/right) | Flank   | 1.25       |
| Y > defender.Y (rows below)            | Rear    | 1.50       |

**Algorithm:**

```typescript
function getPositionMultiplier(attackerPos, defenderPos, defenderDir) {
  const dx = attackerPos.x - defenderPos.x
  const dy = attackerPos.y - defenderPos.y

  // Determine relative direction
  let attackAngle: 'front' | 'side' | 'rear'

  switch (defenderDir) {
    case 'N': // Defender facing up (toward row 0)
      if (dy < 0) attackAngle = 'front'
      else if (dy > 0) attackAngle = 'rear'
      else attackAngle = 'side'
      break
    case 'S': // Defender facing down
      if (dy > 0) attackAngle = 'front'
      else if (dy < 0) attackAngle = 'rear'
      else attackAngle = 'side'
      break
    case 'E': // Defender facing right
      if (dx > 0) attackAngle = 'front'
      else if (dx < 0) attackAngle = 'rear'
      else attackAngle = 'side'
      break
    case 'W': // Defender facing left
      if (dx < 0) attackAngle = 'front'
      else if (dx > 0) attackAngle = 'rear'
      else attackAngle = 'side'
      break
  }

  return attackAngle === 'front' ? 1.0 : attackAngle === 'side' ? 1.25 : 1.5 // rear
}
```

---

## Elevation Bonus

Units on **High Ground (`^`)** gain:

- **+1 Range** (Archer at RNG 5 becomes RNG 6)
- **+10 Flat Damage** (added after multipliers)

High ground does **not** provide defensive bonuses.

---

## Knight Shield

The Knight `[K]` has a **Frontal Shield** passive ability:

- When attacked from the **front** (Frontal zone only), incoming damage is reduced by **20%**.
- Shield does **not** apply to Flank or Backstab attacks.
- Shield reduction is applied **after** position multipliers but **before** floor rounding.

---

## Master Damage Formula

```
Final Damage = floor((ATK × PositionMultiplier × ShieldMultiplier) + ElevationBonus)

Where:
- ATK = Attacker's base attack stat
- PositionMultiplier = 1.0 (front), 1.25 (flank), 1.5 (rear)
- ShieldMultiplier = 0.8 if Knight + frontal attack, else 1.0
- ElevationBonus = 10 if attacker is on high ground, else 0
```

### Calculation Examples:

**Example 1: Basic Attack**

```
Archer (ATK 20) attacks Knight frontally
= floor((20 × 1.0 × 0.8) + 0)
= floor(16)
= 16 damage
```

**Example 2: Backstab from High Ground**

```
Archer (ATK 20) backstabs Knight from high ground
= floor((20 × 1.5 × 1.0) + 10)
= floor(30 + 10)
= 40 damage
```

**Example 3: Flank Attack on Knight**

```
Scout (ATK 15) flanks Knight (shield doesn't apply to flanks)
= floor((15 × 1.25 × 1.0) + 0)
= floor(18.75)
= 18 damage
```

---

## Vision System

### Vision Radius by Unit Class

| Unit         | VIS (Vision Range) | Notes                                 |
| ------------ | ------------------ | ------------------------------------- |
| Knight `[K]` | 3 tiles            | Short range, frontline fighter        |
| Archer `[A]` | 5 tiles            | Long sightlines, matches attack range |
| Scout `[S]`  | 4 tiles            | Moderate vision, but harder to detect |
| Medic `[M]`  | 3 tiles            | Support unit, relies on team vision   |

**Vision is circular** — measured as Chebyshev distance (king's move in chess).

### Visibility Rules

1. **Terrain Memory:** Once any of your units sees a tile, the terrain type (floor/wall/highground) is **permanently revealed** on your map.

2. **Unit Visibility:** Enemy units are only visible if:
   - They are within vision range of **any** of your units, AND
   - There is **Line of Sight** to them (walls block vision)

3. **Last Known Position:** When an enemy leaves your vision, they vanish. No "ghost" marker.

4. **Shared Vision:** All your units share vision (team-wide fog of war).

---

## Stealth Mechanics (Scout)

The Scout `[S]` has special stealth capabilities:

- **Cloak:** Invisible to enemy vision unless an enemy is **adjacent** (within 1 tile, orthogonal or diagonal).
- **Scan Immunity:** Does not appear in `scan` command results.
- **Breaking Stealth:** Attacking breaks stealth for the remainder of the turn.
- **Re-Cloaking:** Stealth is restored after ending turn without being adjacent to enemies.

---

## Adjacency Definitions

| Type           | Tiles                  | Used For                         |
| -------------- | ---------------------- | -------------------------------- |
| **Orthogonal** | 4 (N, E, S, W)         | Heal range, Scout reveal trigger |
| **Chebyshev**  | 8 (includes diagonals) | Vision range calculation         |

---

## Expansion Unit Abilities _(Phase 11)_

### Sniper Precision

The Sniper `[N]` has unique attack restrictions:

- **Stationary Attack:** Cannot move and attack in the same turn.
  - If unit moved this turn → `CANNOT_ATTACK_AFTER_MOVE`
  - If unit attacks → cannot move remainder of turn
- **Extended Range:** 8-tile attack range (longest in game).
- **High Ground Synergy:** Gains +2 range (total 10) from elevation.

### Engineer Construction

The Engineer `[E]` can manipulate the battlefield:

- **Build (`build [coord]`):**
  - Create a wall tile at target empty floor
  - Limited to 1 wall per Engineer per game
  - Wall is permanent and blocks LoS/movement
- **Demolish (`demolish [coord]`):**
  - Destroy adjacent wall tile
  - Converts to floor (`.`)
  - Unlimited uses

### Commander Rally

The Commander `[C]` supports the team:

- **Rally (`rally [coord]`):**
  - Target adjacent friendly unit gains +1 AP
  - Cannot self-rally
  - Bonus AP expires at end of current turn
  - Can rally same unit multiple times (if has AP)

---

## King of the Hill Mechanics _(Phase 11)_

Alternative win condition for the King of the Hill game mode.

### Control Point

- **Location:** Central 2×2 tiles (F6, F7, G6, G7 on standard 12×12 map)
- **Visual:** Marked with `◉` symbols
- **Capture:** A player "controls" the point if ONLY their units occupy it

### Victory Condition

| Condition                             | Result  |
| ------------------------------------- | ------- |
| Control point for 5 consecutive turns | Victory |
| All enemy units eliminated            | Victory |
| Opponent forfeits                     | Victory |
| Both players agree to draw            | Draw    |

### Contesting

- If both players have units on control point → **Contested** (no progress)
- If control point is empty → No progress for either player
- Progress counter resets if control is lost
