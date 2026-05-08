# Implementation Plan: Accessibility & Performance

## Phase 1: Performance Audit & Optimization

### Task 1.1: Lighthouse Audit & Performance Baseline
- [ ] Write test: Create a performance baseline test capturing initial Lighthouse scores and key metrics (LCP, TBT, CLS).
- [ ] Implement: Run Lighthouse audit against the current build and record baseline metrics.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(perf): Record Lighthouse performance baseline`

### Task 1.2: Bundle Optimization
- [ ] Write test: Create a bundle size tracking test (or CI check) that alerts if chunks exceed threshold.
- [ ] Implement: Tree-shake unused dependencies and imports; implement `React.lazy()` + `Suspense` for route-based code splitting.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(perf): Optimize bundle with tree-shaking and lazy loading`

### Task 1.3: Animation Performance (60fps)
- [ ] Write test: Create a performance test using `requestAnimationFrame` timing to verify framer-motion animations stay at 60fps during unit movement.
- [ ] Implement: Profile and optimize framer-motion animations — reduce layout thrashing, use `will-change` hints, ensure GPU-accelerated properties.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(perf): Optimize animations for 60fps`

### Task 1.4: Memory Profiling & Leak Fixes
- [ ] Write test: Create a memory leak detection test that simulates a 10-turn game and checks for retained DOM nodes / orphaned subscriptions.
- [ ] Implement: Profile heap snapshots, clean up Convex subscriptions in `useEffect` return, truncate log history in memory, fix any identified leaks.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(perf): Fix memory leaks in long game sessions`

- [ ] Task: Conductor - User Manual Verification 'Phase 1: Performance Audit & Optimization' (Protocol in workflow.md)

---

## Phase 2: Accessibility (WCAG 2.1 AA)

### Task 2.1: Screen Reader Support (ARIA Labels)
- [ ] Write test: Create accessibility tests using `@testing-library/react` to query elements by role and verify ARIA attributes on grid tiles, unit icons, CLI input, buttons, timer displays, and modals.
- [ ] Implement: Add `aria-label`, `aria-live`, `role` attributes to all interactive elements. Add `role="grid"`, `role="gridcell"` on the game grid. Add `aria-live="polite"` on the log/status area for screen reader announcements.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(a11y): Add ARIA labels and roles to interactive elements`

### Task 2.2: Keyboard Navigation
- [ ] Write test: Create keyboard-only navigation test that simulates full game flow (squad builder → gameplay → commands → game over) via tab and enter keys only.
- [ ] Implement: Ensure CLI input auto-focuses on game state changes. Establish logical tab order through all interactive elements. Add escape-to-return shortcuts. Ensure all commands work without mouse interaction.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(a11y): Implement full keyboard navigation support`

### Task 2.3: Focus Management
- [ ] Write test: Test that focus moves programmatically to relevant elements after game actions (e.g., CLI refocuses after command execution, modals trap focus).
- [ ] Implement: Add visible `:focus-visible` outlines matching the Matrix green theme. Implement focus trapping in modals. Programmatically move focus to CLI input after command execution. Add skip-to-content link.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(a11y): Add focus management and visible focus indicators`

### Task 2.4: High Contrast Mode
- [ ] Write test: Write a CSS/test that verifies `prefers-contrast: more` media query applies overrides (increased contrast ratios, brighter borders, higher opacity text).
- [ ] Implement: Define `@media (prefers-contrast: more)` CSS overrides — ensure text has at least 7:1 contrast ratio, borders are 100% opacity, matrix-green text gets a brighter shade (`#33FF33`), and all interactive elements have stronger outlines.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(a11y): Add high contrast mode support`

### Task 2.5: Reduced Motion Support
- [ ] Write test: Verify that `prefers-reduced-motion: reduce` disables framer-motion animations, CRT flicker, glitch effects, and stealth shimmer. Test by checking that animation CSS classes/React state are suppressed.
- [ ] Implement: Wrap framer-motion `<motion.*>` components with a context that reads `prefers-reduced-motion`. Add CSS `@media (prefers-reduced-motion: reduce)` to disable `@keyframes` for CRT flicker, glitch, and shimmer. Use `useReducedMotion()` from framer-motion.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(a11y): Add reduced motion support for vestibular accessibility`

- [ ] Task: Conductor - User Manual Verification 'Phase 2: Accessibility (WCAG 2.1 AA)' (Protocol in workflow.md)

---

## Phase 3: Mobile Responsiveness (Tablet)

### Task 3.1: Responsive Grid Scaling
- [ ] Write test: Write a responsive layout test that renders the GameLayout component at 768px viewport width and asserts no horizontal overflow.
- [ ] Implement: Use CSS `clamp()` or `viewport` units to scale the 12x12 grid proportionally. Make the sidebar collapse/stack below the grid at tablet widths. Use Tailwind responsive breakpoints (`md:`) to adjust layout.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Make grid responsive for tablet viewports`

### Task 3.2: Touch Support
- [ ] Write test: Simulate touch events (`touchstart`/`touchend`) on grid tiles and verify the correct unit selection or tile info triggers.
- [ ] Implement: Add `onTouchStart`/`onTouchEnd` handlers to grid tiles for tap-to-select. Ensure minimum 44x44px touch targets on all interactive elements. Keep CLI input as primary interaction — touch is supplementary.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Add touch interaction support for grid tiles`

### Task 3.3: Virtual Keyboard Compatibility
- [ ] Write test: Test that the CLI input element remains in viewport when a virtual keyboard opens (using viewport height change detection).
- [ ] Implement: Use `visualViewport` API to detect keyboard open/close. Scroll the CLI input into view when the keyboard appears. Ensure `stopPropagation` doesn't interfere with touch keyboard events.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Ensure CLI input works with virtual keyboards`

### Task 3.4: Orientation Handling
- [ ] Write test: Test layout renders correctly in both portrait and landscape orientations (mock viewport dimensions).
- [ ] Implement: Use CSS media queries (`orientation: portrait` / `orientation: landscape`) to adjust the GameLayout. In portrait, stack sidebar below grid; in landscape, use side-by-side layout. Constrain grid to available height.
- [ ] Verify coverage and refactor if needed.
- [ ] Commit with message: `feat(mobile): Support portrait and landscape orientations`

- [ ] Task: Conductor - User Manual Verification 'Phase 3: Mobile Responsiveness (Tablet)' (Protocol in workflow.md)

---

## Definition of Done

- [ ] Lighthouse Performance Score > 90
- [ ] Lighthouse Accessibility Score > 95
- [ ] All 223+ existing tests pass with no regressions
- [ ] Game fully playable via keyboard only
- [ ] Grid fits without horizontal scroll on 768px viewport
- [ ] All changes committed with conventional commit messages
- [ ] Execute: `bun run type-check; bun run lint; bun run build; bun test`
