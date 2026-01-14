# 📟 TERMINAL TACTICS — Command Reference

> Full command specifications for the CLI interface.  
> See [GDD.md](./GDD.md) for gameplay overview.

---

## Quick Reference

| Command    | Syntax              |     AP | Status         |
| ---------- | ------------------- | -----: | -------------- |
| `mv`       | `mv [from] [to]`    | 1/tile | ✅ Implemented |
| `atk`      | `atk [from] [to]`   |      1 | ✅ Implemented |
| `heal`     | `heal [from] [to]`  |      1 | ✅ Implemented |
| `scan`     | `scan [coord]`      |      1 | ✅ Implemented |
| `ovw`      | `ovw [coord] [dir]` |      1 | ✅ Implemented |
| `inspect`  | `inspect [coord]`   |      0 | ✅ Implemented |
| `end`      | `end`               |      — | ✅ Implemented |
| `help`     | `help`              |      0 | ✅ Implemented |
| `clear`    | `clear`             |      0 | ✅ Implemented |
| `forfeit`  | `forfeit`           |      0 | ✅ Implemented |
| `say`      | `say [message]`     |      0 | ✅ Implemented |
| `sudo`     | `sudo [cmd]`        |  1 RAP | ✅ Implemented |
| `build`    | `build [coord]`     |      1 | ⏳ Phase 11    |
| `demolish` | `demolish [coord]`  |      1 | ⏳ Phase 11    |
| `rally`    | `rally [coord]`     |      1 | ⏳ Phase 11    |

---

## Detailed Specifications

### `mv` — Movement

**Syntax:** `mv [fromCoord] [toCoord]`  
**Example:** `mv C2 C5`  
**AP Cost:** 1 AP per tile (Manhattan distance)

**Mechanics:**

- Moves your unit from the source position to the target position.
- Unit's **direction** automatically updates to face the movement heading.
- Movement is animated (spring physics via Framer Motion).

**Validation Rules:**

| Check             | Error Code                                      | Description                     |
| ----------------- | ----------------------------------------------- | ------------------------------- |
| Valid coordinates | `INVALID_SOURCE_COORD` / `INVALID_TARGET_COORD` | Must be A-L and 1-12            |
| Unit exists       | `NO_UNIT_AT`                                    | No unit at source position      |
| Ownership         | `NOT_YOUR_UNIT_AT`                              | Unit must belong to you         |
| Turn              | `NOT_YOUR_TURN`                                 | Must be your turn               |
| Walls             | `OBSTRUCTED_BY_WALL`                            | Cannot move into wall tiles     |
| Collision         | `OBSTRUCTED_BY_UNIT`                            | Cannot move into occupied tiles |
| AP                | `INSUFFICIENT_AP`                               | Distance exceeds available AP   |
| Bounds            | `OUT_OF_BOUNDS`                                 | Target outside 12x12 grid       |

**Success Response:** `MOVE_SUCCESS: [K] C2 -> C5`

---

### `atk` — Attack ✅

**Syntax:** `atk [fromCoord] [targetCoord]`  
**Example:** `atk C4 E4`  
**AP Cost:** 1 AP

**Mechanics:**

- Attacks an enemy unit at the target position.
- Damage is **deterministic** (no RNG). Base damage modified by position.
- Requires **Line of Sight** — walls block attacks.
- Attacker's **direction** updates to face the target.

See [COMBAT.md](./COMBAT.md) for damage calculation details.

**Validation Rules:**

| Check             | Error Code           | Description                   |
| ----------------- | -------------------- | ----------------------------- |
| Valid coordinates | `INVALID_COORD`      | Must be valid chess notation  |
| Unit exists       | `NO_UNIT_AT`         | Your unit must be at source   |
| Target exists     | `NO_TARGET_AT`       | Enemy unit must be at target  |
| Ownership         | `CANNOT_ATTACK_ALLY` | Cannot attack your own units  |
| Range             | `OUT_OF_RANGE`       | Target beyond unit's RNG stat |
| Line of Sight     | `BLOCKED_BY_WALL`    | Wall obstructs attack path    |
| AP                | `INSUFFICIENT_AP`    | Requires 1 AP                 |

**Success Response:** `ATTACK_HIT: [A] dealt 25 DMG to [K] at E4. (FLANK BONUS)`

---

### `heal` — Heal ✅

