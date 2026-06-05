# Commands Documentation

Keep user-facing command documentation in sync with command behavior.

## When this applies

- Adding, removing, renaming, or changing a CLI command.
- Adding, removing, renaming, or changing an npm, Bun, or package script.
- Changing command arguments, flags, defaults, prompts, examples, generated command files, or visible command output.

## Rules

- **CRITICAL**: Update the relevant documentation in the same change before committing or pushing command changes.
- **ALWAYS** document the command name, arguments, flags, defaults, and any changed examples when they are user-facing.
- **ALWAYS** check the command references in `README.md`, `docs/`, `package.json`, and `agents-config/` when command behavior changes.
- **NEVER** push command changes while the matching documentation is missing, stale, or contradictory.
- **NEVER** document internal-only implementation details unless they affect how users run the command.

## Example

If `aiblueprint agents --skip setup` becomes `aiblueprint agents --skip-setup`, update the CLI implementation, tests, and every user-facing usage example before pushing.
