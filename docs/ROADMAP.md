# 🗺️ TERMINAL TACTICS — ROADMAP

**Project Status:** 🔄 In Progress  
**GDD Version:** v1.6.0  
**Last Updated:** 2026-01-14

---

## 🚩 Phase 1: Initialization & Foundation ✅

**Goal:** Establish the technical groundwork, including the full-stack framework, database connection, and core UI layout.

### Tasks

- [x] **Project Setup:** Initialize `Vite + React` project with TypeScript using `bun`.
- [x] **Styling Setup:** Configure Tailwind CSS with the custom "Matrix" palette and "JetBrains Mono" font.
- [x] **Database Setup:** Initialize `Convex` project and set up the schema for `games`, `units`, and `logs`.
- [x] **UI Layout:** Create the basic `GameLayout` component (Main Terminal Window + Sidebar/Status Panel).
- [x] **CRT Effects:** Implement global CSS effects for scanlines, glow, and flicker.

### Definition of Done

- [x] App runs locally without errors.
- [x] Convex dashboard shows the correct schema tables.
- [x] The "Hello World" page looks like a retro terminal (Green text on Black).
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 2: The Core Interface (CLI & Grid) ✅

**Goal:** Implement the primary input mechanism (CLI) and the visual representation of the board (Grid).

### Tasks

- [x] **CLI Component:** Build an interactive input field that accepts text commands.
- [x] **Command Parser:** Implement a `parseCommand(input)` function to handle `help`, `clear`, and basic syntax validation.
- [x] **Grid Renderer:** Create an SVG-based 12x12 grid that renders tiles based on a 2D array.
- [x] **Unit Rendering:** Create basic SVG icons for the 4 unit classes (Knight, Archer, Scout, Medic).
- [x] **State Sync:** Connect the Grid component to a Convex query to render real-time state.

### Definition of Done

- [x] Unit tests for the `Command Parser`.
- [x] Accessible CLI (keyboard navigation works).
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 3: Multiplayer Connectivity ✅

**Goal:** Enable two players to join a session, see each other, and take turns.

### Tasks

- [x] **Lobby System:** Create `createLobby` (generates 4-digit code) and `joinLobby` mutations.
- [x] **Player Identity:** Implement anonymous auth (store `userId` and `handle` in LocalStorage).
- [x] **Turn Management:** Implement the core "Game Loop" in Convex (validating whose turn it is).
- [x] **Public Queue:** Implement a basic "Quick Play" matchmaking function.
- [x] **Presence:** Show "Player 2 is typing..." or "Player 2 connected" status.

### Definition of Done

- [x] Integration tests for the Lobby flow.
- [x] Reliable state sync (no race conditions).
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 4: Gameplay Mechanics (Movement & Stats) ✅

**Goal:** Implementation of the "Point Buy" system, Unit Stats, and Movement logic.

### Tasks

- [x] **Squad Builder:** Create a UI for drafting units within the 1000 credit limit.
- [x] **Unit Spawning:** Logic to place drafted units on the board at start.
- [x] **Movement Logic:** Implement `mv` command validation (AP cost, Wall collision, Boundary checks).
- [x] **Animation:** Implement "Sliding" animations for unit movement (using `framer-motion`).
- [x] **Map Generation:** Implement a basic cellular automata algorithm for 12x12 procedural maps.
- [x] **AP Display:** Visual AP tracking (dots on unit tiles) and `inspect` command for detailed stats.

### Definition of Done

- [x] Unit tests for Movement Logic and "Point Buy" math.
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 5: Combat & Fog of War 🔄

**Goal:** Implement the "Tactical" layer—Combat, Line of Sight, Fog of War, and unit abilities.

### 5.1 Combat Commands

- [ ] **Attack (`atk`):** Implement `atk [from] [to]` command.
  - Range validation against unit's RNG stat
  - AP cost (1 AP per attack)
  - Direction update (attacker faces target)
- [ ] **Heal (`heal`):** Implement `heal [from] [to]` command.
  - Medic-only restriction
  - Adjacency check (orthogonal only)
  - 15 HP restoration (capped at maxHp)
