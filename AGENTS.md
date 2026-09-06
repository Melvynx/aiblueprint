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

## Development servers

- Always use Portly (`portly ...`) to start, stop, restart, inspect, or keep local development servers running.
- Start with `portly status`. Use `--details` only for the full inventory and metrics, and `--json` only for machine-readable fields. Reuse a healthy managed server; if an in-scope server is running outside Portly, register it and use `portly take-over <project/server> --json`.
- For long-lived or reusable work, create a project and server.
- For builds, tests, code generation, previews, demos, and other bounded one-off work, run `job_id="$(portly temp '<command>' --path <folder> --timeout 30m)"`, then `portly wait "$job_id"`. `temp` returns immediately with an ID; `wait` prints captured logs and exits with the command's real code. A timeout kills the whole process group and exits with `124`.
- Never launch persistent development servers directly, in the background, or through another supervisor.

## Universal Rules

- **NEVER** create files unless the user explicitly requested them.
- **NEVER** add generated-by or co-author metadata to commits or pull requests.
