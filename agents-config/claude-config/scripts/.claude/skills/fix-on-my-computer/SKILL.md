---
name: fix-on-my-computer
description: Setup wizard that verifies Bun, installs dependencies, runs tests, and fixes failures until every test passes. Use when the scripts repo is broken on this machine.
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

Make this scripts repository work on this machine. Stop only when `bun run test` exits 0.

1. If `bun --version` fails, stop and tell the user to install Bun from https://bun.sh.
2. Confirm the directory has a `package.json` with a `test` script. Windows needs WSL.
3. `bun install`. If it fails, delete `bun.lockb` and retry; then report the error.
4. `bun run test`. While anything fails, apply the smallest fix (missing dep, import path, `path.join`/`os.homedir()`, credentials, TypeScript) and rerun.
5. `bun run lint` and fix if needed.

Report tests passed, each fix, and `READY TO USE`.
