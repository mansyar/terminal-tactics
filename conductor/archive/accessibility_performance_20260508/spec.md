# Track: Accessibility & Performance

## Overview

Phase 9 focuses on ensuring Terminal Tactics is accessible, performant, and playable across devices. This track covers three major areas: (1) Performance Audit & Optimization, (2) WCAG 2.1 AA Accessibility compliance with emphasis on screen reader support and keyboard navigation, and (3) Mobile Responsiveness targeting tablet-sized screens (768px+).

## Functional Requirements

### 9.1 Performance Audit

- **Lighthouse Audit:** Run full Lighthouse performance test. Target: Performance ≥ baseline + 10 points, Accessibility ≥ 95. If CRT effects (flicker, SVG glow filter) block Performance > 90, document the trade-off and consider an optional "performance mode" that disables CRT effects. Baseline must be recorded before any optimizations.
- **Bundle Optimization:** Tree-shake unused dependencies and imports. Remove TanStack Router Devtools from production builds. Replace heavy `lucide-react` icon imports with inline SVGs (only Home, Menu, X used). Remove dead code (unused `Header.tsx` component). Lazy-load heavy components where feasible given the single-route architecture.
- **Animation Performance:** Ensure unit animations (framer-motion) maintain 60fps during gameplay.
- **Memory Profiling:** Check for memory leaks during long games (10+ turns), particularly in log accumulation and Convex subscription cleanup.

### 9.2 Accessibility (WCAG 2.1 AA)

- **Screen Reader Support:** Add ARIA labels and roles to all interactive elements — grid tiles, unit icons, CLI input, buttons, timer displays, modal dialogs.
- **Keyboard Navigation:** Ensure the full game loop (squad builder → gameplay → commands → game over) is playable without a mouse. CLI input must autofocus appropriately; tab order must be logical.
- **Focus Management:** Visible focus indicators (`:focus-visible` outlines) on all interactive controls. Focus must be programmatically moved to relevant areas after game state changes (e.g., after typing a command).
- **High Contrast Mode:** Provide an alternative color scheme (via `prefers-contrast: more`) that increases contrast ratios for all text and UI elements against the black background.
- **Reduced Motion:** Respect `prefers-reduced-motion` system setting. Disable framer-motion animations, CRT flicker, glitch effects, and stealth shimmer when reduced motion is preferred.

### 9.3 Mobile Responsiveness (Tablet-first)

- **Responsive Grid:** The 12x12 game grid must scale proportionally on tablet-sized screens (768px+ viewport width). Use `viewport` units or CSS `clamp()` to ensure the grid fits without horizontal scrolling.
- **Touch Support:** Add touch-to-coordinate CLI filling. Tapping a grid tile appends that tile's coordinate to the current CLI input buffer (e.g., tapping C4 while typing `mv ` fills `mv C4`). If CLI is empty, tapping a tile sets input to `inspect <coord>`. Long-press (500ms) copies coordinate without executing. This maintains CLI-first primacy while providing touch convenience. Ensure 44x44px minimum touch targets on all interactive SVG grid tiles (invisible touch overlay).
- **Virtual Keyboard:** CLI input must work with mobile touch keyboards — avoid `stopPropagation` issues, ensure the input stays visible when the virtual keyboard opens.
- **Orientation Handling:** Support both portrait and landscape orientations on tablets. Layout must adapt gracefully (sidebar may collapse/stack below the grid in portrait).

## Non-Functional Requirements

- Must maintain existing functionality — all 223 tests must continue to pass.
- Must keep the retro terminal aesthetic intact (green-on-black, CRT effects).
- Accessibility changes must not degrade performance.
- Performance optimizations must not change visual behavior.
- Mobile layout must preserve the CLI-first interaction model.
- All accessibility and responsive changes must preserve the retro terminal aesthetic. High contrast and reduced motion variants are the only visual deviations permitted.
- Use `data-testid` attributes on new elements for test stability and visual regression detection.

## Acceptance Criteria

1. Lighthouse Performance Score ≥ baseline + 10 points (baseline recorded in `perf-baseline.md` before changes). CRT effect trade-offs documented if target blocked.
2. Lighthouse Accessibility Score > 95.
3. All interactive elements have appropriate ARIA labels.
4. Full game is playable using keyboard only (no mouse).
5. Visible focus indicators on all controls.
6. `prefers-reduced-motion` disables all CSS and framer-motion animations.
7. `prefers-contrast: more` provides an accessible high-contrast variant.
8. Grid renders without horizontal scroll on 768px viewport.
9. CLI input is usable with mobile touch keyboard.
10. All existing tests pass (`bun run type-check; bun run lint; bun run build; bun test`).

## Out of Scope

- Phone-sized screens (< 768px) — deferred to future phase.
- Native mobile app — this is web-only responsive work.
- Voice control / speech recognition.
- Internationalization / localization.
