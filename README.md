# 📟 Terminal Tactics

> "The Matrix is everywhere. It is all around us."

**Terminal Tactics** is a minimalist, high-fidelity tactical strategy game played entirely through a Command Line Interface (CLI). Built with **TanStack Start**, **Convex**, and **Tailwind CSS**, it combines the depth of deterministic tactical combat with the aesthetic of a retro-futuristic terminal.

![License](https://img.shields.io/badge/license-MIT-green)
![Status](https://img.shields.io/badge/status-in_development-yellow)
![Style](https://img.shields.io/badge/style-cyberpunk-00ff00)

## ⚡ Tech Stack

- **Runtime / Package Manager**: [Bun](https://bun.sh)
- **Framework**: [TanStack Start](https://tanstack.com/start)
- **Backend & Database**: [Convex](https://convex.dev)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) (Matrix Theme)
- **Testing**: [Bun Test](https://bun.sh/docs/cli/test)
- **Font**: [JetBrains Mono](https://www.jetbrains.com/lp/mono/)

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed globally.
- A [Convex](https://convex.dev) account.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/yourusername/terminal-tactics.git
    cd terminal-tactics
    ```

2.  **Install dependencies:**

    ```bash
    bun install
    ```

3.  **Initialize Convex:**

    ```bash
    bun convex dev
    ```

    This will set up your backend and generate the necessary environment variables in `.env.local`.

4.  **Run the development server:**

    ```bash
    bun run dev
    ```

5.  **Open the game:**
    Navigate to `http://localhost:3000` to enter the simulation.

## 🎮 Gameplay & Commands

The game is controlled entirely via text commands.

- `mv [unitID] [coord]` - Move a unit (e.g., `mv u1 c4`).
- `atk [unitID] [targetID]` - Attack an enemy (e.g., `atk u1 e2`).
- `scan [coord]` - Reveal a 3x3 area (Scouts are invisible to this).
- `inspect [id]` - View detailed stats of a unit.
- `help` - List all available commands.

## 📂 Project Structure

```
terminal-tactics/
├── convex/              # Backend functions & schema
│   ├── game.ts          # Game logic (movement, combat)
│   ├── schema.ts        # Database schema
│   └── ...
├── src/
│   ├── components/      # React components
│   │   ├── CLI/         # Command input & history
│   │   ├── Grid/        # SVG Map & Unit rendering
│   │   └── Layout/      # Main Game Shell
│   ├── routes/          # TanStack Router definitions
│   ├── lib/             # Utilities (Command parser, etc.)
│   └── styles.css       # Global Matrix theme
├── docs/                # Documentation & Roadmap
└── ...
```

## 🗺️ Roadmap

Current Phase: **Phase 3 - Multiplayer Connectivity**

- [x] **Phase 1: Foundation**: Project setup, Matrix aesthetic, Database init.
- [x] **Phase 2: Core Interface**: CLI Parser, Grid Rendering, Convex Integration.
- [ ] **Phase 3: Multiplayer**: Lobbies, Turn Management, Presence.
- [ ] **Phase 4: Mechanics**: Squad Builder, Advanced Movement, Map Gen.
- [ ] **Phase 5: Combat**: LoS, Fog of War, Damage Logic.
- [ ] **Phase 6: Polish**: Audio, Glitch Effects, Chat.

See [docs/ROADMAP.md](./docs/ROADMAP.md) for detailed progress.

## 🧪 Testing

We use **Bun Test** for unit and integration testing.

```bash
bun test
```

To run type checks and linting:

```bash
bun run type-check
bun run lint
```

## 📄 License

MIT
