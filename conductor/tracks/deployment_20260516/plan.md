# Implementation Plan: Deployment (Phase 13)

## Phase A: Production Build & Environment Configuration

### Task A1: Create `build:prod` and `zip` scripts
- [ ] Write test: verify `build:prod` script produces expected output (dist/ folder exists, contains index.html)
- [ ] Implement: Update package.json scripts — add `build:prod` (optimized Vite build + tsc) and `zip` (bundle dist/ into dist.zip)
- [ ] Write test: verify `zip` script creates dist.zip with correct contents
- [ ] Implement: Configure Vite for production optimization (minification, tree-shaking, code splitting)
- [ ] Run verification: `bun run build:prod` produces deployable bundle with zero errors
- [ ] Task: Conductor - User Manual Verification 'Phase A: Production Build & Environment Configuration' (Protocol in workflow.md)

### Task A2: Configure environment variables for dev/prod
- [ ] Write test: verify environment detection works (DEV vs PROD mode)
- [ ] Implement: Create `.env.production` template with Convex production URL placeholder
- [ ] Implement: Update Convex client initialization to use production URL based on env
- [ ] Implement: Ensure no `.env.local` secrets leak into production bundle
- [ ] Task: Conductor - User Manual Verification 'Phase A: Production Build & Environment Configuration' (Protocol in workflow.md)

### Task A3: Bundle size analysis
- [ ] Implement: Add bundle-size check script or manual verification step
- [ ] Verify: Bundle size is under 5MB target
- [ ] Verify: All existing 464+ tests pass (`bun test`)
- [ ] Task: Conductor - User Manual Verification 'Phase A: Production Build & Environment Configuration' (Protocol in workflow.md)

## Phase B: Convex Production Deployment

### Task B1: Set up Convex production project
- [ ] Write test: verify production environment detection works correctly
- [ ] Implement: Create production project configuration (user runs `bunx convex init --prod` manually)
- [ ] Implement: Document production deployment steps in a deployment guide
- [ ] Task: Conductor - User Manual Verification 'Phase B: Convex Production Deployment' (Protocol in workflow.md)

### Task B2: Deploy backend and configure monitoring
- [ ] Implement: Run `bunx convex deploy` to push backend to production
- [ ] Implement: Set up Convex dashboard alerts for errors and usage spikes
- [ ] Implement: Verify Convex rate limits are appropriate for public traffic
- [ ] Verify: Production backend is accessible and stable
- [ ] Task: Conductor - User Manual Verification 'Phase B: Convex Production Deployment' (Protocol in workflow.md)

## Phase C: Analytics Tracking (Convex Event Logging)

### Task C1: Create analytics schema and backend
- [ ] Write test: verify analytics_events schema accepts correct event types
- [ ] Implement: Add `analytics_events` table to `convex/schema.ts` with fields: `eventType` (string), `timestamp` (number), `metadata` (optional any)
- [ ] Write test: verify `logAnalyticsEvent` mutation stores events correctly
- [ ] Implement: Create `convex/analytics.ts` with `logAnalyticsEvent` mutation
- [ ] Write test: verify `getAnalyticsSummary` query returns aggregated counts
- [ ] Implement: Create `convex/analytics.ts` with `getAnalyticsSummary` query
- [ ] Run tests: verify all analytics backend tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase C: Analytics Tracking' (Protocol in workflow.md)

### Task C2: Integrate analytics into the frontend
- [ ] Write test: verify analytics events fire on app mount (page_view event)
- [ ] Implement: Fire `page_view` event in App.tsx on component mount
- [ ] Write test: verify analytics event fires when game transitions to "playing" (game_start event)
- [ ] Implement: Fire `game_start` event in App.tsx when gameState.status transitions to "playing"
- [ ] Write test: verify analytics event fires when game reaches "finished" (game_complete event)
- [ ] Implement: Fire `game_complete` event in App.tsx when gameState.status transitions to "finished"
- [ ] Run tests: verify all analytics integration tests pass
- [ ] Task: Conductor - User Manual Verification 'Phase C: Analytics Tracking' (Protocol in workflow.md)

## Phase D: README Polish

### Task D1: Polish README with compelling content
- [ ] Write: Compelling game intro explaining what Terminal Tactics is and why it's cool
- [ ] Write: Add shields.io tech stack badges (React, Convex, TypeScript, Tailwind, Bun)
- [ ] Write: Add "Play Now" button linking to the live itch.io URL (placeholder until Phase E)
- [ ] Write: Add Quick Start section with `bun install && bun run dev`
- [ ] Write: Add features list (deterministic combat, fog of war, 7 unit classes, sudo abilities, AI opponent, 6 achievements, etc.)
- [ ] Write: Add embedded screenshots section (placeholders for manual screenshots)
- [ ] Write: Add link to itch.io page
- [ ] Task: Conductor - User Manual Verification 'Phase D: README Polish' (Protocol in workflow.md)

## Phase E: itch.io Deployment & Launch

### Task E1: Create itch.io deployment guide
- [ ] Write: Step-by-step guide for creating an itch.io game page
- [ ] Write: Instructions for capturing screenshots from running game (min 3)
- [ ] Write: Instructions for creating an animated GIF preview
- [ ] Write: Instructions for uploading ZIP as HTML5 game
- [ ] Write: Embed configuration (1280×720 viewport, fullscreen enabled)
- [ ] Write: Post-launch sharing instructions (Twitter/X, Reddit, Discord servers)
- [ ] Task: Conductor - User Manual Verification 'Phase E: itch.io Deployment & Launch' (Protocol in workflow.md)

### Task E2: Final verification and launch
- [ ] Verify: `bun run build:prod` produces clean dist/ bundle
- [ ] Verify: `bun run zip` creates dist.zip
- [ ] Verify: All 464+ tests pass (`bun test`)
- [ ] Verify: Type checking passes (`bun run typecheck`)
- [ ] Verify: Linting passes (`bun run lint`)
- [ ] Final: Game is playable at a single URL — portfolio ready
- [ ] Task: Conductor - User Manual Verification 'Phase E: itch.io Deployment & Launch' (Protocol in workflow.md)