- [ ] **Scan (`scan`):** Implement `scan [coord]` command.
  - Reveal 3×3 area centered on target
  - Scout immunity (Scouts don't appear in scan)
  - Permanent terrain memory
- [ ] **Overwatch (`ovw`):** Implement `ovw [coord] [direction]` command.
  - Direction-based watching (N, E, S, W)
  - Auto-trigger on enemy movement
  - Clear on: trigger, turn end, or damage taken

### 5.2 Line of Sight (LoS)

- [ ] **Bresenham Algorithm:** Implement LoS check between two tiles.
  - Walls block LoS
  - Units do NOT block LoS
  - Return clear path or `BLOCKED_BY_WALL`
- [ ] **Range Check:** Validate attack distance against unit RNG stat.

### 5.3 Directional Damage

- [ ] **Position Detection:** Calculate attacker position relative to defender facing.
- [ ] **Damage Multipliers:**
  - Frontal: 100%
  - Flank: 125%
  - Backstab: 150%
- [ ] **High Ground Bonus:** +1 range, +10 damage when on `^` tile.

### 5.4 Unit Special Abilities

- [ ] **Knight Shield:** 20% damage reduction on frontal attacks only.
- [ ] **Archer High Ground Mastery:** Apply elevation bonus from `^` tiles.
- [ ] **Scout Stealth:**
  - Invisible unless enemy is adjacent
  - Immune to `scan` command
  - Breaks on attack, restores on turn end
- [ ] **Medic Heal:** Already covered by `heal` command above.

### 5.5 Vision System (VIS)

- [ ] **Per-Unit Vision:** Implement VIS stat (K:3, A:5, S:4, M:3).
- [ ] **Shared Vision:** Team-wide fog of war (all units share vision).
- [ ] **LoS for Vision:** Walls block vision, not just attacks.

### 5.6 Fog of War Rendering

- [ ] **Terrain Memory:** Once seen, terrain type is permanently revealed.
- [ ] **Unit Visibility:** Mask enemy units outside combined vision range.
- [ ] **Client-Side Masking:** Render unexplored tiles as `?` or dimmed.

### 5.7 Win Condition

- [ ] **Elimination Check:** Trigger "Game Over" when all enemy units are destroyed.
- [ ] **Winner Assignment:** Set `game.winner` to victorious player.
- [ ] **Game Status:** Transition to `status: "finished"`.

### Definition of Done

- [ ] Comprehensive tests for LoS algorithm.
- [ ] Tests for directional damage calculation.
- [ ] Tests for unit abilities (Shield, Stealth).
- [ ] Visual verification of FoW rendering.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` (0 errors).

---

## 🚩 Phase 6: Polish & "Juice" 📋

**Goal:** Maximize the "Hacker" aesthetic, add timers, and refine the user experience.

### 6.1 Timers & Session Management

- [ ] **Draft Timer:** 90-second countdown during squad selection.
  - Auto-forfeit if not submitted.
- [ ] **Turn Timer:** 90-second countdown per turn.
  - Warning at 15 seconds.
  - Auto-end turn on timeout.
- [ ] **Disconnect Timeout:** 2-minute grace period for reconnection.
  - Auto-forfeit if exceeded.

### 6.2 Game End Commands

- [ ] **Forfeit (`forfeit`):** Immediate surrender.
- [ ] **Draw Offer (`offer draw`):** Propose a draw.
- [ ] **Draw Accept (`accept draw`):** Accept opponent's draw offer.

### 6.3 Ultimate Mechanics (sudo)

- [ ] **Root Access Points (RAP):**
  - +1 RAP per enemy kill
  - +1 RAP every 3 turns survived
  - Max: 3 RAP stored
- [ ] **`sudo mv`:** Ignore terrain/collision, unlimited range.
- [ ] **`sudo scan`:** Reveal entire map for remainder of turn.
- [ ] **`sudo atk`:** Ignore LoS, deal 200% damage.

### 6.4 Kernel Panic Events

- [ ] **Convex Cron Job:** Trigger every 5 turns (global turn count).
- [ ] **SEGFAULT:** All units lose 1 AP next turn.
- [ ] **OVERCLOCK:** 2× movement range, 2 HP damage per step.
- [ ] **REBOOT:** Shuffle all units 1 tile in random direction.

### 6.5 Audio & Polish

- [ ] **Retro SFX:** Keystrokes, error buzzers, success chimes.
- [ ] **Tab Autocomplete:** Smart completion for coordinates and commands.
- [ ] **Chat (`say`):** In-game messaging via CLI.

### 6.6 Squad Builder Enhancements

- [ ] **Min Squad Validation:** Require at least 2 units.
- [ ] **Max Squad Validation:** Limit to 5 units.
- [ ] **Visual Feedback:** Show remaining budget and errors.

### Definition of Done

- [ ] Performance audit (Lighthouse score > 90).
- [ ] All timers function correctly.
- [ ] Kernel Panic events trigger reliably.
- [ ] Audio plays without latency issues.
- [ ] Bug bash and final polish.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` (0 errors).

---

## 📊 Progress Summary

| Phase                 | Status         | Completion |
| --------------------- | -------------- | ---------- |
| Phase 1: Foundation   | ✅ Complete    | 100%       |
| Phase 2: CLI & Grid   | ✅ Complete    | 100%       |
| Phase 3: Multiplayer  | ✅ Complete    | 100%       |
| Phase 4: Movement     | ✅ Complete    | 100%       |
| Phase 5: Combat & FoW | 🔄 In Progress | 0%         |
| Phase 6: Polish       | 📋 Planned     | 0%         |

---

## 📚 References

| Document                     | Description                     |
| ---------------------------- | ------------------------------- |
| [GDD.md](./GDD.md)           | Game Design Document (overview) |
| [COMMANDS.md](./COMMANDS.md) | Full command specifications     |
| [COMBAT.md](./COMBAT.md)     | Combat system & algorithms      |
