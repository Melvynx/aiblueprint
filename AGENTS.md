# aiblueprint-cli

AIBlueprint CLI for setting up AI coding configurations.

## Tech Stack

- Bun
- TypeScript
- Vitest

## Commands

- `bun run build` - Build the CLI into `dist/`
- `bun run dev` - Run the CLI from source
- `bun run test:run` - Run tests once

## Rules

The detailed rules live in `.agents/rules/`. Read the relevant file before acting:

- **Commands Documentation** - [.agents/rules/commands-documentation.md](.agents/rules/commands-documentation.md) - Keep user-facing command documentation in sync with command changes

## Universal Rules

- **NEVER** create files unless the user explicitly requested them.
- **NEVER** add generated-by or co-author metadata to commits or pull requests.