**Syntax:** `heal [fromCoord] [targetCoord]`  
**Example:** `heal D5 C5`  
**AP Cost:** 1 AP  
**Medic Only**

**Mechanics:**

- Medic heals an adjacent allied unit for **15 HP**.
- Cannot exceed unit's `maxHp`.
- Cannot self-heal.
- **Adjacency:** Orthogonal only (4 tiles: N, E, S, W).

**Validation Rules:**

| Check     | Error Code          | Description                             |
| --------- | ------------------- | --------------------------------------- |
| Unit type | `NOT_A_MEDIC`       | Only `[M]` can heal                     |
| Adjacency | `NOT_ADJACENT`      | Target must be 1 tile away (orthogonal) |
| Ally      | `CANNOT_HEAL_ENEMY` | Target must be your unit                |
| HP        | `ALREADY_FULL_HP`   | Target already at max HP                |

**Success Response:** `HEAL_SUCCESS: [M] restored 15 HP to [K] at C5. (85/100)`

---

### `scan` — Scan Area ✅

**Syntax:** `scan [coord]`  
**Example:** `scan D5`  
**AP Cost:** 1 AP

**Mechanics:**

- Reveals a **3x3 area** centered on the target coordinate.
- Revealed terrain is **permanently remembered** (Fog of War memory).
- Enemy units in the scanned area become visible until they move.
- **Scout units are immune** — they do not appear in scan results.

**Validation Rules:**

| Check            | Error Code        | Description                 |
| ---------------- | ----------------- | --------------------------- |
| Valid coordinate | `INVALID_COORD`   | Must be within grid         |
| AP               | `INSUFFICIENT_AP` | Requires 1 AP from any unit |

**Success Response:** `SCAN_COMPLETE: Area D4-F6 revealed. 1 hostile detected.`

---

### `ovw` — Overwatch ✅

**Syntax:** `ovw [coord] [direction]`  
**Example:** `ovw C4 N`  
**AP Cost:** 1 AP  
**Directions:** `N` (North), `E` (East), `S` (South), `W` (West)

**Mechanics:**

- Sets a unit to **Overwatch mode**, watching the specified direction.
- Unit's **direction** updates to match the overwatch heading.
- **Trigger:** During the opponent's turn, if an enemy enters the unit's attack range from the watched direction, the unit automatically fires.
- Overwatch fires **once**, then clears.
- Overwatch persists until:
  - Triggered by enemy movement
  - Your next turn begins (auto-clear)
  - Unit takes damage (interrupted)

**Validation Rules:**

| Check            | Error Code          | Description                     |
| ---------------- | ------------------- | ------------------------------- |
| Valid coordinate | `INVALID_COORD`     | Must be valid chess notation    |
| Unit exists      | `NO_UNIT_AT`        | Your unit must be at position   |
| Valid direction  | `INVALID_DIRECTION` | Must be N, E, S, or W           |
| AP               | `INSUFFICIENT_AP`   | Requires 1 AP                   |
| Combat unit      | `CANNOT_OVERWATCH`  | Medics cannot overwatch (0 ATK) |

**Success Response:** `OVERWATCH_SET: [A] at C4 watching NORTH. Ready to intercept.`  
**Trigger Response:** `OVERWATCH_TRIGGERED: [A] intercepted [S] at C2 for 20 DMG!`

---

### `inspect` — Inspect Unit

**Syntax:** `inspect [coord]`  
**Example:** `inspect C4`  
**AP Cost:** 0 (Free action)

**Mechanics:**

- Displays detailed stats of any visible unit.
- Works on both allied and enemy units (if visible).

**Output Format:**

```
UNIT_ID: [K] | OWNER: P1 | HP: 85/100 | AP: 1/2 | POS: C4 | DIR: N
```

**Validation Rules:**

| Check            | Error Code            | Description                  |
| ---------------- | --------------------- | ---------------------------- |
| Valid coordinate | `INVALID_COORD`       | Must be valid chess notation |
| Unit exists      | `NO_UNIT_DETECTED_AT` | No unit at position          |

---

### `end` — End Turn

**Syntax:** `end`  
**AP Cost:** N/A

**Mechanics:**

- Ends your turn immediately.
- All your units' AP is forfeited.
- Opponent's turn begins.
- Opponent's units have their AP restored to `maxAp`.
- Any active overwatch on your units is cleared.

**Validation Rules:**

| Check | Error Code      | Description       |
| ----- | --------------- | ----------------- |
| Turn  | `NOT_YOUR_TURN` | Must be your turn |

