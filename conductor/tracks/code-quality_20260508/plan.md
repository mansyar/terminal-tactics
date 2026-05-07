# Implementation Plan: Automatic Code Quality Checks

## Phase 1: Setup Dependencies & Configuration

- [ ] Task: Install husky and lint-staged
    - [ ] Install `husky` and `lint-staged` as devDependencies via bun
    - [ ] Initialize husky (create `.husky/` directory)
    - [ ] Add `"prepare": "husky"` to package.json scripts (Bun's postinstall equivalent)
    - [ ] Create `.husky/pre-commit` hook file with `npx lint-staged`
    - [ ] Create `.husky/pre-push` hook file
- [ ] Task: Configure lint-staged
    - [ ] Create `.lintstagedrc.js` config file at project root
    - [ ] Add prettier + eslint auto-fix rules for .ts/.tsx/.js/.jsx files
    - [ ] Add `bun test --bail` for test file patterns
- [ ] Task: Conductor - User Manual Verification 'Setup Dependencies & Configuration' (Protocol in workflow.md)

## Phase 2: Implement Pre-Commit Hook (Line-of-Code Check + Type Checking)

- [ ] Task: Create custom line-of-code check script
    - [ ] Write failing test for `scripts/check-file-size.ts` (should detect file > 500 lines, should pass for file <= 500 lines, should output correct error message with refactor instruction)
    - [ ] Implement `scripts/check-file-size.ts` that reads staged files, counts lines, and exits with non-zero if any file exceeds 500 lines
    - [ ] Verify tests pass
- [ ] Task: Wire type checking into pre-commit
    - [ ] Add `tsc --noEmit` to lint-staged config for pre-commit
    - [ ] Verify type check runs as part of pre-commit (test with intentional type error)
- [ ] Task: Wire line-of-code check into pre-commit
    - [ ] Add the custom script to lint-staged config (`scripts/check-file-size.ts`)
    - [ ] Verify the full pre-commit chain: prettier -> eslint -> test -> tsc -> line-of-code check
- [ ] Task: Conductor - User Manual Verification 'Implement Pre-Commit Hook' (Protocol in workflow.md)

## Phase 3: Implement Pre-Push Hook (Coverage Threshold)

- [ ] Task: Add type checking to pre-push hook
    - [ ] Write `.husky/pre-push` with `bun run type-check`
    - [ ] Verify push is blocked when type errors exist
- [ ] Task: Add coverage threshold check to pre-push
    - [ ] Write failing test for `scripts/check-coverage.ts` (should detect coverage below 80%, should pass for 80%+)
    - [ ] Implement `scripts/check-coverage.ts` that runs `bun test --coverage`, parses output, and blocks push if coverage < 80%
    - [ ] Wire coverage check into `.husky/pre-push`
    - [ ] Verify pre-push blocks when coverage is below 80%
- [ ] Task: Add convenience npm scripts
    - [ ] Add `"pre-commit": "lint-staged"` and `"pre-push": "bun run type-check && bun test --coverage"` to package.json
- [ ] Task: Conductor - User Manual Verification 'Implement Pre-Push Hook' (Protocol in workflow.md)
