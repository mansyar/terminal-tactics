# 🗺️ TERMINAL TACTICS — ROADMAP

**Project Status:** 🔄 In Progress  
**GDD Version:** v1.6.0  
**Last Updated:** 2026-01-15

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
- [ ] **Disconnect Timeout:** 2-minute grace period for reconnection. _(Deferred)_
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

## � Phase 7: Visual & UX Polish ⏳

**Goal:** Address the identified visual limitations and improve battlefield readability.

### 7.1 Visual Unit Enhancements

- [ ] **Health Bars:** Add visual HP bar beneath each unit icon on the grid.
  - Show current HP / max HP ratio
  - Color gradient: Green (>50%) → Yellow (25-50%) → Red (<25%)
- [ ] **Enemy Color Coding:** Render hostile units in distinct colors.
  - Friendly: Matrix Green (`#00FF00`)
  - Enemy: Hostile Red (`#FF4444`) or Amber (`#FF9900`)
  - Neutral/Unknown: Dim Gray
- [ ] **Direction Indicator:** Visual arrow or facing indicator on unit tiles.
- [ ] **Stealth Indicator:** Visual shimmer effect for stealthed Scouts.

### 7.2 Log Visibility System

- [ ] **Schema Update:** Add `visibility` field to `logs` table (`"public"` | `"private"`).
- [ ] **Private Logs:** `scan` and `inspect` results visible only to issuing player.
- [ ] **Filter Logic:** Query logs with player-specific visibility filter.
- [ ] **UI Update:** Render private logs with distinct styling (e.g., dimmed or italicized).

### 7.3 Grid Readability Enhancements

- [ ] **Tile Coordinates:** Optional toggle to show coordinate labels on grid edges.
- [ ] **Last Move Highlight:** Highlight the tile a unit just moved from/to.
- [ ] **Attack Range Preview:** Visual overlay when hovering over a unit.
- [ ] **Overwatch Indicator:** Show direction cone for units on overwatch.
- [ ] **Hover Tooltips:** Quick unit stats on mouse hover (non-CLI users).

### Definition of Done

- [ ] All unit health visible at a glance.
- [ ] Enemy/friendly units visually distinct.
- [ ] Private logs filtered correctly per player.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 8: Session Stability ⏳

**Goal:** Implement robust session management and disconnect handling.

### 8.1 Disconnect Detection

- [ ] **Heartbeat System:** Client sends heartbeat every 10 seconds.
- [ ] **Presence Tracking:** Server tracks last heartbeat timestamp per player.
- [ ] **Disconnect Detection:** Mark player as "disconnected" if no heartbeat for 30 seconds.
- [ ] **UI Indicator:** Show "Opponent disconnected" warning message.

### 8.2 Grace Period & Recovery

- [ ] **Grace Period:** 2-minute reconnection window.
- [ ] **Timer Pause:** Turn timer pauses during opponent disconnection.
- [ ] **State Preservation:** Game state frozen during grace period.
- [ ] **Reconnection Flow:** Seamless rejoin with state restoration.
- [ ] **Auto-Forfeit:** Trigger forfeit if grace period expires.

### 8.3 Session Persistence Improvements

- [ ] **Browser Tab Handling:** Detect tab visibility changes.
- [ ] **Multi-Tab Prevention:** Warn or block duplicate game sessions.
- [ ] **Graceful Refresh:** Maintain session state through page refresh.

### Definition of Done

- [ ] Disconnect/reconnect flow tested and stable.
- [ ] Grace period countdown visible to both players.
- [ ] No state corruption on reconnection.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 9: Accessibility & Performance ⏳

**Goal:** Ensure the game is accessible and performant for all users.

### 9.1 Performance Audit

- [ ] **Lighthouse Audit:** Run full Lighthouse performance test.
  - Target: Performance > 90, Accessibility > 95
- [ ] **Bundle Optimization:** Tree-shake unused code, lazy load components.
- [ ] **Animation Performance:** Ensure 60fps during unit animations.
- [ ] **Memory Profiling:** Check for memory leaks in long games.

### 9.2 Accessibility (WCAG 2.1 AA)

- [ ] **Screen Reader Support:** ARIA labels for all interactive elements.
- [ ] **Keyboard Navigation:** Full game playable without mouse.
- [ ] **Focus Management:** Visible focus indicators on all controls.
- [ ] **High Contrast Mode:** Alternative color scheme for visibility.
- [ ] **Reduced Motion:** Disable animations on system preference.

### 9.3 Mobile Responsiveness

- [ ] **Responsive Grid:** Grid scales appropriately on smaller screens.
- [ ] **Touch Support:** Tap to select units and tiles.
- [ ] **Virtual Keyboard:** CLI input works with mobile keyboards.
- [ ] **Orientation Handling:** Support both portrait and landscape.

