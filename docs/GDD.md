# 📑 PROJECT: TERMINAL TACTICS (GDD v1.2.0)

## 1. VISION STATEMENT

**Terminal Tactics** is a minimalist, high-fidelity tactical strategy engine. By removing visual assets, it highlights the technical power of a real-time backend (Convex) and the strategic depth of deterministic, command-driven gameplay.

---

## 2. CORE TECH STACK

- **Framework:** TanStack Start (Full-stack TypeScript framework)
- **Backend/Database:** Convex (Real-time synchronization & ACID transactions)
- **Rendering:** SVG (Scalable Vector Graphics for the grid and units)
- **Styling:** Tailwind CSS + Monospaced Typography (JetBrains Mono)

---

## 3. GAMEPLAY MECHANICS

### A. Game Loop & Win Condition

- **Win Condition:** Elimination (Deathmatch). The game ends when all enemy units are destroyed.
- **Turn Structure:** Strict Turn-Based (Player 1 completes turn -> Player 2 starts). This ensures clarity in the MVP phase.
- **Squad Building:** Point Buy System. Players draft a custom squad using a fixed budget (e.g., 1000 Credits) before the match starts.

### B. The Movement & Map System

- **Grid:** 12x12 Procedurally Generated Map (via Cellular Automata or similar algorithms).
- **Coordinates:** Chess Notation (Columns A-L, Rows 1-12). Example: `C4`.
- **AP (Action Points):** Every unit starts a turn with 2-4 AP.
- **Visuals:** Movements are smooth animations (sliding characters), not instant teleportation.
- **Collision:** Units cannot pass through Walls (`#`) or enemy occupied squares.

### C. The Combat System (Deterministic)

- **No RNG:** Attacks do not "miss" based on chance.
- **Line of Sight (LoS):** Solid walls block attacks.
- **Facing/Orientation:** Units have a front and a back.
  - **Frontal Attack:** 100% Damage.
  - **Side/Flank Attack:** 125% Damage.
  - **Backstab:** 150% Damage.
- **Elevation:** Units on High Ground (`^`) gain +1 Range and +10 Damage.

### D. Fog of War (Dynamic)

- **Terrain Memory:** Once a tile is seen, the _terrain_ (walls/floor) remains mapped forever.
- **Unit Visibility:** Enemy _units_ are only visible if they are currently inside your vision radius. If they move out, they vanish.
- **Stealth:** Some units (Scouts) are invisible unless an enemy is adjacent to them.

---

## 4. THE UNIT CLASSES (SYMBOLS)

| Symbol | Class  | Cost | HP  | AP  | ATK | RNG | Description                                           |
| :----- | :----- | :--- | :-- | :-- | :-- | :-- | :---------------------------------------------------- |
| `[K]`  | Knight | 300  | 100 | 2   | 30  | 1   | High HP; has a frontal shield reducing damage by 20%. |
| `[A]`  | Archer | 200  | 60  | 2   | 20  | 5   | Squishy; long range. Gains range from high ground.    |
| `[S]`  | Scout  | 150  | 50  | 4   | 15  | 2   | Massive movement. Invisible to `scan` commands.       |
| `[M]`  | Medic  | 250  | 70  | 3   | 0   | 2   | Heals adjacent allies for 15 HP per action.           |

---

## 5. INTERFACE & COMMANDS

The primary interaction is through a Command Line Interface (CLI) with **Tab Autocomplete**.

### Core Commands:

- `mv [unitID] [coord]` — Move a unit (e.g., `mv u1 C4`)
- `atk [unitID] [targetID]` — Attack an enemy (e.g., `atk u1 e2`)
- `scan [coord]` — Reveal a 3x3 area for 1 AP.
- `inspect [id]` — View raw stats and status effects of a unit.
- `ovw [unitID]` — Set unit to Overwatch (fires if enemy enters range during their turn).

### Ultimate Mechanics:

- `sudo [command]` — A "Limit Break" mechanic. Costs "Root Access" points (earned by kills/turns).
  - `sudo mv`: Unit ignores terrain costs and collision for this move.
  - `sudo scan`: Reveals the entire map for 1 turn.

---

## 6. GAME MODES & INFRASTRUCTURE

### A. Matchmaking

- **Lobby System:** Players can create a private lobby and share a 4-digit code (e.g., `X7Z2`).
- **Public Queue:** Basic "Quick Play" button that pairs available players.

### B. Accounts & Progression

- **Auth:** Anonymous for MVP. Players provide a temporary handle (e.g., `User_99`).
- **Persistence:** LocalStorage used to remember settings and last played handle.

### C. Art Direction

- **Theme:** "Matrix" / Retro-Cyberpunk.
- **Palette:** High-contrast Green (`#00FF00`, `#00CC00`) on Deep Black (`#0A0A0A`).
- **UI Elements:** CRT Scanlines, slight chromatic aberration glich effects on UI interactions.

---

## 7. THE EVENT LOOP (GLITCHES)

Every 5 turns, a global "Kernel Panic" occurs, triggered by a Convex Cron Job:

1.  **SEGFAULT:** All units lose 1 AP for the next turn.
2.  **OVERCLOCK:** Movement range doubles, but units take 2 HP damage per step.
3.  **REBOOT:** All unit positions are shuffled by 1 tile in a random direction.

---

## 8. CONVEX DATABASE SCHEMA (DRAFT)

- **`games`**: `id, turnNum, currentPlayer, status, environmentFlags, mapData, public (bool)`
- **`units`**: `id, gameId, ownerId, type, hp, ap, x, y, direction`
- **`logs`**: `id, gameId, timestamp, commandString, result`

---

## 9. IMPACT VS. EFFORT

- **Effort:** Medium (Backend logic for LoS and Pathfinding is the primary hurdle).
- **Impact:** High (Unique "hacker" aesthetic, highly performant, excellent portfolio piece).
