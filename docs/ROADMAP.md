# 🗺️ TERMINAL TACTICS - ROADMAP

**Project Status:** � In Progress
**GDD Version:** v1.2.0

---

## 🚩 Phase 1: Initialization & Foundation

**Goal:** Establish the technical groundwork, including the full-stack framework, database connection, and core UI layout.

### Tasks

- [x] **Project Setup:** Initialize `TanStack Start` project with TypeScript using `bun`.
- [x] **Styling Setup:** Configure Tailwind CSS with the custom "Matrix" palette and "JetBrains Mono" font.
- [x] **Database Setup:** Initialize `Convex` project and set up the schema for `games`, `units`, and `logs`.
- [x] **UI Layout:** Create the basic `GameLayout` component (Main Terminal Window + Sidebar/Status Panel).
- [x] **CRT Effects:** Implement global CSS effects for scanlines, glow, and flicker.

### Acceptance Criteria

- [x] App runs locally without errors.
- [x] Convex dashboard shows the correct schema tables.
- [x] The "Hello World" page looks like a retro terminal (Green text on Black).

### Definition of Done (DoD)

- [x] Code compiles.
- [x] Artifacts (screenshots of the UI) are approved.
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` (Must pass with 0 errors/warnings).

---

## 🚩 Phase 2: The Core Interface (CLI & Grid)

**Goal:** Implement the primary input mechanism (CLI) and the visual representation of the board (Grid).

### Tasks

- [ ] **CLI Component:** Build an interactive input field that accepts text commands.
- [ ] **Command Parser:** Implement a `parseCommand(input)` function to handle `help`, `clear`, and basic syntax validation.
- [ ] **Grid Renderer:** Create an SVG-based 12x12 grid that renders tiles based on a 2D array.
- [ ] **Unit Rendering:** Create basic SVG icons for the 4 unit classes (Knight, Archer, Scout, Medic).
- [ ] **State Sync:** Connect the Grid component to a Convex query to render real-time state.

### Acceptance Criteria

- [ ] Typing into the CLI feels responsive.
- [ ] Submitting a command logs it to the "Console History".
- [ ] The Grid renders correctly based on mock data in Convex.

### DoD

- [ ] Unit tests for the `Command Parser`.
- [ ] Accessible CLI (keyboard navigation works).
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` (Must pass with 0 errors/warnings).

---

## 🚩 Phase 3: Multiplayer Connectivity

**Goal:** Enable two players to join a session, see each other, and take turns.

### Tasks

- [ ] **Lobby System:** Create `createLobby` (generates 4-digit code) and `joinLobby` mutations.
- [ ] **Player Identity:** Implement anonymous auth (store `userId` and `handle` in LocalStorage).
- [ ] **Turn Management:** Implement the core "Game Loop" in Convex (validating whose turn it is).
- [ ] **Public Queue:** Implement a basic "Quick Play" matchmaking function.
- [ ] **Presence:** Show "Player 2 is typing..." or "Player 2 connected" status.

### Acceptance Criteria

- [ ] Player A can create a game and see the code.
- [ ] Player B can join using the code.
- [ ] The game state updates for both players simultaneously.
- [ ] Player B cannot move during Player A's turn.

### DoD

- [ ] Integration tests for the Lobby flow.
- [ ] Reliable state sync (no race conditions).
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` (Must pass with 0 errors/warnings).

---

## 🚩 Phase 4: Gameplay Mechanics (Movement & Stats)

**Goal:** Implementation of the "Point Buy" system, Unit Stats, and Movement logic.

### Tasks

- [ ] **Squad Builder:** Create a UI for drafting units within the 1000 credit limit.
- [ ] **Unit Spawning:** Logic to place drafted units on the board at start.
- [ ] **Movement Logic:** Implement `mv` command validation (AP cost, Wall collision, Boundary checks).
- [ ] **Animation:** Implement "Sliding" animations for unit movement (using `framer-motion` or CSS transitions).
- [ ] **Map Generation:** Implement a basic cellular automata algorithm for 12x12 procedural maps.

### Acceptance Criteria

- [ ] Players can pick their team and start the match.
- [ ] `mv u1 c4` moves the unit correctly and deducts AP.
- [ ] Invalid moves (through walls) are rejected with a "Permission Denied" error.

### DoD

- [ ] Unit tests for Movement Logic and "Point Buy" math.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` (Must pass with 0 errors/warnings).

---

## 🚩 Phase 5: Combat & Fog of War

**Goal:** Implement the "Tactical" layer—Combat, Line of Sight, and Fog of War.

### Tasks

- [ ] **Attack Logic:** Implement `atk` command (Range check, Damage calculation, Environmental bonuses).
- [ ] **Line of Sight (LoS):** Implement a raycasting algorithm to check visibility.
- [ ] **Fog of War:** Mask tiles that are not currently visible (but remember visited terrain).
- [ ] **Sudo Mechanic:** Implement `sudo` command handler (Limit Break logic).
- [ ] **Win Condition:** Trigging "Game Over" when all enemies are dead.

### Acceptance Criteria

- [ ] Units cannot attack through walls.
- [ ] Attacking from behind deals correct bonus damage.
- [ ] Fog of War updates correctly after every move.

### DoD

- [ ] Comprehensive tests for the LoS algorithm.
- [ ] Visual verification of FoW rendering.
- [ ] Execute: `pnpm type-check; pnpm lint; pnpm build; pnpm test` (Must pass with 0 errors/warnings).

---

## 🚩 Phase 6: Polish & "Juice"

**Goal:** Maximize the "Hacker" aesthetic and refine the user experience.

### Tasks

- [ ] **The "Glitch" System:** Implement the "Kernel Panic" cron job (Segfault, Overclock, Reboot).
- [ ] **Audio:** Add simple retro SFX (keystrokes, error buzzers, success chimes).
- [ ] **Tab Autocomplete:** Implement smart completion for unit IDs and coords.
- [ ] **Chat:** Allow players to send text messages via the CLI (`say "gg"`).

### Acceptance Criteria

- [ ] The game feels "alive" (animations, sound, reactive UI).
- [ ] The "Kernel Panic" events happen reliably every 5 turns.

### DoD

- [ ] Performance audit (Lighthouse score > 90).
- [ ] Bug bash and final polish.
- [ ] Execute: `pnpm type-check; pnpm lint; pnpm build; pnpm test` (Must pass with 0 errors/warnings).