### Definition of Done

- [ ] Lighthouse Performance Score > 90.
- [ ] Lighthouse Accessibility Score > 95.
- [ ] Game playable on tablet-sized screens.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 10: Competitive Features ⏳

**Goal:** Add ranked play and statistical tracking for competitive players.

### 10.1 Player Profiles

- [ ] **Profile Schema:** Create `players` table with persistent stats.
  - `userId`, `handle`, `gamesPlayed`, `wins`, `losses`, `elo`
- [ ] **Profile Page:** View own stats and match history.
- [ ] **Handle System:** Allow players to set a custom handle (3-15 chars).
- [ ] **Handle Uniqueness:** Ensure no duplicate handles.

### 10.2 ELO Rating System

- [ ] **Initial ELO:** New players start at 1200.
- [ ] **ELO Calculation:** Standard K=32 ELO formula.
- [ ] **Ranked Queue:** Separate "Ranked" matchmaking queue.
- [ ] **ELO Display:** Show rating in lobby and game UI.
- [ ] **Rank Tiers:** Bronze, Silver, Gold, Platinum, Diamond.

### 10.3 Leaderboard

- [ ] **Global Leaderboard:** Top 100 players by ELO.
- [ ] **Weekly Leaderboard:** Reset weekly with rewards tracking.
- [ ] **Personal Rank:** Show your current position.

### 10.4 Match History

- [ ] **Game Archive:** Store completed games with summary data.
- [ ] **Match List:** View past 50 games with outcome and opponent.
- [ ] **Stats Breakdown:** Track unit kills, deaths, damage dealt.

### Definition of Done

- [ ] ELO system calculating correctly.
- [ ] Leaderboard displaying top players.
- [ ] Match history viewable per player.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 11: Content Expansion ⏳

**Goal:** Extend gameplay depth with new units and map options.

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

### 11.2 Map Customization

- [ ] **Preset Maps:** 5 curated competitive maps with balanced layouts.
- [ ] **Map Size Options:** 8×8 (Quick), 12×12 (Standard), 16×16 (Large).
- [ ] **Map Selection:** Allow lobby host to choose map before game.
- [ ] **Map Preview:** Show map layout in lobby before starting.

### 11.3 Game Mode: King of the Hill

- [ ] **Control Point:** Central 2×2 area marked as objective.
- [ ] **Capture Mechanic:** Own the point by having only your units inside.
- [ ] **Win Condition:** Control for 5 consecutive turns to win.
- [ ] **Alternative Victory:** Elimination still valid.

### Definition of Done

- [ ] At least 2 new unit classes playable and balanced.
- [ ] At least 3 preset maps available.
- [ ] King of the Hill mode functional.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 12: Advanced Features ⏳

**Goal:** Add spectating, replays, and AI opponent for enhanced experience.

### 12.1 Spectator Mode

- [ ] **Spectate Link:** Generate shareable link to watch live game.
- [ ] **Spectator View:** Full visibility of both sides (no FoW).
- [ ] **Spectator Count:** Show number of viewers to players.
- [ ] **Spectator Chat:** Separate chat channel for spectators.

### 12.2 Game Replay

- [ ] **Replay Recording:** Store all commands and state changes.
- [ ] **Replay Viewer:** Step-through replay of any completed match.
- [ ] **Playback Controls:** Play, pause, speed up, rewind.
- [ ] **Share Link:** Generate shareable link to specific replay.

### 12.3 AI Opponent (Single Player)

- [ ] **Basic AI:** Rule-based opponent for practice.
  - Prioritizes attacking low-HP targets
  - Moves toward nearest enemy if out of range
  - Uses heal when allies are injured
- [ ] **Difficulty Levels:** Easy (random), Medium (smart), Hard (optimal).
- [ ] **Offline Play:** Play against AI without network connection.

### 12.4 Achievements System

- [ ] **Achievement Schema:** Track unlockable badges.
- [ ] **Achievements:**
  - "First Blood" — Win your first game
  - "Tactician" — Win without losing a unit
  - "Comeback Kid" — Win after losing 3+ units
  - "Sudo Master" — Win using a sudo command
  - "Patience" — Win a game lasting 20+ turns
  - "Speed Demon" — Win a game in under 5 turns
- [ ] **Achievement Display:** Show earned badges on profile.

### Definition of Done

