# Implementation Plan: Deployment (Phase 13)

## Phase A: Production Build & Environment Configuration

### Task A1: Create `build:prod` and `zip` scripts
- [x] Write test: verify `build:prod` script produces expected output (dist/ folder exists, contains index.html)
- [x] Implement: Update package.json scripts — add `build:prod` (existing build + production env + zip bundling) and standalone `zip` script
- [x] Write test: verify `zip` script creates dist.zip with correct contents
- [x] Implement: Configure Vite with `base: './'` for itch.io HTML5 game compatibility
- [x] Add `dist.zip` to `.gitignore`
- [x] Run verification: `bun run build:prod` produces deployable bundle with zero errors
- [x] Update: `conductor/tech-stack.md` with new `build:prod` and `zip` scripts `[d967cbf]`

### Task A2: Configure environment variables for dev/prod
- [x] Write test: verify environment detection works (DEV vs PROD mode)
- [x] Implement: Create `.env.production` file (committed to git) with placeholder Convex production URL
- [x] Implement: Update Convex client initialization to switch URLs based on `import.meta.env.MODE` (already uses `import.meta.env.VITE_CONVEX_URL`) `[15fe14d]`
- [x] Verify: No `.env.local` secrets leak into production bundle (Vite's `envPrefix` already handles this)

### Task A3: Bundle size analysis and cleanup
- [x] Remove unused `web-vitals` dependency from `package.json` and `bun.lock`
- [x] Implement: Add bundle-size check script or manual verification step (existing `scripts/bundle-size.test.ts` covers this)
- [x] Verify: Bundle size is under 5MB target (~857KB)
- [x] Verify: All existing 472 tests pass (`bun test`)

### Phase A Completion `[checkpoint: fae98ec]`
- [x] Task: Conductor - User Manual Verification 'Phase A: Production Build & Environment Configuration' (Protocol in workflow.md)

## Phase B: Analytics Tracking (Convex Event Logging)

### Task B1: Create analytics schema and backend
- [x] Write test: verify analytics_events schema accepts correct event types (`PAGE_LOAD`, `GAME_START`, `GAME_COMPLETE`)
- [x] Implement: Add `analytics_events` table to `convex/schema.ts` with fields: `eventType` (string), `timestamp` (number), `metadata` (optional any)
- [x] Write test: verify `logAnalyticsEvent` mutation stores events correctly
- [x] Implement: Create `convex/analytics.ts` with `logAnalyticsEvent` mutation
- [x] Write test: verify `getAnalyticsSummary` query returns aggregated event counts
- [x] Implement: Create `convex/analytics.ts` with `getAnalyticsSummary` query
- [x] Run tests: verify all analytics backend tests pass
- [x] Update: `conductor/tech-stack.md` with analytics tracking infrastructure

### Task B2: Integrate analytics into the frontend
- [x] Write test: verify analytics events fire on app mount (PAGE_LOAD event)
- [x] Implement: Fire `PAGE_LOAD` event in App.tsx on component mount via logAnalyticsEvent mutation
- [x] Write test: verify analytics event fires when game transitions to "playing" (GAME_START event)
- [x] Implement: Fire `GAME_START` event in App.tsx when gameState.status transitions to "playing"
- [x] Write test: verify analytics event fires when game reaches "finished" (GAME_COMPLETE event)
- [x] Implement: Fire `GAME_COMPLETE` event in App.tsx when gameState.status transitions to "finished"
- [x] Run tests: verify all analytics integration tests pass `[4de526e]`

### Phase B Completion `[checkpoint: e8813e8]`
- [x] Task: Conductor - User Manual Verification 'Phase B: Analytics Tracking' (Protocol in workflow.md)

## Phase C: Convex Production Deployment

### Task C1: Set up Convex production project
- [x] Write test: verify production environment detection works correctly
- [x] Implement: Create production project configuration (user runs `bunx convex deploy`)
- [x] Implement: Document production deployment steps in a deployment guide
- [x] Verify: Convex CORS headers allow connections from itch.io embed domain (automatic — no config needed)

### Task C2: Deploy backend and configure monitoring
- [x] Implement: Run `bunx convex deploy` to push backend (including analytics_events schema) to production
- [x] Set up Convex dashboard monitoring (user verified functions, data, logs)
- [x] Verify: Convex rate limits are appropriate for public traffic (free tier handles indie games)
- [x] Verify: Production backend is accessible and stable

### Phase C Completion
- [x] Task: Conductor - User Manual Verification 'Phase C: Convex Production Deployment' (Protocol in workflow.md)

## Phase D: README Polish & Social Tags

### Task D1: Polish README with enhanced content
- [x] Enhance: Polish existing README intro, adding itch.io link and prominent "Play Now" button
- [x] Add: shields.io tech stack badges (React, Convex, TypeScript, Tailwind, Bun) alongside existing badges
- [x] Add: Embedded screenshots section with placeholder images (to be replaced with real game screenshots)
- [x] Verify: All existing content (command reference, features list, project structure, testing info) is up to date
- [x] Verify: README tone maintains terminal/hacker aesthetic per product guidelines (all-caps sections, terse descriptions, Matrix-green code blocks)

### Task D2: Add social meta tags for share previews
- [x] Implement: Add Open Graph meta tags to `index.html` (`og:title`, `og:description`, `og:image`, `og:type`)
- [x] Implement: Add Twitter Card meta tags to `index.html` (`twitter:card`, `twitter:title`, `twitter:description`, `twitter:image`)

### Phase D Completion
- [x] Task: Conductor - User Manual Verification 'Phase D: README Polish & Social Tags' (Protocol in workflow.md)

## Phase E: itch.io Deployment & Launch

### Task E1: Create itch.io deployment guide
- [x] Write: Step-by-step guide for creating an itch.io game page
- [x] Write: Instructions for capturing screenshots from running game (min 3)
- [x] Write: Instructions for creating an animated GIF preview
- [x] Write: Instructions for uploading ZIP as HTML5 game
- [x] Write: Embed configuration (1280x720 viewport, fullscreen enabled)
- [x] Write: Post-launch sharing instructions (Twitter/X, Reddit, relevant Discord servers)
- [x] Write: Instructions for updating Open Graph image path once itch.io URL is live

### Task E2: Post-deployment documentation updates
- [ ] Update: `conductor/product.md` "Current State" section to reflect that the game is live on itch.io *(requires live URL)*
- [ ] Update: README "Play Now" button URL to point to the live itch.io page *(requires live URL)*

### Task E3: Final verification and launch
- [x] Verify: `bun run build:prod` produces clean dist/ bundle
- [x] Verify: All 480 tests pass (`bun test`)
- [x] Verify: Type checking passes (`bun run typecheck`)
- [x] Verify: Linting passes (0 errors, only pre-existing warnings)
- [ ] Final: Game is playable at a single URL — portfolio ready *(requires live URL)*

### Phase E Completion
- [ ] Task: Conductor - User Manual Verification 'Phase E: itch.io Deployment & Launch' (Protocol in workflow.md)
