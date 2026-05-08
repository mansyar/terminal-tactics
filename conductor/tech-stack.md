# Technology Stack

## Runtime & Package Manager

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | **Bun** | JavaScript/TypeScript runtime and package manager |
| Package Manager | **Bun** (bun.lock) | Dependency resolution and script execution |

## Language

| Component | Technology | Notes |
|-----------|-----------|-------|
| Language | **TypeScript 5.7** | Strict mode enabled; path alias `@/*` → `./src/*` |

## Frontend

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Framework | **React 19** | UI component library |
| Build Tool | **Vite 7** | Development server and production builds |
| Styling | **Tailwind CSS v4** | Utility-first CSS with custom Matrix theme |
| Routing | **TanStack Router** | Client-side routing and navigation |
| Animation | **Framer Motion** | Unit movement animations and transitions |
| Icons | Inline SVGs | Minimal set of SVG icons (Home, Menu, X) — lucide-react removed |
| Dev Tools | **TanStack Devtools** | React and Router debugging tools |

## Backend & Database

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend | **Convex** | Serverless real-time backend |
| Database | **Convex** (built-in) | Document database with real-time sync |
| Schema | **Convex Schema** | Typed schema for games, units, logs tables |

## Testing

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Test Runner | **Bun Test** | Fast test execution |
| Testing Library | **@testing-library/react** | React component testing |
| Testing Library | **@testing-library/dom** | DOM query testing |
| Testing Library | **@testing-library/jest-dom** | Accessible DOM matchers (toHaveAccessibleName, toHaveRole) |
| DOM Environment | **jsdom** | Browser environment simulation |

## Quality Assurance

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Linting | **ESLint** (TanStack config) | Code quality and consistency |
| Formatting | **Prettier** | Code formatting |
| Type Checking | **TypeScript (tsc)** | Static type analysis |
| Git Hooks | **Husky** | Pre-commit and pre-push hook management |
| Staged Linting | **Lint-Staged** | Run linters only on staged files |

## Key Development Scripts

| Command | Script |
|---------|--------|
| `bun run dev` | Start Vite dev server on port 3000 |
| `bun run build` | Production build + TypeScript check |
| `bun test` | Run all tests with Bun Test |
| `bun test --coverage` | Run tests with coverage report (threshold: 80%) |
| `bun run lint` | Run ESLint |
| `bun run format` | Run Prettier |
| `bun run typecheck` | TypeScript type checking |
| `bun run check` | Format + lint fix |
| `bun run prepare` | Initialize husky git hooks (auto-runs on bun install) |
| `bun run pre-commit` | Run lint-staged on staged files |
| `bun run pre-push` | Run type check + coverage before push |
