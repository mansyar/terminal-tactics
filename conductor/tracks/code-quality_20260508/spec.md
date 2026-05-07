# Track: Automatic Code Quality Checks with Husky + Lint-Staged

## Overview

Implement automated code quality checks using husky and lint-staged. Developers should not be able to commit or push code that fails defined quality gates. Checks run on staged files only, with auto-fix where possible. The line-of-code check blocks commits with a clear refactoring message.

## Functional Requirements

### FR1: Pre-Commit Hook (via husky + lint-staged)
- **F1.1** Run `prettier --write` on all staged `.ts`, `.tsx`, `.js`, `.jsx` files
- **F1.2** Run `eslint --fix` on all staged `.ts`, `.tsx`, `.js`, `.jsx` files
- **F1.3** Run `bun test --bail` on staged files (run related tests)
- **F1.4** Run `tsc --noEmit` for type checking on the project
- **F1.5** Run a line-of-code check: block the commit if any staged `.ts`, `.tsx`, `.js`, `jsx` file exceeds 500 lines
  - Display a clear error message listing each violating file and line count
  - Message must instruct the developer to **refactor** the file (not simply trim it)
  - Exit with non-zero code to block the commit

### FR2: Pre-Push Hook (via husky)
- **F2.1** Run `tsc --noEmit` for full type checking
- **F2.2** Run `bun test --coverage` with a global threshold of 80%
  - If coverage falls below 80%, block the push and display the coverage report

## Non-Functional Requirements

- **NFR1:** Hooks must be installed automatically via `bun install` (use `husky install` in `postinstall` script)
- **NFR2:** Must use the project's existing ESLint (TanStack config) and Prettier configurations
- **NFR3:** Must use Bun (not npm/pnpm/yarn) for all scripts and tooling
- **NFR4:** The line-of-code check must be a custom lint-staged script/module, not a third-party dependency

## Acceptance Criteria

- [ ] A staged `.ts` or `.tsx` file exceeding 500 lines blocks the commit with a clear refactoring message
- [ ] A staged file that fails ESLint is auto-fixed (where fixable) by lint-staged
- [ ] A staged file with formatting issues is auto-formatted by Prettier
- [ ] A broken type check blocks the commit
- [ ] A failed test blocks the commit
- [ ] A push with test coverage below 80% is blocked with a report
- [ ] Hooks are installed automatically on `bun install`
- [ ] `bun run` scripts are added for pre-commit and pre-push to allow manual triggering

## Out of Scope

- Adding new ESLint plugins, Prettier plugins, or other lint rules
- Configuring lint-staged for non-JS/TS file types (CSS, JSON, etc.)
- CI/CD pipeline changes beyond local hooks
