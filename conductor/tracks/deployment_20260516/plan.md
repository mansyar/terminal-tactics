# Implementation Plan: Deployment (Phase 13)

## Phase A: Production Build & Environment Configuration

### Task A1: Create `build:prod` and `zip` scripts
- [ ] Write test: verify `build:prod` script produces expected output (dist/ folder exists, contains index.html)
- [ ] Implement: Update package.json scripts — add `build:prod` (existing build + production env + zip bundling) and standalone `zip` script
- [ ] Write test: verify `zip` script creates dist.zip with correct contents
- [ ] Implement: Configure Vite with `base: './'` for itch.io HTML5 game compatibility
- [ ] Add `dist.zip` to `.gitignore`
- [ ] Run verification: `bun run build:prod` produces deployable bundle with zero errors
- [ ] Update: `conductor/tech-stack.md` with new `build:prod` and `zip` scripts

### Task A2: Configure environment variables for dev/prod
- [ ] Write test: verify environment detection works (DEV vs PROD mode)
- [ ] Implement: Create `.env.production` file (committed to git) with placeholder Convex production URL
- [ ] Implement: Update Convex client initialization to switch URLs based on `import.meta.env.MODE`
- [ ] Verify: No `.env.local` secrets leak into production bundle (Vite's `envPrefix` already handles this)

### Task A3: Bundle size analysis and cleanup
- [ ] Remove unused `web-vitals` dependency from `package.json` and `bun.lock`
- [ ] Implement: Add bundle-size check script or manual verification step
- [ ] Verify: Bundle size is under 5MB target
- [ ] Verify: All existing 464+ tests pass (`bun test`)

### Phase A Completion
- [ ] Task: Conductor - User Manual Verification 'Phase A: Production Build & Environment Configuration' (Protocol in workflow.md)

## Phase B: Analytics Tracking (Convex Event Logging)

### Task B1: Create analytics schema and backend
- [ ] Write test: verify analytics_events schema accepts correct event types (`PAGE_LOAD`, `GAME_START`, `GAME_COMPLETE`)
- [ ] Implement: Add `analytics_events` table to `convex/schema.ts` with fields: `eventType` (string), `timestamp` (number), `metadata` (optional any)
- [ ] Write test: verify `logAnalyticsEvent` mutation stores events correctly
- [ ] Implement: Create `convex/analytics.ts` with `logAnalyticsEvent` mutation
- [ ] Write test: verify `getAnalyticsSummary` query returns aggregated event counts
- [ ] Implement: Create `convex/analytics.ts` with `getAnalyticsSummary` query
- [ ] Run tests: verify all analytics backend tests pass
- [ ] Update: `conductor/tech-stack.md` with analytics tracking infrastructure

### Task B2: Integrate analytics into the frontend
- [ ] Write test: verify analytics events fire on app mount (PAGE_LOAD event)
- [ ] Implement: Fire `PAGE_LOAD` event in App.tsx on component mount via logAnalyticsEvent mutation
- [ ] Write test: verify analytics event fires when game transitions to "playing" (GAME_START event)
- [ ] Implement: Fire `GAME_START` event in App.tsx when gameState.status transitions to "playing"
- [ ] Write test: verify analytics event fires when game reaches "finished" (GAME_COMPLETE event)
- [ ] Implement: Fire `GAME_COMPLETE` event in App.tsx when gameState.status transitions to "finished"
- [ ] Run tests: verify all analytics integration tests pass

### Phase B Completion
- [ ] Task: Conductor - User Manual Verification 'Phase B: Analytics Tracking' (Protocol in workflow.md)

## Phase C: Convex Production Deployment

### Task C1: Set up Convex production project
- [ ] Write test: verify production environment detection works correctly
- [ ] Implement: Create production project configuration (user runs `bunx convex init --prod` manually)
- [ ] Implement: Document production deployment steps in a deployment guide
- [ ] Verify: Convex CORS headers allow connections from itch.io embed domain (configure in Convex dashboard)

### Task C2: Deploy backend and configure monitoring
- [ ] Implement: Run `bunx convex deploy` to push backend (including analytics_events schema) to production
- [ ] Implement: Set up Convex dashboard alerts for errors and usage spikes
- [ ] Implement: Verify Convex rate limits are appropriate for public traffic
- [ ] Verify: Production backend is accessible and stable

### Phase C Completion
- [ ] Task: Conductor - User Manual Verification 'Phase C: Convex Production Deployment' (Protocol in workflow.md)

## Phase D: README Polish & Social Tags

### Task D1: Polish README with enhanced content
- [ ] Enhance: Polish existing README intro, adding itch.io link and prominent "Play Now" button
- [ ] Add: shields.io tech stack badges (React, Convex, TypeScript, Tailwind, Bun) alongside existing badges
- [ ] Add: Embedded screenshots section with placeholder images (to be replaced with real game screenshots)
- [ ] Verify: All existing content (command reference, features list, project structure, testing info) is up to date
- [ ] Verify: README tone maintains terminal/hacker aesthetic per product guidelines (all-caps sections, terse descriptions, Matrix-green code blocks)

### Task D2: Add social meta tags for share previews
- [ ] Implement: Add Open Graph meta tags to `index.html` (`og:title`, `og:description`, `og:image`, `og:type`)
- [ ] Implement: Add Twitter Card meta tags to `index.html` (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### Phase D Completion
- [ ] Task: Conductor - User Manual Verification 'Phase D: README Polish & Social Tags' (Protocol in workflow.md)

## Phase E: itch.io Deployment & Launch

### Task E1: Create itch.io deployment guide
- [ ] Write: Step-by-step guide for creating an itch.io game page
- [ ] Write: Instructions for capturing screenshots from running game (min 3)
- [ ] Write: Instructions for creating an animated GIF preview
- [ ] Write: Instructions for uploading ZIP as HTML5 game
- [ ] Write: Embed configuration (1280×720 viewport, fullscreen enabled)
- [ ] Write: Post-launch sharing instructions (Twitter/X, Reddit, relevant Discord servers)
- [ ] Write: Instructions for updating Open Graph image path once itch.io URL is live

### Task E2: Post-deployment documentation updates
- [ ] Update: `conductor/product.md` "Current State" section to reflect that the game is live on itch.io
- [ ] Update: README "Play Now" button URL to point to the live itch.io page

### Task E3: Final verification and launch
- [ ] Verify: `bun run build:prod` produces clean dist/ bundle
- [ ] Verify: `bun run zip` creates dist.zip
- [ ] Verify: All 464+ tests pass (`bun test`)
- [ ] Verify: Type checking passes (`bun run typecheck`)
- [ ] Verify: Linting passes (`bun run lint`)
- [ ] Final: Game is playable at a single URL — portfolio ready

### Phase E Completion
- [ ] Task: Conductor - User Manual Verification 'Phase E: itch.io Deployment & Launch' (Protocol in workflow.md)