- [ ] Spectator mode functional for live games.
- [ ] Replay viewer working for completed games.
- [ ] Basic AI opponent playable.
- [ ] At least 10 achievements implemented.
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test` ✅

---

## 🚩 Phase 13: Deployment & Distribution ⏳

**Goal:** Publish Terminal Tactics to gaming platforms, starting with itch.io and optionally Steam.

### 13.1 Production Build Setup

- [ ] **Build Script:** Create `build:prod` script for optimized production build.
- [ ] **Environment Config:** Separate dev/prod Convex endpoints.
- [ ] **Asset Optimization:** Compress images, minify CSS/JS.
- [ ] **Bundle Analysis:** Ensure bundle size is reasonable (<5MB).

### 13.2 Convex Production Deployment

- [ ] **Deploy Backend:** Run `bunx convex deploy` for production.
- [ ] **Environment Variables:** Configure production secrets.
- [ ] **Rate Limiting:** Ensure production rate limits are appropriate.
- [ ] **Monitoring:** Set up Convex dashboard alerts.

### 13.3 itch.io Web Deployment

- [ ] **Create itch.io Account:** Register at itch.io.
- [ ] **Game Page Setup:** Create Terminal Tactics game page.
- [ ] **Store Assets:**
  - Cover image (630×500)
  - Banner (960×540)
  - Screenshots (min 3)
  - GIF preview
- [ ] **Upload Build:** ZIP `dist/` and upload as HTML5 game.
- [ ] **Embed Configuration:**
  - Viewport: 1280×720 or 1920×1080
  - Enable fullscreen
  - Set appropriate embed options
- [ ] **Description & Tags:** Write compelling game description.
- [ ] **Butler Setup:** Configure itch.io butler for automated deployments.

### 13.4 Steam Desktop Build (Optional)

- [ ] **Desktop Wrapper:** Integrate Tauri or Electron.
- [ ] **Steam Partner Account:** Register at Steamworks ($100 fee).
- [ ] **Steamworks SDK:** Integrate for achievements/overlay.
- [ ] **Build Executables:** Windows (.exe), Mac (.dmg), Linux (.AppImage).
- [ ] **Steam Store Assets:**
  - Capsule images (various sizes)
  - Screenshots
  - Trailer video
- [ ] **Submit for Review:** Steam review process (2-5 days).

### 13.5 Marketing & Launch

- [ ] **Landing Page:** Simple website with game info + links.
- [ ] **Social Media:** Twitter/X, Reddit posts for launch.
- [ ] **Press Kit:** Screenshots, description, logos for press.
- [ ] **Community:** Discord server or subreddit.
- [ ] **Analytics:** Track player counts, session length.

### Definition of Done

- [ ] Game playable on itch.io in browser.
- [ ] Convex production backend stable.
- [ ] At least 10 players have tested the public build.
- [ ] Store page has all required assets.
- [ ] Execute: `bun run build` produces deployable bundle.

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
| Phase 7: Visual & UX Polish   | ⏳ Planned  | 0%         |
| Phase 8: Session Stability    | ⏳ Planned  | 0%         |
| Phase 9: Accessibility & Perf | ⏳ Planned  | 0%         |
| Phase 10: Competitive         | ⏳ Planned  | 0%         |
| Phase 11: Content Expansion   | ⏳ Planned  | 0%         |
| Phase 12: Advanced Features   | ⏳ Planned  | 0%         |
| Phase 13: Deployment          | ⏳ Planned  | 0%         |

---

## 🎯 Recommended Priority Order

| Priority  | Phase    | Rationale                                                     |
| --------- | -------- | ------------------------------------------------------------- |
| 🔴 High   | Phase 7  | Addresses known visual limitations affecting gameplay clarity |
| 🔴 High   | Phase 8  | Disconnect handling critical for multiplayer stability        |
| 🟡 Medium | Phase 9  | Accessibility and performance for broader audience            |
| 🟡 Medium | Phase 13 | **Early launch on itch.io for player feedback**               |
| 🟡 Medium | Phase 10 | Competitive features for player retention                     |
| 🟢 Low    | Phase 11 | Content expansion extends game lifespan                       |
| 🟢 Low    | Phase 12 | Advanced features for long-term engagement                    |

---

## 🔮 Future Considerations

Ideas for beyond Phase 13:

- **Tournament Mode:** Bracket-based competitive events
- **Clan System:** Team-based social features
- **Custom Unit Editor:** Let players design their own unit stats
- **Workshop:** Community-created maps and mods
- **Cross-Platform:** Native mobile apps (React Native)
- **Monetization:** Cosmetic skins, unit visual variants

---

## 📚 References

| Document                     | Description                     |
| ---------------------------- | ------------------------------- |
| [GDD.md](./GDD.md)           | Game Design Document (overview) |
| [COMMANDS.md](./COMMANDS.md) | Full command specifications     |
| [COMBAT.md](./COMBAT.md)     | Combat system & algorithms      |
