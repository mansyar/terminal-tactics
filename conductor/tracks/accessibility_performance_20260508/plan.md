# Implementation Plan: Accessibility & Performance

## Phase 1: Performance Audit & Optimization

### Task 1.0: Performance Baseline & SVG Tooltip Fix
- [x] Write test: Capture initial bundle size (analyze Vite `build` output), import `web-vitals` for programmatic CLS/LCP/FID tracking, record baseline Lighthouse scores. Verify tooltip renders at correct grid-relative position via `data-testid`.
- [x] Implement: Run Lighthouse against current build, record baseline in `perf-baseline.md`. Fix hardcoded `* 100` in `useGameDerivedState.ts` tooltip position to use dynamic tile size derived from SVG `viewBox` scaling.
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `feat(perf): Record baseline metrics and fix SVG tooltip coordinates` [aea0fc3]

### Task 1.1: Bundle Optimization
- [x] Write test: Bundle size tracking test that alerts if production chunk exceeds threshold (baseline + 10%).
- [x] Implement:
  - Remove `TanStackRouterDevtools` from production builds (use `import.meta.env.DEV` guard)
  - Tree-shake `lucide-react` — replace `<Menu>`, `<X>`, `<Home>` with inline SVG icons
  - Remove dead `Header.tsx` component (unused TanStack demo artifact)
  - Tree-shake unused imports across all components
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `feat(perf): Optimize bundle — remove devtools, tree-shake icons, delete dead Header` [9896008]

### Task 1.2: Animation Performance (60fps)
- [x] Write test: Use `requestAnimationFrame` timing to verify framer-motion animations maintain consistent frame rate during unit movement.
- [x] Implement: Profile and optimize framer-motion animations. If SVG `<filter id="glow">` with `feGaussianBlur` blocks 60fps, replace with CSS `drop-shadow()` filter (GPU-accelerated). Add `will-change: transform` to animated elements. Remove layout-triggering properties from animation loops.
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `feat(perf): Optimize animations for 60fps — replace SVG filter with CSS drop-shadow` [88f8df1]

### Task 1.3: Memory Profiling & Leak Fixes
- [x] Write test: Create a memory leak detection test that simulates a 10-turn game and checks for retained DOM nodes / orphaned Convex subscriptions.
- [x] Implement: Profile heap snapshots, clean up Convex subscriptions in `useEffect` return callbacks, truncate in-memory log history beyond 200 entries, fix any identified leaks.
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `feat(perf): Fix memory leaks in long game sessions` [a4d4ca8]

- [~] Task: Conductor - User Manual Verification 'Phase 1: Performance Audit & Optimization' (Protocol in workflow.md)

---

## Phase 2: Accessibility (WCAG 2.1 AA)

### Task 2.0: Foundation — Install A11y Testing Infrastructure
- [x] Write test: Verify `toHaveAccessibleName`, `toHaveRole`, `toHaveAccessibleDescription` matchers work in test suite.
- [x] Implement: Install `@testing-library/jest-dom` for accessible DOM matchers. Add `ConvexProvider` mock updates if needed for a11y test compatibility.
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `chore(a11y): Add accessibility testing infrastructure` [0b20de8]

### Task 2.1: Screen Reader Support — SVG Grid Roles & ARIA
- [x] Write test: Use `@testing-library/react` to query SVG elements by `role` and verify `aria-label` on grid tiles, unit icons, CLI input, buttons, timer displays, modals.
- [x] Implement:
  - Add `role="grid"` to the SVG element in `GridBoard.tsx`
  - Add `role="gridcell"` and `aria-label="Tile {coord}, {terrain}"` to each tile `<g>` group
  - Add `focusable="true"` and `tabindex="-1"` to SVG tiles for keyboard accessibility
  - Add `aria-label="{type} {unitName}, {friendly/enemy}, HP {hp}/{maxHp}"` to unit `<g>` elements
  - Add `aria-live="polite"` to `ConsoleHistory` scroll container for log announcements
  - Add `role="tooltip"` and `aria-live="polite"` to the hover tooltip overlay
  - Add `role="status"` to `TurnIndicator` for turn state announcements
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `feat(a11y): Add ARIA grid roles, unit labels, and live regions` [64e800d]

### Task 2.2: Keyboard Navigation — SVG Focus Chain & CLI Refocus
- [x] Write test: Keyboard-only test that navigates lobby → drafting → gameplay → command execution using Tab/Enter + CLI commands. Assert focus lands on CLI input after each action.
- [x] Implement:
  - Expose `focusInput()` via `useImperativeHandle` on `CLIInput` — parent can call it after game state changes
  - Fix `useEffect` focus logic: change from `[]` deps to tracking a `focusKey` prop that increments on each command dispatch
  - Add `tabindex="0"` to key game elements (squad unit buttons, deploy button, quit button, game-over return button)
  - Ensure Tab order is: CLI → squad buttons (during drafting) → deploy → quit → back to CLI
  - Add `Escape` key handler in `App.tsx` to return focus to CLI from any focused element
- [x] Verify coverage and refactor if needed.
- [x] Commit with message: `feat(a11y): Full keyboard navigation and CLI focus chain` [9b8c94a]

