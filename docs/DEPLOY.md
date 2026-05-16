# DEPLOYMENT_GUIDE

> `>_ TERMINAL_TACTICS v1.0 — DEPLOYMENT PROTOCOL`

## OVERVIEW

This guide covers deploying Terminal Tactics to **itch.io** as a playable HTML5 web game. The entire deployment pipeline is designed to be minimal — one build command, one upload.

---

## PREREQUISITES

- [itch.io](https://itch.io) account
- [Bun](https://bun.sh) installed locally
- Convex production project configured (see Phase C)

---

## Step 1: PRODUCTION_BUILD

```bash
# Build the game + zip it for upload
bun run build:prod
```

This produces:
- `dist/` — the production build output (HTML, CSS, JS)
- `dist.zip` — the packaged archive for itch.io upload

**Verify the build:**
```bash
ls dist/
# Should show: index.html, assets/
```

**Bundle size check:**
```bash
# Should be under 5MB
Get-ChildItem -Recurse dist | Measure-Object -Property Length -Sum
```

---

## Step 2: CONVEX_PRODUCTION_DEPLOY

```bash
# Deploy the Convex backend to production
bunx convex deploy
```

**Config checklist:**
- [ ] Analytics schema (`analytics_events` table) is deployed
- [ ] CORS headers allow connections from `itch.io` embed domain
- [ ] Rate limits are appropriate for public traffic
- [ ] Dashboard monitoring is configured for errors and usage spikes

---

## Step 3: ITCH.IO_PAGE_SETUP

### 3.1 Create the Game Page

1. Go to [itch.io dashboard](https://itch.io/game/new)
2. Set project type to **HTML**
3. Fill in:
   - **Title:** Terminal Tactics
   - **Short Description:** A minimalist, high-fidelity tactical strategy game played entirely through a CLI.
   - **Classification:** Game
   - **Kind of project:** HTML

### 3.2 Store Assets

| Asset | Size | Description |
|-------|------|-------------|
| Cover Image | 630×500 px | Game logo/banner with Matrix-green terminal aesthetic |
| Screenshot 1 | Any | CLI interface showing command entry |
| Screenshot 2 | Any | Grid combat with units, health bars, and fog of war |
| Screenshot 3 | Any | Lobby/matchmaking screen |
| Animated GIF | < 5MB | Short gameplay loop showing move → attack → end turn |

**Screenshot capture:**
```bash
# Run the game
bun run dev
# Navigate to http://localhost:3000
# Use your OS screenshot tool to capture
```

### 3.3 Upload the Build

1. In the itch.io game dashboard, navigate to **Uploads**
2. Upload `dist.zip` (generated in Step 1)
3. Set **Viewport dimensions** to `1280x720`
4. Enable **Fullscreen** option
5. Set **Background color** to `#0A0A0A`

### 3.4 Embed Configuration

```yaml
viewport:
  width: 1280
  height: 720
fullscreen: true
background: "#0A0A0A"
```

---

## Step 4: POST_LAUNCH

### 4.1 Update URLs

After the itch.io page is live, update these files with the actual URL:

1. **`docs/DEPLOY.md`** — Replace `your-username` with your actual itch.io username
2. **`index.html`** — Update `og:url` and `og:image` meta tags with the live URL
3. **`README.md`** — Update the "Play Now" button URL

### 4.2 Social Sharing

Post on these platforms:

- **Twitter/X**: Share link with #IndieGame #Tactics #TerminalTactics
- **Reddit**: Post to r/WebGames, r/IndieGaming, r/TBS (turn-based strategy)
- **Discord**: Share in relevant game dev and strategy game communities

### 4.3 Monitoring

- Monitor Convex dashboard for errors and usage within first 48 hours
- Check itch.io page views and play counts
- Gather feedback from players

---

## TROUBLESHOOTING

### Black screen on itch.io

- Ensure `base: './'` is set in `vite.config.ts`
- Check browser console for asset loading errors
- Verify all asset paths are relative (not absolute)

### Convex connection errors

- Verify CORS headers allow connections from `itch.io` domain
- Check that the Convex production URL is correctly set in env
- Ensure `bunx convex deploy` was run after the latest schema changes

### Analytics not tracking

- Verify `logAnalyticsEvent` mutation exists in the deployed backend
- Check Convex dashboard for mutation logs
- Confirm analytics_events schema was deployed

---

## ROLLBACK

To roll back to a previous version:

1. Upload the previous `dist.zip` to itch.io
2. If needed, roll back the Convex backend:
   ```bash
   git revert HEAD
   bunx convex deploy
   ```

---

## FILE_REFERENCE

| File | Purpose |
|------|---------|
| `dist/` | Production build output |
| `dist.zip` | itch.io upload archive |
| `.env.production` | Production environment config (VITE_CONVEX_URL placeholder) |
| `convex/analytics.ts` | Analytics event logging (PAGE_LOAD, GAME_START, GAME_COMPLETE) |

---

> `MISSION_COMPLETE // GAME_IS_LIVE`
