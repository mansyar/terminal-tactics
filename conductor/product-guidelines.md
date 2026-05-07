# Product Guidelines

## 1. Writing & UI Copy Style

### 1.1 Tone
- **Technical & Cold**: All in-game messages are machine-like and impersonal. Use all-caps for system messages.
- **Terse**: No fluff. Get straight to the point.
- **Error Messages**: Format as `ERROR: <REASON>` in uppercase. Never apologize or use natural language for errors.
- **Success Messages**: Use `EXECUTING:`, `SUCCESS:`, or `MISSION_COMPLETE` patterns.

### 1.2 Case Conventions
- **System Messages**: UPPERCASE (e.g., "TURN_ENDED", "UNIT_ELIMINATED")
- **Commands**: Lowercase (e.g., `mv`, `atk`, `scan`)
- **Unit IDs**: Uppercase single letters in brackets (e.g., `[K]`, `[A]`, `[S]`, `[M]`)
- **Coordinate Labels**: Uppercase column + number row (e.g., `C4`, `E2`)
- **Player Identifiers**: Lowercase (e.g., `p1`, `p2`)

### 1.3 Log Formatting
- Command inputs and results logged with timestamps
- Results prefixed with status indicator (`ERROR:`, `SUCCESS:`, or result type)
- Private commands (scan, inspect) should be logged with visibility filtering

## 2. Visual & Brand Guidelines

### 2.1 Color Palette
- **Primary (Matrix Green)**: `#00FF00` — All interactive text, borders, active elements
- **Background**: `#000000` (Pure black) — Main background
- **Dim/Secondary**: `#00FF00` at 30-50% opacity — Less important text, borders, disabled elements
- **Error/Danger**: Red (`#FF4444` or similar) — Error messages, hostile units, kernel panic
- **Warning**: Amber (`#FF9900`) — Warnings, low HP
- **Success**: Bright green — Positive feedback

### 2.2 Typography
- **Primary Font**: JetBrains Mono (monospace) for all text
- **No proportional fonts**: The terminal must be 100% monospace
- **CRT Effects**: Scanlines, text glow (`text-shadow` or CSS glow), subtle flicker via CSS animations
- **Font Sizes**: Use `text-xs` to `text-2xl` range, always monospace

### 2.3 UI Components
- **Borders**: Thin, green, single-line style (`border border-matrix-primary/30`)
- **Active Elements**: Brighter green with hover transitions
- **Loader States**: "Waiting..." messages with `animate-pulse`
- **Animations**: Framer Motion for unit movement (sliding), fade transitions
- **Glitch Effect**: CSS `glitch` class for kernel panic events

## 3. UX Principles

### 3.1 CLI-First Philosophy
- Every game action must be accessible via a text command
- Mouse interaction is secondary — the game must be fully playable via keyboard
- Tab autocomplete and IntelliSense for commands and coordinates
- `help` command always available to list all commands

### 3.2 Feedback & Responsiveness
- Every command produces immediate feedback (success or error with reason)
- Audio cues: keystroke sounds, attack SFX, error buzzers, success chimes
- Visual feedback: unit animations for movement, attacks, healing
- Typing indicators show when the opponent is composing a command

### 3.3 Accessibility
- Fog of War state must be visually clear (dimmed/"?" for unexplored, visible for revealed)
- Health status visible at a glance (HP bars, color-coded)
- Turn ownership unmistakable (TurnIndicator component)
- Timer display for turn and draft phases

### 3.4 State Management
- Player identity persisted in LocalStorage
- Active game ID synced to LocalStorage for refresh resilience
- Game state managed server-side via Convex
- Client handles loading, waiting, playing, and finished states gracefully

## 4. Brand Elements

- **Logo/Title**: "TERMINAL TACTICS" in uppercase monospace
- **Tagline**: "The Matrix is everywhere. It is all around us."
- **License**: MIT
- **Status Badge**: "in_development" with yellow indicator
- **Style Badge**: "cyberpunk" with green indicator

## 5. Technical Constraints

- **Map Size**: 12×12 standard grid (8×8 quick, 16×16 large planned)
- **Coordinate System**: Chess notation (A-L columns, 1-12 rows)
- **Turn Timer**: 90 seconds per turn
- **Draft Timer**: 90 seconds during squad selection
- **Squad Budget**: 1000 credits, 2-5 units
- **Max RAP**: 3 stored Root Access Points
