# Initial Concept

## Product Overview

**Terminal Tactics** is a minimalist, high-fidelity tactical strategy game played entirely through a Command Line Interface (CLI). It combines the depth of deterministic tactical combat with the aesthetic of a retro-futuristic terminal, delivering a "Matrix-like" hacking simulation experience.

## Core Identity

- **Primary Metaphor**: The user is a "hacker" or "operator" infiltrating a hostile system. Every action is a command executed in a terminal.
- **Visual Language**: Black-and-green CRT terminal aesthetic with scanlines, glow effects, and flicker animations. JetBrains Mono font throughout.
- **Tone**: Technical, cold, precise. Error messages are uppercase and terse. Success is "MISSION_COMPLETE."

## Target Audience

- Players who enjoy tactical turn-based strategy games (e.g., Into the Breach, Advance Wars)
- Enthusiasts of cyberpunk/hacker aesthetics
- Developers and CLI power users who appreciate the dystopian terminal motif
- Players looking for fast-paced multiplayer tactical matches (15-20 minute games)

## Core Experience Pillars

1. **Command-Driven Gameplay**: Every action is typed as a terminal command (`mv`, `atk`, `scan`, `inspect`, `ovw`). No drag-and-drop, no click-to-move — the CLI is the interface.
2. **Deterministic Combat**: No RNG. Damage is calculated purely from positioning (frontal, flank, backstab), elevation, and unit abilities. Every outcome is knowable.
3. **Retro-Hacker Aesthetic**: A fully immersive terminal environment with CRT effects, kernel panic events, sudo mechanics, and Matrix-green color palette.
4. **Real-Time Multiplayer**: Powered by Convex's real-time sync engine. Players see opponent actions, typing indicators, and turn timers in real time.
5. **Strategic Depth**: Fog of war, directional damage, Line of Sight, unit abilities (shield, stealth, healing, overwatch), and Root Access Point (RAP) ultimate mechanics create tactical richness.

## Current State

The game has completed 10 development phases through Phase 11 (Content Expansion). Phase 10 added player profiles and match history (persistent handles, W/L/D stats, match history CLI, rematch system). Phase 11 added 3 new playable unit classes (Engineer with build/demolish abilities, Sniper with stationary attack restriction, Commander with rally AP buff), 3 curated preset maps (The Grid, The Maze, The Ridge) with lobby selection and ASCII preview, and `map` CLI command. The game is now fully keyboard-navigable and screen-reader compatible.
