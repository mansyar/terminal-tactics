# 🗺️ TERMINAL TACTICS — ROADMAP

**Project Status:** 🔄 In Progress  
**GDD Version:** v1.7.0  
**Last Updated:** 2026-05-09

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

## 🚩 Phase 5: Combat & Fog of War ✅

**Goal:** Implement the "Tactical" layer—Combat, Line of Sight, Fog of War, and unit abilities.

### 5.1 Combat Commands

- [x] **Attack (`atk`):** Implement `atk [from] [to]` command.
  - Range validation against unit's RNG stat
  - AP cost (1 AP per attack)
  - Direction update (attacker faces target)
- [x] **Heal (`heal`):** Implement `heal [from] [to]` command.
  - Medic-only restriction
  - Adjacency check (orthogonal only)
  - 15 HP restoration (capped at maxHp)
- [x] **Scan (`scan`):** Implement `scan [coord]` command.
  - Reveal 3×3 area centered on target
  - Scout immunity (Scouts don't appear in scan)
  - Permanent terrain memory
- [x] **Overwatch (`ovw`):** Implement `ovw [coord] [direction]` command.
  - Direction-based watching (N, E, S, W)
  - Auto-trigger on enemy movement
  - Clear on: trigger, turn end, or damage taken

### 5.2 Line of Sight (LoS)

- [x] **Bresenham Algorithm:** Implement LoS check between two tiles.
  - Walls block LoS
  - Units do NOT block LoS
  - Return clear path or `BLOCKED_BY_WALL`
- [x] **Range Check:** Validate attack distance against unit RNG stat.

### 5.3 Directional Damage

- [x] **Position Detection:** Calculate attacker position relative to defender facing.
- [x] **Damage Multipliers:**
  - Frontal: 100%
  - Flank: 125%
  - Backstab: 150%
- [x] **High Ground Bonus:** +1 range, +10 damage when on `^` tile.

### 5.4 Unit Special Abilities

- [x] **Knight Shield:** 20% damage reduction on frontal attacks only.
- [x] **Archer High Ground Mastery:** Apply elevation bonus from `^` tiles.
- [x] **Scout Stealth:**
  - Invisible unless enemy is adjacent
  - Immune to `scan` command
  - Breaks on attack, restores on turn end
- [x] **Medic Heal:** Already covered by `heal` command above.

### 5.5 Vision System (VIS)

- [x] **Per-Unit Vision:** Implement VIS stat (K:3, A:5, S:4, M:3).
- [x] **Shared Vision:** Team-wide fog of war (all units share vision).
- [x] **LoS for Vision:** Walls block vision, not just attacks.

### 5.6 Fog of War Rendering

- [x] **Terrain Memory:** Once seen, terrain type is permanently revealed.
- [x] **Unit Visibility:** Mask enemy units outside combined vision range.
- [x] **Client-Side Masking:** Render unexplored tiles as `?` or dimmed.

### 5.7 Win Condition

- [x] **Elimination Check:** Trigger "Game Over" when all enemy units are destroyed.
- [x] **Winner Assignment:** Set `game.winner` to victorious player.
- [x] **Game Status:** Transition to `status: "finished"`.
- [x] **Victory/Defeat UI:** Display MISSION_COMPLETE or MISSION_FAILED screen.

### Definition of Done

- [x] Comprehensive tests for LoS algorithm.
- [x] Tests for directional damage calculation.
- [x] Tests for unit abilities (Shield, Stealth).
- [x] Visual verification of FoW rendering.
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` (0 errors).

---

## 🚩 Phase 6: Polish & "Juice" ✅

**Goal:** Maximize the "Hacker" aesthetic, add timers, and refine the user experience.

### 6.1 Timers & Session Management

- [x] **Draft Timer:** 90-second countdown during squad selection.
  - Auto-forfeit if not submitted.
- [x] **Turn Timer:** 90-second countdown per turn.
  - Warning at 15 seconds.
  - Auto-end turn on timeout.
- [x] **Disconnect Timeout:** 2-minute grace period for reconnection.
  - Auto-forfeit if exceeded.

### 6.2 Game End Commands

- [x] **Forfeit (`forfeit`):** Immediate surrender.
- [x] **Draw Offer (`offer draw`):** Propose a draw.
- [x] **Draw Accept (`accept draw`):** Accept opponent's draw offer.

### 6.3 Ultimate Mechanics (sudo)

- [x] **Root Access Points (RAP):**
  - +1 RAP per enemy kill
  - +1 RAP every 3 turns survived
  - Max: 3 RAP stored
- [x] **`sudo mv`:** Ignore terrain/collision, unlimited range.
- [x] **`sudo scan`:** Reveal entire map for remainder of turn.
- [x] **`sudo atk`:** Ignore LoS, deal 200% damage.

### 6.4 Kernel Panic Events

- [x] **Random Trigger:** 20% chance after turn 3.
- [x] **SEGFAULT:** All units lose 1 maxAP next turn.
- [x] **OVERCLOCK:** Free movement but 2 HP damage per tile.
- [x] **REBOOT:** Shuffle all units 1 tile in random direction.

### 6.5 Audio & Polish

- [x] **Retro SFX:** Keystrokes, error buzzers, success chimes.
- [x] **Tab Autocomplete:** Smart completion for coordinates and commands.
- [x] **IntelliSense:** Context-aware suggestions for units (friendly/hostile).
- [x] **Chat (`say`):** In-game messaging via CLI.

### 6.6 Squad Builder Enhancements

- [x] **Min Squad Validation:** Require at least 2 units.
- [x] **Max Squad Validation:** Limit to 5 units.
- [x] **Visual Feedback:** Show remaining budget and errors.

### Definition of Done

- [x] Performance audit (Lighthouse score > 90).
- [x] All timers function correctly.
- [x] Kernel Panic events trigger reliably.
- [x] Audio plays without latency issues.
- [x] Bug bash and final polish.
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` (0 errors).

---

## 🚩 Phase 7: Visual & UX Polish ✅

**Goal:** Address the identified visual limitations and improve battlefield readability. All core visual unit enhancements, log visibility system, and grid readability features are now implemented.

### 7.1 Visual Unit Enhancements

- [x] **Health Bars:** Add visual HP bar beneath each unit icon on the grid. [1ca1ca7]
  - Show current HP / max HP ratio
  - Color gradient: Green (>50%) → Yellow (25-50%) → Red (<25%)
- [x] **Enemy Color Coding:** Render hostile units in distinct colors. [43e3289]
  - Friendly: Matrix Green (`#00FF00`)
  - Enemy: Hostile Red (`#FF4444`)
  - Direction arrow, AP dots, glow border, and text all reflect the correct color
- [x] **Direction Indicator:** Arrow glyph (triangle) replacing thick edge line. [908e39d]
  - Triangle pointing in facing direction (N/E/S/W)
  - Maintains fade-in spring animation
- [x] **Stealth Indicator:** Glitch shimmer animation for stealthed Scouts. [dbbb9b0]
  - CSS `@keyframes stealth-shimmer` with horizontal offset jitter
  - Cyan dashed border overlay + cyan drop-shadow glow
  - Replaced old opacity flicker and pulsing dot

### 7.2 Log Visibility System

- [x] **Schema Update:** Add `visibility` field to `logs` table (`"public"` | `"private"`). [38e1d14]
- [x] **Private Logs:** `scan` and `inspect` results visible only to issuing player. [ae9a92f]
- [x] **Filter Logic:** New `getFilteredLogs` Convex query with player-specific filter. [f929eae]
- [x] **UI Update:** Render private logs with italic/dimmed styling + `[PRIVATE]` label. [e80e64f]

### 7.3 Grid Readability Enhancements

- [x] **Tile Coordinates:** Optional `showCoordinates` toggle via `toggle labels` command. [a22687f]
- [x] **Last Move Highlight:** Green overlay at origin/destination tiles. [59b8e92]
- [x] **Attack Range Preview:** Translucent red circles on tiles within unit.rng. [20bd88b]
- [x] **Overwatch Indicator:** Direction-aware SVG cone replacing pulsing border. [20bd88b]
- [x] **Hover Tooltips:** Compact unit stats (type, HP, AP, ATK, RNG) on mouse hover. [20bd88b]

### Definition of Done

- [x] All unit health visible at a glance via health bars.
- [x] Enemy/friendly units visually distinct via color coding.
- [x] Private logs filtered correctly per player via getFilteredLogs query.
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` (97 tests, 0 failures).

---

## 🚩 Phase 8: Session Stability ✅

**Goal:** Robust session management and disconnect handling is now fully implemented.

### 8.1 Disconnect Detection

- [x] **Heartbeat System:** Client sends heartbeat every 10 seconds via `useHeartbeat` hook. [0936afb]
- [x] **Presence Tracking:** Server tracks `lastHeartbeat` timestamps on `games` document. [551f530]
- [x] **Disconnect Detection:** Mark player as "disconnected" after 30s of inactivity via `checkDisconnect`. [551f530]
- [x] **UI Indicator:** "ENEMY_DISCONNECTED" banner with grace countdown + TurnIndicator status. [26c3a24]

### 8.2 Grace Period & Recovery

- [x] **Grace Period:** 2-minute reconnection window via `checkDisconnectGracePeriod`. [476fa59]
- [x] **Timer Pause:** Turn timer pauses when disconnected player's turn is active. [476fa59]
- [x] **State Preservation:** Game state frozen during disconnected player's turn (connected player plays normally). [476fa59]
- [x] **Reconnection Flow:** Heartbeat on reconnect clears `disconnectStartTime`, restores "connected" status. [551f530]
- [x] **Auto-Forfeit:** Disconnected player auto-forfeits after 2-minute grace; dual-disconnect results in draw. [476fa59]

### 8.3 Session Persistence Improvements

- [x] **Browser Tab Handling:** `useHeartbeat` uses Page Visibility API — pauses when hidden, sends immediate heartbeat on reveal. [0936afb]
- [x] **Multi-Tab Prevention:** `TabCoordinator` class via BroadcastChannel API with orphan tab detection (2.5s ping timeout). [2730b73]
- [x] **Graceful Refresh:** `activeGameId` from localStorage, auto re-queries `getGameState` on mount. [2730b73]

### Definition of Done

- [x] Disconnect/reconnect flow tested and stable (223 tests, 87.15% coverage).
- [x] Grace period countdown visible to both players via DisconnectBanner component.
- [x] No state corruption on reconnection (heartbeat clears disconnect timer idempotently).
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 9: Accessibility & Performance ✅

**Goal:** Ensure the game is accessible and performant for all users. All WCAG 2.1 AA accessibility, performance optimizations, and tablet-responsive layout are now implemented. [aea0fc3] [9896008] [88f8df1] [a4d4ca8] [0b20de8] [64e800d] [9b8c94a] [90ba777] [3721ef8]

### 9.1 Performance Audit

- [x] **Performance Baseline:** Recorded initial build metrics (JS: 522 kB, CSS: 33 kB) in `perf-baseline.md`. [aea0fc3]
- [x] **Bundle Optimization:** Removed TanStackRouterDevtools from production builds, deleted unused `Header.tsx`, removed `lucide-react` dependency (tree-shaken). [9896008]
- [x] **Animation Performance:** Replaced SVG `<filter id="glow">` with CSS `drop-shadow()`, added `will-change: transform` to animated elements. [88f8df1]
- [x] **Memory Profiling:** Added `MAX_LOG_ENTRIES` (200) truncation to prevent unbounded log growth in long game sessions. [a4d4ca8]

### 9.2 Accessibility (WCAG 2.1 AA)

- [x] **A11y Infrastructure:** Installed `@testing-library/jest-dom` for accessible DOM matchers (`toHaveAccessibleName`, `toHaveRole`, `toHaveAccessibleDescription`). [0b20de8]
- [x] **Screen Reader Support:** Added `role="grid"`, `role="gridcell"` with `aria-label` on tiles, `aria-label` on unit groups, `aria-live="polite"` on ConsoleHistory, `role="status"` on TurnIndicator, `role="tooltip"` on hover tooltips. [64e800d]
- [x] **Keyboard Navigation:** Exposed `focusInput()` via `useImperativeHandle` on CLIInput, added global Escape key handler, added `tabIndex={0}` to all interactive elements (buttons, squad units, deploy). [9b8c94a]
- [x] **Focus Management:** Added global `:focus-visible` outline styles, skip-to-content link, `id="game-content"` anchor. [90ba777]
- [x] **High Contrast Mode:** `@media (prefers-contrast: more)` CSS with brighter green, solid borders, disabled scanlines and glow. [90ba777]
- [x] **Reduced Motion:** `@media (prefers-reduced-motion: reduce)` disables all CSS animations; `useReducedMotion()` from framer-motion teleports units instead of animating. [90ba777]
- [x] **CLI Autocomplete ARIA:** `role="combobox"`, `role="listbox"`, `role="option"` with `aria-selected`, `aria-autocomplete="list"`, `aria-activedescendant` for screen reader compatibility. [90ba777]

### 9.3 Mobile Responsiveness

- [x] **Mobile Scrollbar:** Changed `scrollbar-hide` to `md:scrollbar-hide` so scrollbar is visible on mobile. [3721ef8]
- [x] **Responsive Grid:** Sidebar collapses below grid on tablet via `flex-col landscape:flex-row md:flex-row`. [3721ef8]
- [x] **Touch Support:** Added `onTouchStart` handlers to SVG tile groups with `onTileTouch` callback prop for coordinate filling. [3721ef8]
- [x] **Virtual Keyboard:** Added `inputMode="text"` to CLI input for optimal mobile keyboard. [3721ef8]
- [x] **Orientation Handling:** Added `landscape:flex-row` Tailwind variant for orientation-aware layout. [3721ef8]

### Definition of Done

- [x] Performance baseline recorded in `perf-baseline.md` (JS: 522 kB → target < baseline + 10%).
- [x] All 260 tests pass (up from 223) with 87%+ coverage.
- [x] Game fully keyboard-navigable and screen-reader compatible.
- [x] High contrast and reduced motion modes supported via CSS media queries.
- [x] Grid renders without horizontal scroll on 768px+ viewports.
- [x] CLI autocomplete is ARIA-compliant (listbox with activedescendant).
- [x] Execute: `bun run type-check; bun run lint; bun run build; bun test` (260 tests, 0 failures).

---

## 🚩 Phase 10: Player Profiles & Match History ⏳

**Goal:** Give players a persistent identity, track their record, and let them review past games. No ranked, no ELO, no leaderboards.

### 10.1 Player Identity

- [ ] **`players` Table:** Create Convex `players` table with:
  - `userId`, `handle`, `gamesPlayed`, `wins`, `losses`, `draws`
- [ ] **Handle Command:** Add `handle <name>` CLI command to set/change display name.
- [ ] **Auto-Handle:** Auto-generate handle as `user_xxxx` on first visit (tied to existing localStorage ID).
- [ ] **In-Game Display:** Show handles in lobby and TurnIndicator instead of "Player 1" / "Player 2".

### 10.2 Stats Tracking

- [ ] **Win/Loss Recording:** Increment counters on `players` document after each finished game.
- [ ] **Draw Handling:** Track draws separately from wins/losses.
- [ ] **Post-Game Screen:** Show final stats (your record, opponent's record, game duration, turns played).
- [ ] **Forfeit Tracking:** Record method of victory (`elimination`, `forfeit`, `disconnect`, `timeout`).

### 10.3 Match History

- [ ] **`matches` Table:** Create Convex `matches` table with:
  - `gameId`, `p1Id`, `p2Id`, `p1Handle`, `p2Handle`, `winner`, `turns`, `duration`, `finishedAt`
- [ ] **Match History Command:** Add `history` CLI command to show last 20 games.
- [ ] **Profile View:** Stats panel visible in lobby showing your record and recent matches.

### 10.4 Quick Wins

- [ ] **Rematch Button:** Post-game button to create a new lobby with the same opponent.

### Definition of Done

- [ ] Player handles display correctly in lobby and game.
- [ ] Win/loss/draw counters update correctly after each game.
- [ ] Match history shows last 20 games with outcome and opponent.
- [ ] Rematch button creates a new lobby with the same opponent.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test`

---

## 🚩 Phase 11: Content Expansion ⏳

**Goal:** Extend gameplay depth with new unit classes and curated map selection.

### 11.1 New Unit Classes

- [ ] **Engineer (`[E]`):**
  - Cost: 200, HP: 60, AP: 3, ATK: 10, RNG: 1, VIS: 3
  - Ability: `build [coord]` — Create a wall tile (1 per game)
  - Ability: `demolish [coord]` — Destroy adjacent wall
- [ ] **Sniper (`[N]`):**
  - Cost: 350, HP: 40, AP: 2, ATK: 40, RNG: 8, VIS: 6
  - Ability: Must remain stationary to attack (no move + attack same turn)
- [ ] **Commander (`[C]`):**
  - Cost: 400, HP: 80, AP: 2, ATK: 20, RNG: 2, VIS: 4
  - Ability: `rally [coord]` — Grant +1 AP to adjacent friendly units

### 11.2 Map Presets

*Note: Random procedural map generation (cellular automata) was implemented in Phase 4 and remains the default. Presets are an alternative selection for the lobby host.*

- [ ] **Preset Maps:** 3 curated 12×12 maps with balanced layouts and distinct playstyles:
  - *The Grid* — Symmetrical, open sightlines (showcase: core tactics)
  - *The Maze* — Tight corridors, heavy cover (showcase: Engineer wall plays)
  - *The Ridge* — High ground focus (showcase: Archer/Sniper elevation)
- [ ] **Map Selection:** Allow lobby host to choose between **Random** (procedural) or a preset before game starts.
- [ ] **Map Preview:** Show preset map layout in lobby before starting (rendered as ASCII/mini-grid).

### Definition of Done

- [ ] All 3 new unit classes playable with correct abilities.
- [ ] At least 3 preset maps available and selectable in lobby.
- [ ] Map preview renders in lobby UI.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test`

---

## 🚩 Phase 12: AI & Achievements ⏳

**Goal:** Enable single-player mode with a rule-based AI opponent and add achievement-based meta-progression.

### 12.1 AI Opponent (Single Player)

- [ ] **Bot as Player:** Allow creating a game where `p2` is a bot ID (`__ai_easy__`, `__ai_medium__`, `__ai_hard__`).
- [ ] **Decision Engine:** Rule-based AI using existing game logic (movement, combat, LoS, heal).
  - Reads game state via Convex queries
  - Evaluates valid actions using pure scoring functions
  - Executes best action via same mutations as human players
- [ ] **Difficulty Levels:**
  - *Easy* — Random valid actions with basic self-preservation (avoid walking into danger)
  - *Medium* — Score-based heuristics (prioritize killing low-HP targets, healing injured allies, advancing toward enemies, using high ground)
  - *Hard* — One-turn lookahead via light MCTS (~50 simulations per decision):
      1. Generate all valid actions for all AI units
      2. For each action, simulate resulting game state using existing pure combat/move functions
      3. Run randomized playouts from that state (opponent responds with Medium-level heuristics)
      4. Pick the action sequence with the highest win-rate across simulations
- [ ] **AI Squad Builder:** Generate a valid AI squad using the point-buy system.

### 12.2 Achievements System

- [ ] **Achievement Schema:** Track unlockable badges on `players` document.
- [ ] **Achievements:**
  - "First Blood" — Win your first game
  - "Tactician" — Win without losing a unit
  - "Comeback Kid" — Win after losing 3+ units
  - "Sudo Master" — Win using a sudo command
  - "Patience" — Win a game lasting 20+ turns
  - "Speed Demon" — Win a game in under 5 turns
- [ ] **Achievement Check:** Evaluate and unlock on game-over flow.
- [ ] **Achievement Display:** Show earned badges on profile page.

### Definition of Done

- [ ] AI opponent playable at all 3 difficulty levels.
- [ ] AI generates valid squad and makes legal moves only.
- [ ] All 6 achievements unlock correctly on matching conditions.
- [ ] Achievements persist and display on player profile.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test`

---

## 🚩 Phase 13: Deployment ⏳

**Goal:** Publish Terminal Tactics on itch.io as a playable web game and share it with the world.

### 13.1 Production Build

- [ ] **Build Script:** Create `build:prod` script for optimized production build (`Vite` minification, tree-shaking, code splitting).
- [ ] **Environment Config:** Separate dev/prod Convex endpoints with environment variables.
- [ ] **Bundle Analysis:** Verify bundle size is reasonable (< 5MB).
- [ ] **Build Verification:** `bun run build` produces a deployable `dist/` bundle with zero errors.

### 13.2 Convex Production Deployment

- [ ] **Deploy Backend:** Run `bunx convex deploy` for production.
- [ ] **Environment Variables:** Configure production secrets (no `.env.local` in prod).
- [ ] **Rate Limiting:** Ensure Convex rate limits are appropriate for public traffic.
- [ ] **Monitoring:** Set up Convex dashboard alerts for errors and usage spikes.

### 13.3 itch.io Deployment

- [ ] **itch.io Account:** Register at itch.io.
- [ ] **Game Page:** Create Terminal Tactics page with description and tags.
- [ ] **Store Assets:**
  - Cover image (630×500)
  - Screenshots (min 3)
  - Animated GIF preview
- [ ] **Upload:** ZIP `dist/` and upload as HTML5 game.
- [ ] **Embed Config:** 1280×720 viewport, fullscreen enabled.
- [ ] **Share Link:** Get the public itch.io URL for portfolio and recruiting.

### 13.4 README Polish

- [ ] **Game Overview:** Replace placeholder README with compelling indie game intro — what it is, why it's cool, one-line hook.
- [ ] **Visuals:** Add gameplay GIF/animated preview at the top (same one used for itch.io).
- [ ] **Quick Start:** Single command to run locally (`bun install && bun run dev`).
- [ ] **Tech Stack Badges:** Add shields.io badges (React, Convex, TypeScript, Tailwind, Bun).
- [ ] **itch.io Link:** Prominent "Play Now" button linking to the live game.
- [ ] **Screenshots:** Embedded screenshots showing the CLI, grid, and combat.
- [ ] **Features List:** Bullet-point the key selling points (deterministic combat, fog of war, 4 unit classes, sudo abilities, etc).

### 13.5 Launch

- [ ] **Analytics:** Add basic page-view or game-start tracking (e.g., Convex event logging) to know if anyone is playing.
- [ ] **Share:** Post the itch.io link on social media (Twitter/X, Reddit r/playmygame, relevant Discord servers).
- [ ] **Portfolio Ready:** The game is playable at a single URL — no install, no friction, no account required.

### Definition of Done

- [ ] `bun run build` produces a deployable bundle.
- [ ] Convex production backend is stable and accessible.
- [ ] Game is playable on itch.io in a browser.
- [ ] itch.io page has cover art, screenshots, and description.
- [ ] No Steam, no desktop wrapper, no press kit, no Discord.

---

## 📊 Progress Summary

| Phase                         | Status      | Completion |
| ----------------------------- | ----------- | ---------- |
| Phase 1: Foundation           | ✅ Complete | 100%       |
| Phase 2: CLI & Grid           | ✅ Complete | 100%       |
| Phase 3: Multiplayer          | ✅ Complete | 100%       |
| Phase 4: Movement             | ✅ Complete | 100%       |
| Phase 5: Combat & FoW         | ✅ Complete | 100%       |
| Phase 6: Polish               | ✅ Complete | 100%       |
| Phase 7: Visual & UX Polish   | ✅ Complete | 100%       |
| Phase 8: Session Stability    | ✅ Complete | 100%       |
| Phase 9: Accessibility & Perf | ✅ Complete | 100%       |
| Phase 10: Player Profiles     | ⏳ Planned  | 0%         |
| Phase 11: Content Expansion   | ⏳ Planned  | 0%         |
| Phase 12: AI & Achievements   | ⏳ Planned  | 0%         |
| Phase 13: Deployment          | ⏳ Planned  | 0%         |

---

## 🎯 Recommended Priority Order

| Priority  | Phase    | Rationale                                                     |
| --------- | -------- | ------------------------------------------------------------- |
| ✅ Done   | Phase 7  | Visual & UX Polish completed — health bars, colors, logs, readability |
| ✅ Done   | Phase 8  | Session stability complete — heartbeat, grace period, reconnection |
| ✅ Done   | Phase 9  | Accessibility and performance complete — ARIA, keyboard nav, contrast, reduced motion, responsive tablet layout |
| 🟡 Medium | Phase 13 | **Launch on itch.io — portfolio-ready URL**                   |
| 🟡 Medium | Phase 10 | Player profiles and match history for identity + retention    |
| 🟢 Low    | Phase 11 | Content expansion extends game lifespan                       |
| 🟢 Low    | Phase 12 | AI opponent for single-player + achievements for retention    |

---

## 🔮 Future Considerations

Ideas for beyond Phase 13:

- **Tournament Mode:** Bracket-based competitive events
- **Clan System:** Team-based social features
- **Custom Unit Editor:** Let players design their own unit stats
- **Workshop:** Community-created maps and mods
- **Cross-Platform:** Native mobile apps (React Native)
- **Monetization:** Cosmetic skins, unit visual variants
- **King of the Hill Mode:** Control point objective with capture mechanics
- **Variable Map Sizes:** 8×8 (Quick) and 16×16 (Large) layout support
- **Spectator Mode:** Shareable links to watch live games
- **Game Replay:** Step-through playback of completed matches
- **Steam Release:** Desktop wrapper (Tauri) + Steamworks integration

---

## 📚 References

| Document                     | Description                     |
| ---------------------------- | ------------------------------- |
| [GDD.md](./GDD.md)           | Game Design Document (overview) |
| [COMMANDS.md](./COMMANDS.md) | Full command specifications     |
| [COMBAT.md](./COMBAT.md)     | Combat system & algorithms      |
