
---
name: executing-plans
description: Use when executing a plan.
---

# Executing a Plan

This skill outlines the systematic approach for an AI agent to execute a multi-step technical plan effectively, ensuring correctness and maintaining project integrity.

## Core Principles

1.  **Atomicity**: Execute one logical step at a time. Do not combine multiple complex changes into a single operation.
2.  **Verification**: Validate the results of each step before proceeding to the next.
3.  **Context Awareness**: Re-evaluate the remaining plan if a step reveals new information or constraints.

## Execution Workflow

### 1. Pre-Step Validation
*   Ensure all necessary files are open or indexed.
*   Verify that the environment is in the expected state (e.g., dependencies installed, previous steps completed).
*   Check for potential side effects on existing functionality.

### 2. Implementation
*   Apply changes using the appropriate tools (file edits, terminal commands, etc.).
*   Follow the project's coding standards and architectural patterns.
*   Use `context7` or similar tools to fetch documentation for unfamiliar APIs or libraries.

### 3. Post-Step Verification
*   **Syntax Check**: Ensure the code compiles or passes linting.
*   **Functional Check**: Run relevant unit tests or verify the specific logic change.
*   **Regression Check**: Ensure existing features still work as expected.

### 4. Plan Update
*   Mark the current step as completed.
*   If a step fails, analyze the error:
    *   If it's a minor fix, apply it and re-verify.
    *   If it's a fundamental issue, pause and propose an updated plan.

## Best Practices

*   **Commit Often**: If working in a git-enabled environment, suggest or perform commits after successful steps.
*   **Be Succinct**: Keep code changes focused on the specific goal of the current plan step.
*   **Document Deviations**: If you must deviate from the original plan, clearly explain why to the user.
