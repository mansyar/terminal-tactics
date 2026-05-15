# Track: Deployment (Phase 13)

## Overview

Publish Terminal Tactics on itch.io as a playable web game. This track covers production build optimization, Convex production backend deployment, itch.io store page setup with store assets, README polish, analytics tracking, and launch.

## Type

Feature

## Functional Requirements

### 13.1 Production Build

- Create a `build:prod` npm script that runs an optimized production build (Vite minification, tree-shaking, code splitting).
- Create a separate `zip` script that bundles the `dist/` output into `dist.zip` for itch.io upload.
- Configure environment variables to separate dev/prod Convex endpoints.
- Verify bundle size is reasonable (< 5MB).
- Verify `bun run build` produces a deployable `dist/` bundle with zero errors.

### 13.2 Convex Production Deployment

- Set up a Convex production project.
- Deploy the backend using `bunx convex deploy`.
- Configure production environment variables (no `.env.local` in prod).
- Ensure Convex rate limits are appropriate for public traffic.
- Set up Convex dashboard monitoring for errors and usage spikes.

### 13.3 Analytics Tracking

- Implement a lightweight Convex event logging system for basic analytics.
- Track: page views (app loaded), game starts (game state transitions to "playing"), and game completions.
- Store analytics events in a new `analytics_events` Convex table.
- No external analytics dependencies — fits the minimalist terminal theme.

### 13.4 itch.io Deployment

- Create an itch.io game page for Terminal Tactics (manual step requiring user account).
- Provide instructions for creating store assets:
  - Cover image (630×500)
  - Screenshots (min 3) — captured manually from running game
  - Animated GIF preview — captured manually
- Provide upload instructions: ZIP `dist/` and upload as HTML5 game.
- Embed configuration: 1280×720 viewport, fullscreen enabled.
- Deliver the public itch.io URL for portfolio and recruiting.

### 13.5 README Polish

- Update README.md with a compelling indie game intro.
- Add tech stack badges (React, Convex, TypeScript, Tailwind, Bun) via shields.io.
- Add a prominent "Play Now" button linking to the live itch.io URL.
- Add Quick Start section: single command to run locally (`bun install && bun run dev`).
- Add a features list: deterministic combat, fog of war, 7 unit classes, sudo abilities, AI opponent, achievements, etc.
- Add embedded screenshots showing the CLI, grid, and combat.

### 13.6 Launch

- Post the itch.io link on social media (manual — instructions provided).
- Portfolio ready: game is playable at a single URL with no install, no friction, no account required.

## Acceptance Criteria

- [ ] `bun run build:prod` produces a deployable `dist/` bundle with zero errors.
- [ ] Bundle size is verified and under 5MB.
- [ ] Convex production backend is deployed, stable, and accessible.
- [ ] Dev/prod environment variables are configured correctly.
- [ ] Analytics events are logged to Convex on page load and game start.
- [ ] itch.io page has cover art, screenshots, description, and is publicly accessible.
- [ ] README is polished with badges, screenshots, features list, and Play Now link.
- [ ] Game is playable on itch.io in a browser with no setup required.
- [ ] No Steam, no desktop wrapper, no press kit, no Discord.
- [ ] All existing 464+ tests still pass.

## Out of Scope

- Creating actual itch.io account (user action).
- Press kit, Discord server, or community management.
- Steam release or desktop wrapper (Tauri).
- Paid monetization or analytics that require user consent.
