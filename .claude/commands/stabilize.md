You are implementing the next Phase 1 stabilization task from the implementation plan.

## Workflow

1. Read `docs/implementation-plan.md` and find the first unchecked Phase 1 task (☐)
2. Read the referenced doc section in `docs/v1-problems-and-v2-plan.md` for full context
3. Read the files listed in "Files to touch" to understand current code
4. Implement the change — keep it minimal and focused on that one task
5. Run tests: `npx jest --no-coverage`
6. If tests pass, mark the task as done (☐ → ☑) in `docs/implementation-plan.md`
7. Commit with a descriptive message referencing the task (e.g. "1a: Add price floor table by route class")

## Rules

- One task per session — do not batch multiple tasks
- Read existing code before modifying — understand before changing
- Don't refactor surrounding code — only change what's needed
- If a task depends on a previous uncompleted task, say so and stop
- If tests fail, fix the issue before marking done
- Keep the user informed of what you're implementing and why