### Task 2.3: Focus Management — Indicators, Modals & Skip Link
- [x] Write test: Verify `:focus-visible` styles exist on all interactive controls. Verify skip link renders off-screen then becomes visible on focus. Verify focus trapping in game-over modal.
- [x] Implement:
  - Add global `:focus-visible` via Tailwind `@layer base`
  - Add skip-to-content link at top of App
  - Add `id="game-content"` to main game content div
- [x] Verify coverage and refactor if needed.
- [x] Commit: `feat(a11y): Focus indicators, high contrast, reduced motion, CLI autocomplete ARIA`

### Task 2.4: High Contrast Mode
- [x] Write test: Verify prefers-contrast: more CSS overrides.
- [x] Implement: High contrast CSS media query.
- [x] Verify coverage and refactor if needed.
- [x] Commit: (included in above)

### Task 2.5: Reduced Motion — Global Animation Guards
- [x] Write test: Verify prefers-reduced-motion CSS and useReducedMotion hook.
- [x] Implement: Reduced motion CSS + framer-motion useReducedMotion.
- [x] Verify coverage and refactor if needed.
- [x] Commit: (included in above)

### Task 2.6: CLI Autocomplete — Screen Reader Compatibility
- [x] Write test: Verify listbox, option, aria-autocomplete attributes.
- [x] Implement: ARIA roles and attributes on suggestions and input.
- [x] Verify coverage and refactor if needed.
- [x] Commit: (included in above) [90ba777]

- [~] Task: Conductor - User Manual Verification 'Phase 2: Accessibility (WCAG 2.1 AA)' (Protocol in workflow.md)

---

## Phase 3: Mobile Responsiveness (Tablet)

### Task 3.0: Foundation — Fix Hardcoded Tile Sizes & Scrollbar
- [ ] Write test: Render GameLayout at 768px viewport; assert no horizontal overflow. Verify tooltip appears at correct grid-relative position (not offset by `* 100` hardcode).
- [ ] Implement:
  - Accept `tileSize` prop in `UnitModel.tsx` — remove hardcoded `x * 100` / `y * 100` in framer-motion animate values
  - Make `ConsoleHistory` scrollbar visible on mobile (remove `scrollbar-hide` on small screens with Tailwind `md:scrollbar-hide`)
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Fix hardcoded tile sizes and add mobile scrollbar`

### Task 3.1: Responsive Grid Scaling
- [ ] Write test: Responsive layout test that renders GameLayout at 768px viewport width and asserts SVG grid fits without horizontal scroll.
- [ ] Implement: Use CSS `clamp()` and viewport units to scale the 12x12 grid proportionally. Make sidebar collapse/stack below the grid at tablet widths using Tailwind responsive breakpoints (`md:`). Ensure the SVG `viewBox` + `aspect-square` combination works correctly at all tablet widths.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Responsive grid scaling for tablet viewports`

### Task 3.2: Touch Support — CLI Coordinate Filling
- [ ] Write test: Simulate `touchstart` on a grid tile and verify CLI input buffer receives the coordinate. Test empty-CLI case sets input to `inspect <coord>`. Test long-press copies without executing.
- [ ] Implement:
  - Add invisible 44x44px touch overlay `<rect>` on each SVG tile group (for reliable touch targeting)
  - On tile touch: append coordinate to CLI input value via shared state callback
  - If CLI is empty: set input to `inspect <coord>`
  - Long-press (500ms `setTimeout` with `clearTimeout` on `touchend`): copy coordinate to clipboard and show brief notification
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Touch-to-coordinate CLI input filling`

### Task 3.3: Virtual Keyboard Compatibility
- [ ] Write test: Test that CLI input element remains in viewport when virtual keyboard opens (using `visualViewport` height change detection).
- [ ] Implement: Listen to `visualViewport` `resize` events. When viewport height shrinks significantly, scroll CLI input into view. Ensure `stopPropagation` on touch events doesn't interfere with keyboard input. Add `inputmode="text"` to CLI `<input>` for optimal mobile keyboard.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Ensure CLI input works with virtual keyboards`

### Task 3.4: Orientation Handling
- [ ] Write test: Test layout renders correctly in both portrait and landscape orientations (mock viewport dimensions for 768px width).
- [ ] Implement: Use CSS media queries (`orientation: portrait` / `orientation: landscape`) to adjust GameLayout. In portrait, stack sidebar below grid. In landscape, use side-by-side layout. Constrain grid to available height using `max-h-[calc(100vh-...)]`.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Support portrait and landscape orientations`

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Mobile Responsiveness (Tablet)' (Protocol in workflow.md)

---

## Definition of Done

- [ ] Lighthouse Performance Score ≥ baseline + 10 points (baseline documented)
- [ ] Lighthouse Accessibility Score > 95
- [ ] All 223+ existing tests pass with no regressions
- [ ] Game fully playable via keyboard only
- [ ] Visible `:focus-visible` indicators on all controls
- [ ] `prefers-reduced-motion` disables ALL CSS animations AND framer-motion animations
- [ ] `prefers-contrast: more` provides accessible high-contrast variant
- [ ] Grid fits without horizontal scroll on 768px viewport
- [ ] CLI autocomplete is screen-reader compatible (ARIA listbox with activedescendant)
- [ ] All changes committed with conventional commit messages
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test`
