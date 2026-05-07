# Implementation Plan: Automatic Code Quality Checks

## Phase 0: Remediate Existing Violations

- [x] Task: Refactor `src/App.tsx` to under 500 lines [adce6db]
    - [x] Extract `cleanErrorMessage()` helper to `src/lib/utils.ts`
    - [x] Extract `parseCoord()` helper to `src/lib/utils.ts`
    - [x] Extract `handleCommand` into a custom hook `src/hooks/useGameCommands.ts`
    - [x] Verify `src/App.tsx` is under 500 lines after extraction
- [ ] Task: Split `src/components/Grid/UnitModel.test.tsx` into focused test files
    - [ ] Create `src/components/Grid/UnitModel.health.test.tsx` (health bar tests)
    - [ ] Create `src/components/Grid/UnitModel.interactions.test.tsx` (callbacks, color coding, stealth)
    - [ ] Create `src/components/Grid/UnitModel.visual.test.tsx` (overwatch cone, direction arrow)
    - [ ] Remove the original monolithic `UnitModel.test.tsx`
    - [ ] Verify each new test file is under 500 lines
    - [ ] Run all tests to confirm nothing broke
- [ ] Task: Raise test coverage to >=80%
    - [ ] Write tests for `convex/squadBuilder.ts` (squad budget, validation, templates -- currently 14.66%)
    - [ ] Write tests for `convex/lobby.ts` (lobby creation, join, code generation -- currently 45.24%)
    - [ ] Write tests for `convex/game.ts` (game state mutations -- currently 26.36%)
    - [ ] Write tests for `src/components/SquadBuilder.tsx` (currently 2.61%)
    - [ ] Write tests for `src/components/Terminal/CLIInput.tsx` (currently 8.89%)
    - [ ] Write tests for `src/components/TimerDisplay.tsx` (currently 2.56%)
    - [ ] Write tests for `src/components/TurnIndicator.tsx` (currently 4.55%)
    - [ ] Write tests for `src/lib/audio.ts` (currently 40.00%)
- [ ] Task: Verify all violations are cleared
    - [ ] Run `bun test --coverage` and confirm >=80% lines
    - [ ] Run line count check on all `.ts/.tsx/.js/.jsx` files in `src/` and `convex/` (excluding `convex/_generated/`) and confirm none exceed 500 lines
    - [ ] Run `bun run typecheck` and confirm it passes
    - [ ] Run `bun run lint` and confirm it passes
- [ ] Task: Conductor - User Manual Verification 'Remediate Existing Violations' (Protocol in workflow.md)

## Phase 1: Setup Dependencies & Configuration

- [ ] Task: Install husky and lint-staged
    - [ ] Install `husky` and `lint-staged` as devDependencies via bun
    - [ ] Initialize husky (create `.husky/` directory)
    - [ ] Add `"prepare": "husky"` to package.json scripts
    - [ ] Create `.husky/pre-commit` hook file with `npx lint-staged`
    - [ ] Create `.husky/pre-push` hook file
- [ ] Task: Configure lint-staged
    - [ ] Create `.lintstagedrc.js` config file at project root
    - [ ] Add prettier + eslint auto-fix rules for `*.{ts,tsx,js,jsx}` files
    - [ ] Add `bun test --bail` for `*.test.{ts,tsx}` file patterns
    - [ ] Add `tsc --noEmit` for `*.{ts,tsx}` files (runs once per commit, not per file)
- [ ] Task: Update bunfig.toml with coverage threshold
    - [ ] Add `coverageThreshold = 0.8` under the existing `[test]` section
- [ ] Task: Clean up duplicate scripts in package.json
    - [ ] Remove duplicate `"type-check": "tsc --noEmit"` (keep `"typecheck"`)
    - [ ] Add `"pre-commit": "lint-staged"` and `"pre-push": "bun run typecheck && bun test --coverage"` convenience scripts
- [ ] Task: Conductor - User Manual Verification 'Setup Dependencies & Configuration' (Protocol in workflow.md)

## Phase 2: Implement Pre-Commit Hook (Line-of-Code Check + Type Checking)

- [ ] Task: Create custom line-of-code check script
    - [ ] Write failing test for `scripts/check-file-size.ts` (should detect file > 500 lines, should pass for file <= 500 lines, should only check files under `src/` and `convex/`, should exclude `convex/_generated/`, should output correct error message with refactor instruction)
    - [ ] Implement `scripts/check-file-size.ts` that reads staged files, counts lines, filters to only `src/` and `convex/` paths (excluding `convex/_generated/`), and exits with non-zero if any file exceeds 500 lines
    - [ ] Verify tests pass
- [ ] Task: Wire line-of-code check into pre-commit
    - [ ] Add the custom script to lint-staged config for `src/**/*.{ts,tsx,js,jsx}` and `convex/**/*.{ts,tsx,js,jsx}` patterns
    - [ ] Verify the full pre-commit chain: prettier -> eslint -> test -> tsc -> line-of-code check
- [ ] Task: Conductor - User Manual Verification 'Implement Pre-Commit Hook' (Protocol in workflow.md)

## Phase 3: Implement Pre-Push Hook (Coverage Threshold)

- [ ] Task: Add type checking to pre-push hook
    - [ ] Write `.husky/pre-push` with `bun run typecheck && bun test --coverage`
    - [ ] Verify push is blocked when type errors exist
- [ ] Task: Verify coverage threshold
    - [ ] Confirm `coverageThreshold = 0.8` is active in bunfig.toml (already configured in Phase 1)
    - [ ] Verify pre-push blocks when coverage is below 80%
- [ ] Task: Conductor - User Manual Verification 'Implement Pre-Push Hook' (Protocol in workflow.md)