**Success Response:** `TURN_ENDED`

---

### Utility Commands

| Command   | AP Cost | Description                                  |
| --------- | ------- | -------------------------------------------- |
| `help`    | 0       | Display list of available commands           |
| `clear`   | 0       | Clear the console history (client-side only) |
| `forfeit` | 0       | Surrender the game immediately ✅            |
| `say`     | 0       | Send a message to opponent ✅                |

---

### `sudo` — Ultimate Ability ✅

**Syntax:** `sudo [command]`  
**Example:** `sudo mv C2 C8`  
**Cost:** 1 Root Access Point (RAP)

**Root Access Points:**

- Earned by eliminating enemy units (+1 RAP per kill).
- Earned passively (+1 RAP every 3 turns survived).
- Maximum: 3 RAP stored.

**Available Sudo Commands:**

| Command                | Effect                                                             |
| ---------------------- | ------------------------------------------------------------------ |
| `sudo mv [from] [to]`  | Unit ignores terrain costs, walls, and collision. Unlimited range. |
| `sudo scan`            | Reveals the **entire map** for the remainder of your turn.         |
| `sudo atk [from] [to]` | Attack ignores Line of Sight. Deals **200% damage**.               |

**Success Response:** `ROOT_ACCESS_GRANTED: Executing privileged command...`

---

## Phase 11: Expansion Unit Commands ⏳

The following commands will be available with the expansion units (Phase 11).

### `build` — Build Wall _(Engineer Only)_

**Syntax:** `build [coord]`  
**Example:** `build D5`  
**AP Cost:** 1 AP  
**Engineer Only**

**Mechanics:**

- Engineer constructs a wall (`#`) at the target coordinate.
- Limited to **1 wall per game** per Engineer.
- Cannot build on occupied tiles or existing walls.
- Wall persists for entire game.

**Validation Rules:**

| Check      | Error Code            | Description                         |
| ---------- | --------------------- | ----------------------------------- |
| Unit type  | `NOT_AN_ENGINEER`     | Only `[E]` can build                |
| Empty tile | `TILE_OCCUPIED`       | Target must be empty floor          |
| Uses left  | `BUILD_LIMIT_REACHED` | Engineer already used build ability |
| AP         | `INSUFFICIENT_AP`     | Requires 1 AP                       |

**Success Response:** `BUILD_COMPLETE: Wall constructed at D5.`

---

### `demolish` — Destroy Wall _(Engineer Only)_

**Syntax:** `demolish [coord]`  
**Example:** `demolish E5`  
**AP Cost:** 1 AP  
**Engineer Only**

**Mechanics:**

- Engineer destroys a wall at an adjacent coordinate.
- Wall becomes floor (`.`).
- No limit on uses.

**Validation Rules:**

| Check          | Error Code        | Description                |
| -------------- | ----------------- | -------------------------- |
| Unit type      | `NOT_AN_ENGINEER` | Only `[E]` can demolish    |
| Target is wall | `NOT_A_WALL`      | Target must be a wall tile |
| Adjacency      | `NOT_ADJACENT`    | Engineer must be adjacent  |
| AP             | `INSUFFICIENT_AP` | Requires 1 AP              |

**Success Response:** `DEMOLISH_COMPLETE: Wall at E5 destroyed.`

---

### `rally` — Boost Adjacent Allies _(Commander Only)_

**Syntax:** `rally [coord]`  
**Example:** `rally C4`  
**AP Cost:** 1 AP  
**Commander Only**

**Mechanics:**

- Commander rallies the unit at target position.
- Target gains **+1 AP** (added to current AP, not max).
- Target must be an adjacent friendly unit.
- Cannot self-rally.
- Effect lasts for current turn only.

**Validation Rules:**

| Check     | Error Code           | Description                 |
| --------- | -------------------- | --------------------------- |
| Unit type | `NOT_A_COMMANDER`    | Only `[C]` can rally        |
| Adjacency | `NOT_ADJACENT`       | Target must be adjacent     |
| Ally      | `CANNOT_RALLY_ENEMY` | Target must be your unit    |
| Self      | `CANNOT_SELF_RALLY`  | Commander cannot rally self |
| AP        | `INSUFFICIENT_AP`    | Requires 1 AP               |

**Success Response:** `RALLY_SUCCESS: [K] at C4 gained +1 AP (now 3 AP).`
