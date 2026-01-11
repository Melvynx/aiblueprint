# Command Validator - CLAUDE.md

This file provides guidance to Claude Code when working with the command-validator security package.

## Project Purpose

**Command Validator** is a security validation package for Claude Code's PreToolUse hook. It validates bash commands before execution to prevent dangerous operations like:
- System destruction (rm -rf /, dd, mkfs)
- Privilege escalation (sudo, chmod, passwd)
- Network attacks (nc, nmap, telnet)
- Malicious patterns (fork bombs, backdoors)
- Sensitive file access (/etc/passwd, /etc/shadow)

The validator is integrated as a hook in Claude Code settings and blocks dangerous commands while allowing safe operations.

## CRITICAL: This Project Uses BUN

**NEVER use npm or node commands. This project exclusively uses BUN.**

## Development Commands

**CRITICAL**: Only use these BUN commands:

### Testing (Primary Workflow)
- `bun test` - Run all tests with Vitest
- `bun test:ui` - Run tests with UI interface
- `bun run test` - Alternative test command

### Code Quality
- `bun run lint` - Run Biome linter and auto-fix
- `bun run format` - Format code with Biome
- `bunx tsc --noEmit` - TypeScript type checking (no build)

### Execution
- `bun src/cli.ts` - Run CLI validator directly
- `bun install` - Install dependencies

## Development Workflow

**CRITICAL**: The majority of work on this project follows this simple cycle:

### Test-Driven Development Cycle
1. **Run tests**: `bun test`
2. **Read errors**: Analyze test failures carefully
3. **Fix the problem**: Make minimal changes to pass tests
4. **Re-run tests**: `bun test` until ALL tests pass
5. **Repeat**: Continue cycle until all tests are green

**ALWAYS follow this workflow:**
```bash
bun test          # See what's broken
# Fix the code
bun test          # Verify fix works
# Repeat until green
```

## Architecture Overview

```
src/
├── cli.ts                 # CLI entry point (used by Claude Code hook)
├── lib/
│   ├── types.ts           # TypeScript interfaces
│   ├── security-rules.ts  # Security rules database
│   └── validator.ts       # Core validation logic
└── __tests__/
    └── validator.test.ts  # Comprehensive test suite (82+ tests)
```

### Key Files
- **@scripts/command-validator/src/lib/validator.ts** - Core CommandValidator class
- **@scripts/command-validator/src/lib/security-rules.ts** - Security rules database
- **@scripts/command-validator/src/__tests__/validator.test.ts** - All test cases

## Code Conventions

- **TypeScript**: Strict mode enabled
- **Testing**: Vitest with comprehensive coverage (82+ tests)
- **Linting**: Biome for formatting and linting
- **Imports**: ESM module format only

## Security Test Categories

The test suite validates:
1. **Safe Commands**: ls, git, npm, cat, cp, mv, mkdir (must allow)
2. **Dangerous Commands**: rm -rf /, dd, sudo, passwd (must block)
3. **Special Cases**: rm -rf safety rules, protected paths, command chains
4. **Malicious Patterns**: Fork bombs, backdoors, log manipulation

## IMPORTANT: Workflow Rules

- **BEFORE making changes**: Run `bun test` to see current state
- **AFTER any code change**: Run `bun test` to verify
- **NEVER assume tests pass**: Always verify with `bun test`
- **Fix one test at a time**: Make minimal changes, then re-test
- **Use Bun ONLY**: No npm, node, or yarn commands

## Common Modifications

Most changes involve:
1. **Adding new security rules** → Update @scripts/command-validator/src/lib/security-rules.ts
2. **Modifying validation logic** → Update @scripts/command-validator/src/lib/validator.ts
3. **Adding test cases** → Update @scripts/command-validator/src/__tests__/validator.test.ts
4. **Run tests after each change** → `bun test`

## Test Execution Priority

**ALWAYS use the test-driven approach:**
- Tests define the requirements
- Code changes must make tests pass
- All 82+ tests must be green before committing
- Use `bun test` continuously during development
