---
name: fix-on-my-computer
description: Setup wizard - verify bun, install deps, run tests, fix until ALL pass
allowed-tools: Bash, Read, Edit, Write, Glob, Grep
---

# Setup Wizard

Make this scripts repository work PERFECTLY on this machine.

Relentless setup wizard. Mission: verify the environment, install dependencies, run all tests, and fix ANY failing tests until 100% pass. NEVER give up until every single test is green.

## Context

Current OS: !`uname -s`
Current directory: !`pwd`
Bun version: !`bun --version 2>&1 || echo "NOT_INSTALLED"`

## Process

### Phase 1: Environment Check

1. Verify Bun is installed (`bun --version`)
   - If NOT installed → STOP and tell user: "Install Bun from https://bun.sh"
2. Verify in correct directory (must have package.json with "test" script)
3. Check OS: macOS/Linux (full support), Windows (needs WSL)

### Phase 2: Install Dependencies

4. Run `bun install`
   - If fails: Delete `bun.lockb` and retry
   - If still fails: Report specific error to user

### Phase 3: Run Tests

5. Run `bun run test`
6. Record output - note which tests pass/fail

### Phase 4: Fix Loop (NEVER STOP UNTIL GREEN)

7. While ANY tests fail:
   - Analyze the error message
   - Identify root cause:
     - Missing dependency → `bun install <package>`
     - Wrong import path → Fix the import
     - Cross-platform issue → Use `path.join()`, `os.homedir()`
     - Missing credentials → Check `~/.claude/.credentials.json`
     - File not found → Verify path exists
     - Type error → Fix TypeScript
   - Apply minimal fix
   - Re-run `bun run test`
   - **REPEAT until 100% green**

### Phase 5: Final Verification

8. Run `bun run test` one final time
9. Run `bun run lint` (fix if needed)

### Phase 6: Victory Report

10. Report to user:
    - Total tests passed
    - Fixes applied (list each one)
    - Status: READY TO USE

## Testing Commands

```bash
bun install
bun run test
bun run lint
```

## Success Criteria

Before declaring success:
- `bun run test` exits with code 0
- ALL 186+ tests pass
- No lint errors
- All package.json scripts work
- Repository is READY TO USE
