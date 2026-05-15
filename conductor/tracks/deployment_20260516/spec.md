# Track: Deployment (Phase 13)

## Overview

Publish Terminal Tactics on itch.io as a playable web game. This track covers production build configuration, Convex production backend deployment, analytics tracking, itch.io store page setup, README polish, and launch.

## Type

Feature

## Design Decisions

- **Production Env Strategy:** Use a committed `.env.production` file with a placeholder Convex URL. The real production URL is injected via CI/CD at build time. Vite's `import.meta.env` handles env switching automatically.
- **Event Naming:** Analytics event names use UPPERCASE with underscores to match the terminal/hacker aesthetic: `PAGE_LOAD`, `GAME_START`, `GAME_COMPLETE`.
- **itch.io Path Handling:** Vite production build uses `base: './'` so assets resolve correctly when served from itch.io's game subdirectory.
- **Execution Order:** Analytics schema changes are implemented before Convex production deployment to avoid a second redeployment.

## Functional Requirements

### 13.1 Production Build & Environment Configuration

- Create a `build:prod` npm script that runs the existing production build (`bun --bun vite build && tsc`) with production environment variables, then bundles `dist/` into `dist.zip` for itch.io upload.
- The existing `build` script already includes Vite's default optimizations (esbuild minification, tree-shaking, code splitting) — `build:prod` extends it with env switching and zip packaging.
- Create a separate `zip` script for standalone dist bundling.
- Configure Vite with `base: './'` for itch.io HTML5 game compatibility.
- Create a committed `.env.production` template with a placeholder Convex production URL. The real URL is configured via CI/CD or manually before deployment.
- Add `dist.zip` to `.gitignore`.
- Remove unused `web-vitals` dependency from `package.json`.
- Update `conductor/tech-stack.md` to document the new build and zip scripts.
- Verify bundle size is reasonable (< 5MB).
- Verify `bun run build:prod` produces a deployable `dist/` bundle with zero errors.

### 13.2 Analytics Tracking

- Implement a lightweight Convex event logging system for basic analytics — no external dependencies.
- Track three events using all-caps naming convention:
  - `PAGE_LOAD` — app is mounted (player opened the game)
  - `GAME_START` — game transitions to `status: "playing"`
  - `GAME_COMPLETE` — game transitions to `status: "finished"`
- Store analytics events in a new `analytics_events` Convex table with fields: `eventType` (string), `timestamp` (number), `metadata` (optional any).
- Provide a `logAnalyticsEvent` mutation and a `getAnalyticsSummary` query.
- Update `conductor/tech-stack.md` with the analytics infrastructure.

### 13.3 Convex Production Deployment

- Set up a Convex production project.
- Deploy the backend using `bunx convex deploy` (includes the analytics schema from 13.2).
- Configure production environment variables (no `.env.local` in prod).
- Verify Convex CORS headers allow connections from itch.io embed domain.
- Ensure Convex rate limits are appropriate for public traffic.
- Set up Convex dashboard monitoring for errors and usage spikes.

### 13.4 itch.io Deployment

- Create an itch.io game page for Terminal Tactics (manual step requiring user account).
- Provide instructions for creating store assets:
  - Cover image (630×500)
  - Screenshots (min 3) — captured manually from running game
  - Animated GIF preview — captured manually
- Provide upload instructions: ZIP `dist/` and upload as HTML5 game.
- Embed configuration: 1280×720 viewport, fullscreen enabled.
- Deliver the public itch.io URL for portfolio and recruiting.

### 13.5 README Polish & Social Tags

- Polish the README with enhanced copy (the current README is already substantive — focus on adding itch.io link, Play Now button, and screenshots).
- Add Open Graph (`og:title`, `og:description`, `og:image`) and Twitter Card meta tags to `index.html` for rich social share previews.
- All README copy must maintain the terminal/hacker aesthetic — all-caps sections, terse descriptions, Matrix-green code blocks per product guidelines.
- Add shields.io tech stack badges for React, Convex, TypeScript, Tailwind, Bun (beyond the current license/status/style badges).
- Add a prominent "Play Now" button linking to the live itch.io URL.
- Add embedded screenshots showing the CLI, grid, and combat.
- Verify the existing features list, command reference, and getting started guide are up to date.

### 13.6 Launch

- Post the itch.io link on social media (manual — instructions provided).
- Update `conductor/product.md` "Current State" to reflect that the game is live on itch.io.
- Portfolio ready: game is playable at a single URL with no install, no friction, no account required.

## Acceptance Criteria

- [ ] `bun run build:prod` produces a deployable `dist/` bundle with zero errors.
- [ ] Bundle size is verified and under 5MB.
- [ ] Vite production build uses `base: './'` for itch.io compatibility.
- [ ] Dev/prod environment variables are configured correctly via `.env.production` + CI build-time overrides.
- [ ] Convex production backend is deployed, stable, and accessible.
- [ ] Convex CORS allows connections from itch.io embed domain.
- [ ] Analytics events `PAGE_LOAD`, `GAME_START`, and `GAME_COMPLETE` are logged to Convex.
- [ ] `web-vitals` dependency is removed.
- [ ] `dist.zip` is added to `.gitignore`.
- [ ] `conductor/tech-stack.md` is updated with new build scripts and analytics infrastructure.
- [ ] `conductor/product.md` "Current State" is updated post-deployment.
- [ ] `index.html` has Open Graph and Twitter Card meta tags.
- [ ] itch.io page has cover art, screenshots, description, and is publicly accessible.
- [ ] README is polished with enhanced copy, screenshots, Play Now link, and hacker-consistent tone.
- [ ] Game is playable on itch.io in a browser with no setup required.
- [ ] No Steam, no desktop wrapper, no press kit, no Discord.
- [ ] All existing 464+ tests still pass.

## Out of Scope

- Creating actual itch.io account (user action).
- Press kit, Discord server, or community management.
- Steam release or desktop wrapper (Tauri).
- Paid monetization or analytics that require user consent.
