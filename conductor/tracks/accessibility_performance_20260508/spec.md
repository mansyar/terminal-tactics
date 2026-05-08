# Track: Accessibility & Performance

## Overview

Phase 9 focuses on ensuring Terminal Tactics is accessible, performant, and playable across devices. This track covers three major areas: (1) Performance Audit & Optimization, (2) WCAG 2.1 AA Accessibility compliance with emphasis on screen reader support and keyboard navigation, and (3) Mobile Responsiveness targeting tablet-sized screens (768px+).

## Functional Requirements

### 9.1 Performance Audit

- **Lighthouse Audit:** Run full Lighthouse performance test targeting Performance > 90 and Accessibility > 95.
- **Bundle Optimization:** Tree-shake unused code, implement lazy loading for route-based and heavy components.
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
- **Touch Support:** Add tap-to-select for grid tiles and unit interactions. The CLI input must still be the primary interaction, but touch-friendly target sizes (44x44px minimum) for any clickable elements.
- **Virtual Keyboard:** CLI input must work with mobile touch keyboards — avoid `stopPropagation` issues, ensure the input stays visible when the virtual keyboard opens.
- **Orientation Handling:** Support both portrait and landscape orientations on tablets. Layout must adapt gracefully (sidebar may collapse/stack below the grid in portrait).

## Non-Functional Requirements

- Must maintain existing functionality — all 223 tests must continue to pass.
- Must keep the retro terminal aesthetic intact (green-on-black, CRT effects).
- Accessibility changes must not degrade performance.
- Performance optimizations must not change visual behavior.
- Mobile layout must preserve the CLI-first interaction model.

## Acceptance Criteria

1. Lighthouse Performance Score > 90.
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
